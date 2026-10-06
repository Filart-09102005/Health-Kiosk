<?php

namespace App\Imports;

use App\Models\User;
use App\Support\Departments;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Str;

class RegisteredUserImport implements ToCollection, WithHeadingRow
{
    protected string $expectedRole;
    protected array $results = [
        'successful' => 0,
        'already_registered' => 0,
        'wrong_role' => 0,
        'invalid_data' => 0,
        'errors' => [],
    ];

    public function __construct(string $expectedRole)
    {
        $this->expectedRole = strtolower($expectedRole);
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            // WithHeadingRow gives us keys based on the header row, sluggified (e.g. 'first_name').
            // To be robust against spacing/capitalization, we map them carefully.
            $mappedRow = $this->mapRow($row);

            $rowNumber = $index + 2; // +1 for 0-index, +1 for heading row
            $identifier = $mappedRow['student_id'] ?? $mappedRow['email'] ?? "Row {$rowNumber}";

            // Check if required fields are missing completely (this catches completely blank rows too)
            if (empty($mappedRow['firstname']) || empty($mappedRow['email']) || empty($mappedRow['role'])) {
                if (empty(array_filter($row->toArray()))) {
                    continue; // Skip completely empty rows
                }
                $this->addError($rowNumber, 'Unknown', $identifier, 'Missing Required Field (First Name, Email, or Role)');
                continue;
            }

            $name = $mappedRow['firstname'] . ' ' . ($mappedRow['lastname'] ?? '');

            // 1. Role validation
            $rowRole = strtolower($mappedRow['role']);
            if ($rowRole !== $this->expectedRole) {
                $this->results['wrong_role']++;
                $this->addError($rowNumber, $name, $identifier, "Wrong Role: Expected {$this->expectedRole}, got {$rowRole}");
                continue;
            }

            // 2. Duplicate handling (Check Email or Student ID)
            $existing = User::where('email', $mappedRow['email'])
                ->orWhere(function ($query) use ($mappedRow) {
                    if (!empty($mappedRow['student_id'])) {
                        $query->where('student_id', $mappedRow['student_id']);
                    }
                })->first();

            if ($existing) {
                $this->results['already_registered']++;
                $this->addError($rowNumber, $name, $identifier, 'Already Registered');
                continue;
            }

            // 3. Data Validation
            $validator = Validator::make($mappedRow, [
                'firstname' => ['required', 'string', 'max:100'],
                'lastname' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email', 'max:255'],
                'student_id' => ['nullable', 'string', 'max:100'],
                'gender' => ['required', 'string', 'in:male,female,other'],
                'birthday' => ['required', 'date'],
                'department' => ['required', 'string', 'max:100'],
                'grade_level' => ['nullable', 'string', 'max:100'],
                'strand' => ['nullable', 'string', 'max:100'],
                'year_level' => ['nullable', 'string', 'max:100'],
                'program' => ['nullable', 'string', 'max:100'],
            ]);

            if ($validator->fails()) {
                $this->results['invalid_data']++;
                $errorMsg = collect($validator->errors()->all())->join('; ');
                $this->addError($rowNumber, $name, $identifier, "Invalid Data: {$errorMsg}");
                continue;
            }

            $validated = $validator->validated();
            $department = strtoupper(trim($validated['department']));
            
            // Check department matches role
            if (!Departments::allowed($rowRole, $department)) {
                $this->results['invalid_data']++;
                $this->addError($rowNumber, $name, $identifier, "Invalid Department: {$department} is not valid for {$rowRole}");
                continue;
            }

            // Academic fields validation
            if ($rowRole === 'student') {
                if ($department === 'COLLEGE') {
                    if (empty($validated['year_level']) || empty($validated['program'])) {
                        $this->results['invalid_data']++;
                        $this->addError($rowNumber, $name, $identifier, 'Missing Required Field: year_level and program are required for COLLEGE');
                        continue;
                    }
                } elseif ($department === 'BED') {
                    if (empty($validated['grade_level'])) {
                        $this->results['invalid_data']++;
                        $this->addError($rowNumber, $name, $identifier, 'Missing Required Field: grade_level is required for BED');
                        continue;
                    }

                    $gradeLevel = strtolower($validated['grade_level']);
                    $needsStrand = str_contains($gradeLevel, '11') || str_contains($gradeLevel, '12');
                    
                    if ($needsStrand) {
                        $strand = strtoupper(trim((string)($validated['strand'] ?? '')));
                        if (empty($strand) || !in_array($strand, ['ABM', 'HUMSS', 'STEM'])) {
                            $this->results['invalid_data']++;
                            $this->addError($rowNumber, $name, $identifier, 'Missing Required Field: Valid strand (ABM, HUMSS, STEM) is required for Grade 11/12');
                            continue;
                        }
                    }
                }
            }

            // 4. Creation
            try {
                DB::transaction(function () use ($validated, $rowRole, $department, &$plainPassword, &$user) {
                    // The physical ID card's barcode matches the school's own ID
                    // number, so an imported row that already has one has to
                    // become the login barcode too - a random one here would
                    // permanently disconnect the account from that card. Only
                    // rows with no ID Number at all (e.g. some personnel) fall
                    // back to a generated one.
                    $barcode = empty($validated['student_id']) ? User::generateUniqueBarcode() : $validated['student_id'];

                    $plainPassword = $validated['firstname'] . '12345';

                    $academicFields = $this->getAcademicFields($rowRole, $department, $validated);

                    $user = clone User::create([
                        'firstname' => $validated['firstname'],
                        'lastname' => $validated['lastname'],
                        'student_id' => $validated['student_id'] ?? $barcode, // ID Number
                        'email' => strtolower($validated['email']),
                        'password' => Hash::make($plainPassword),
                        'role' => $rowRole,
                        'department' => $department,
                        'birthday' => $validated['birthday'],
                        'gender' => strtolower($validated['gender']),
                        'barcode' => $barcode,
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ])->fill($academicFields);
                    
                    $user->save();
                });

                // Dispatch Supabase Sync
                dispatch(function () use ($user, $plainPassword) {
                    try {
                        app(\App\Services\SupabaseAuthUserService::class)->createOrUpdate($user, $plainPassword);
                    } catch (\Throwable $e) {
                        Log::error('Supabase Auth account creation failed for imported user.', [
                            'email' => $user->email,
                            'error' => $e->getMessage(),
                        ]);
                    }
                })->afterResponse();

                $this->results['successful']++;

            } catch (\Exception $e) {
                $this->results['invalid_data']++;
                $this->addError($rowNumber, $name, $identifier, 'Database Error: ' . $e->getMessage());
                Log::error('User Import Error', ['error' => $e->getMessage(), 'row' => $rowNumber]);
            }
        }
    }

    public function getResults(): array
    {
        return $this->results;
    }

    protected function addError(int $row, string $name, string $identifier, string $reason): void
    {
        $this->results['errors'][] = [
            'row' => $row,
            'name' => $name,
            'id' => $identifier,
            'reason' => $reason,
        ];
    }

    protected function mapRow($row): array
    {
        // Maatwebsite\Excel\Concerns\WithHeadingRow automatically sluggifies headers.
        // For example: "First Name" -> "first_name", "ID Number" -> "id_number"
        // We will map these potential variations to our exact fields.
        
        $rowArr = $row->toArray();
        
        $getValue = function($keys) use ($rowArr) {
            foreach ((array)$keys as $key) {
                if (isset($rowArr[$key])) {
                    return $rowArr[$key];
                }
            }
            return null;
        };

        $birthday = $getValue(['birthday', 'date_of_birth', 'dob']);
        if (is_numeric($birthday)) {
            try {
                $birthday = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($birthday)->format('Y-m-d');
            } catch (\Exception $e) {
                // let validation catch it
            }
        }

        return [
            'firstname' => $getValue(['first_name', 'firstname', 'fname']),
            'lastname' => $getValue(['last_name', 'lastname', 'lname']),
            'email' => $getValue(['email', 'email_address']),
            // "barcode" is a real column header this school's export uses (in
            // addition to "ID Number"/"student_id"/"id") - it was missing
            // from this list entirely, so a file using it looked like it had
            // no ID at all, and every row silently got a random generated
            // barcode instead of the real one sitting right there in the file.
            'student_id' => $this->asExactString($getValue(['id_number', 'student_id', 'id', 'barcode'])),
            'gender' => $getValue(['gender', 'sex']),
            'birthday' => $birthday,
            'role' => $getValue(['role', 'user_role']),
            'department' => $getValue(['department', 'dept']),
            'grade_level' => $getValue(['grade_level', 'grade']),
            'strand' => $getValue(['strand']),
            'year_level' => $getValue(['year_level', 'year']),
            'program' => $getValue(['program', 'course']),
        ];
    }

    /**
     * The ID Number column is text (student IDs/barcodes routinely contain
     * letters, dashes, or a leading zero), but if the Excel cell itself was
     * left in a Number/General format, PhpSpreadsheet hands it back as a raw
     * PHP int/float instead of the string it should be treated as. Left
     * alone, that either fails the "student_id must be a string" validation
     * rule outright for a large ID, or - worse - PHP's default string
     * casting flips a big enough number into scientific notation
     * ("4.9012345678E+12"), which then gets saved as the account's barcode.
     *
     * This does not (and cannot) restore a leading zero the school's Excel
     * file already lost: if "00123456" was typed into a Number-formatted
     * cell, Excel itself stores it as the plain number 123456 - that zero is
     * gone before this import ever reads the file. The ID Number column
     * needs to be formatted as Text in Excel for IDs that have one.
     */
    protected function asExactString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value)) {
            return (string) $value;
        }

        if (is_float($value)) {
            // number_format at 0 decimals never switches to scientific
            // notation, unlike a plain (string) cast on a large float.
            return number_format($value, 0, '.', '');
        }

        return trim((string) $value);
    }

    protected function getAcademicFields(string $role, string $department, array $validated): array
    {
        if ($role !== 'student') {
            return ['grade_level' => null, 'strand' => null, 'year_level' => null, 'program' => null];
        }

        if ($department === 'BED') {
            return [
                'grade_level' => $validated['grade_level'] ?? null,
                'strand' => $validated['strand'] ?? null,
                'year_level' => null,
                'program' => null,
            ];
        }

        return [
            'grade_level' => null,
            'strand' => null,
            'year_level' => $validated['year_level'] ?? null,
            'program' => $validated['program'] ?? null,
        ];
    }
}
