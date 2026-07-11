<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use Illuminate\Support\Carbon;

class UserTestingSeeder extends Seeder
{
    private $faker;

    public function run(): void
    {
        $this->faker = Faker::create();
        
        $this->command->info('Starting UserTestingSeeder (Comprehensive Integration Test Dataset)...');

        $this->seedEdgeCaseStudents();
        $this->seedCollegeStudents();
        $this->seedBEDStudents();
        $this->seedNTPUsers();

        $this->command->info('Seeding complete.');
    }

    private function generateSessions(User $user, int $count, array $forcedScenarios = [])
    {
        $dates = collect();
        for ($i = 0; $i < $count; $i++) {
            $dates->push(Carbon::now()->subDays(rand(0, 60))->subHours(rand(0, 10))->subMinutes(rand(0, 59)));
        }
        $dates = $dates->sort()->values();

        foreach ($dates as $index => $date) {
            $session = KioskSession::create([
                'user_id' => $user->id,
                'session_number' => KioskSession::where('user_id', $user->id)->max('session_number') + 1,
                'status' => 'completed',
                'started_at' => $date,
                'ended_at' => (clone $date)->addMinutes(rand(3, 8)),
                'login_method' => 'barcode',
                'ip_address' => $this->faker->ipv4,
                'user_agent' => 'Health Kiosk Simulator',
            ]);

            // Determine if this specific session has forced measurements (e.g. for edge cases)
            $forcedRecord = $forcedScenarios[$index] ?? null;
            $recordData = $forcedRecord ? $this->generateForcedMeasurement($forcedRecord) : $this->generateRandomMeasurement();

            $record = HealthRecord::create(array_merge($recordData, [
                'kiosk_session_id' => $session->id,
                'user_id' => $user->id,
                'created_at' => $date,
                'updated_at' => $date,
            ]));

            $this->createAlertIfAbnormal($user, $session, $record, $date, $forcedRecord['alert_state'] ?? 'random');
        }
    }

    private function generateRandomMeasurement()
    {
        // 70% chance of normal, 30% chance of abnormal
        $isAbnormal = rand(1, 100) > 70;
        
        $height = rand(150, 180);
        
        if (!$isAbnormal) {
            $weight = ($height / 100) * ($height / 100) * rand(19, 24); // Normal BMI
            return [
                'temperature' => round($this->faker->randomFloat(1, 36.1, 37.2), 1),
                'heart_rate' => rand(65, 95),
                'spo2' => rand(96, 100),
                'height' => $height,
                'weight' => round($weight, 1),
                'bmi' => round($weight / (($height/100)*($height/100)), 1),
                'bmi_category' => 'Normal',
                'health_status' => 'Normal',
                'advice' => 'Vitals are within the expected range.',
            ];
        }

        // Abnormal generator
        $type = rand(1, 4);
        $temp = round($this->faker->randomFloat(1, 36.1, 37.2), 1);
        $hr = rand(65, 95);
        $spo2 = rand(96, 100);
        $weight = ($height / 100) * ($height / 100) * rand(19, 24);
        $bmiCat = 'Normal';

        switch ($type) {
            case 1: // Temp issue
                $temp = rand(1, 100) > 20 ? round($this->faker->randomFloat(1, 37.8, 39.5), 1) : round($this->faker->randomFloat(1, 35.0, 35.9), 1);
                break;
            case 2: // HR issue
                $hr = rand(1, 100) > 20 ? rand(105, 140) : rand(45, 55);
                break;
            case 3: // SpO2 issue
                $spo2 = rand(88, 94);
                break;
            case 4: // BMI issue
                $bmiType = rand(1, 3);
                if ($bmiType === 1) { $weight = ($height / 100) * ($height / 100) * rand(15, 18); $bmiCat = 'Underweight'; }
                if ($bmiType === 2) { $weight = ($height / 100) * ($height / 100) * rand(25, 29); $bmiCat = 'Overweight'; }
                if ($bmiType === 3) { $weight = ($height / 100) * ($height / 100) * rand(30, 35); $bmiCat = 'Obese'; }
                break;
        }

        $bmi = round($weight / (($height/100)*($height/100)), 1);

        return [
            'temperature' => $temp,
            'heart_rate' => $hr,
            'spo2' => $spo2,
            'height' => $height,
            'weight' => round($weight, 1),
            'bmi' => $bmi,
            'bmi_category' => $bmiCat,
            'health_status' => $bmiCat === 'Obese' ? 'Alert' : 'Watch',
            'advice' => 'Clinic follow-up is recommended.',
        ];
    }

    private function generateForcedMeasurement($config)
    {
        $height = 170;
        $weight = 65;
        $bmiCat = 'Normal';
        $bmi = round($weight / (($height/100)*($height/100)), 1);

        $record = [
            'temperature' => 36.5,
            'heart_rate' => 75,
            'spo2' => 98,
            'height' => $height,
            'weight' => $weight,
            'bmi' => $bmi,
            'bmi_category' => $bmiCat,
            'health_status' => 'Normal',
            'advice' => 'Vitals are within the expected range.',
        ];

        if (isset($config['temp'])) { $record['temperature'] = $config['temp']; $record['health_status'] = 'Watch'; }
        if (isset($config['hr'])) { $record['heart_rate'] = $config['hr']; $record['health_status'] = 'Watch'; }
        if (isset($config['spo2'])) { $record['spo2'] = $config['spo2']; $record['health_status'] = 'Watch'; }

        return $record;
    }

    private function createAlertIfAbnormal(User $user, KioskSession $session, HealthRecord $record, Carbon $date, $state)
    {
        $abnormalities = [];
        
        if ($record->temperature >= 37.8 || $record->temperature < 36.0) $abnormalities[] = 'temperature';
        if ($record->heart_rate > 100 || $record->heart_rate < 60) $abnormalities[] = 'heart_rate';
        if ($record->spo2 < 95) $abnormalities[] = 'spo2';
        if (in_array($record->bmi_category, ['Underweight', 'Overweight', 'Obese'])) $abnormalities[] = 'bmi';

        foreach ($abnormalities as $type) {
            $isResolved = false;
            
            if ($state === 'resolved') $isResolved = true;
            else if ($state === 'pending') $isResolved = false;
            else if ($state === 'random') $isResolved = rand(1, 100) > 40; // 60% resolved

            $alert = Alert::create([
                'user_id' => $user->id,
                'kiosk_session_id' => $session->id,
                'type' => $type,
                'severity' => 'medium',
                'title' => ucfirst(str_replace('_', ' ', $type)) . ' Alert',
                'message' => "Abnormal $type reading detected.",
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            if ($isResolved) {
                // Determine a realistic new measurement based on the type
                $newVal = '';
                if ($type === 'temperature') $newVal = round($this->faker->randomFloat(1, 36.3, 37.1), 1) . ' °C';
                if ($type === 'heart_rate') $newVal = rand(70, 90) . ' bpm';
                if ($type === 'spo2') $newVal = rand(97, 100) . ' %';

                $alert->update([
                    'read_at' => (clone $date)->addMinutes(rand(10, 60)),
                    'new_measurement' => $newVal,
                    'resolution_notes' => 'Patient rested and vitals normalized. Cleared to return to class.',
                    'resolved_by' => 1, // Admin
                ]);
            }
        }
    }

    private function seedEdgeCaseStudents()
    {
        $this->command->info('Seeding Edge Case Students...');

        // Hans Filart (Multiple alerts, some resolved, one pending)
        $hans = User::where('email', 'hanskurveyfilart@smcbi.edu.ph')->first();
        if ($hans) {
            DB::table('alerts')->where('user_id', $hans->id)->delete();
            DB::table('health_records')->where('user_id', $hans->id)->delete();
            DB::table('kiosk_sessions')->where('user_id', $hans->id)->delete();
            
            $this->generateSessions($hans, 3, [
                0 => ['temp' => 38.5, 'alert_state' => 'resolved'],
                1 => ['hr' => 120, 'alert_state' => 'resolved'],
                2 => ['spo2' => 92, 'alert_state' => 'pending'] // Keeps him in Follow-up
            ]);
        }

        // Scenario A Student (High Temp + Low SpO2 + High HR — all Pending)
        $studentA = User::create([
            'firstname' => 'Scenario',
            'lastname' => 'A Student',
            'student_id' => 'C-SCENA',
            'email' => 'scenario.a@smcbi.edu.ph',
            'role' => 'student',
            'department' => null,
            'year_level' => '2nd Year',
            'program' => 'BSIT',
            'birthday' => now()->subYears(20)->format('Y-m-d'),
            'gender' => 'male',
            'barcode' => 'C-SCENA',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->generateSessions($studentA, 1, [
            0 => ['temp' => 39.1, 'hr' => 130, 'spo2' => 90, 'alert_state' => 'pending']
        ]);

        // Scenario B Student (High Temp Resolved + Low SpO2 Pending)
        $studentB = User::create([
            'firstname' => 'Scenario',
            'lastname' => 'B Student',
            'student_id' => 'C-SCENB',
            'email' => 'scenario.b@smcbi.edu.ph',
            'role' => 'student',
            'department' => null,
            'year_level' => '3rd Year',
            'program' => 'BSIT',
            'birthday' => now()->subYears(21)->format('Y-m-d'),
            'gender' => 'female',
            'barcode' => 'C-SCENB',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->generateSessions($studentB, 2, [
            0 => ['temp' => 38.7, 'alert_state' => 'resolved'],
            1 => ['spo2' => 91, 'alert_state' => 'pending']
        ]);

        // Scenario C Student (All alerts resolved)
        $studentC = User::create([
            'firstname' => 'Scenario',
            'lastname' => 'C Student',
            'student_id' => 'C-SCENC',
            'email' => 'scenario.c@smcbi.edu.ph',
            'role' => 'student',
            'department' => null,
            'year_level' => '4th Year',
            'program' => 'BSED',
            'birthday' => now()->subYears(22)->format('Y-m-d'),
            'gender' => 'male',
            'barcode' => 'C-SCENC',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->generateSessions($studentC, 2, [
            0 => ['temp' => 38.2, 'alert_state' => 'resolved'],
            1 => ['hr' => 115, 'alert_state' => 'resolved']
        ]);

        // Student D (Normal -> High Temp -> Resolved -> Normal -> High Temp)
        $studentD = User::create([
            'firstname' => 'Student',
            'lastname' => 'D Scenario',
            'student_id' => 'C-SCEND',
            'email' => 'scenario.d@smcbi.edu.ph',
            'role' => 'student',
            'department' => null,
            'year_level' => '1st Year',
            'program' => 'BEED',
            'birthday' => now()->subYears(19)->format('Y-m-d'),
            'gender' => 'female',
            'barcode' => 'C-SCEND',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->generateSessions($studentD, 4, [
            0 => ['temp' => 36.5, 'alert_state' => 'none'],
            1 => ['temp' => 38.6, 'alert_state' => 'resolved'],
            2 => ['temp' => 36.6, 'alert_state' => 'none'],
            3 => ['temp' => 38.9, 'alert_state' => 'pending']
        ]);
    }

    private function seedCollegeStudents()
    {
        $this->command->info('Seeding College Students...');
        $programs = [
            'BSIT' => 16, // 4 per year
            'BSED' => 8,
            'BEED' => 8,
            'BSBA' => 8,
            'BSHM' => 8
        ];
        $years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

        foreach ($programs as $prog => $count) {
            $perYear = $count / 4;
            foreach ($years as $year) {
                for ($i = 0; $i < $perYear; $i++) {
                    $gender = rand(0, 1) ? 'male' : 'female';
                    $user = User::create([
                        'firstname' => $this->faker->firstName($gender),
                        'lastname' => $this->faker->lastName,
                        'student_id' => 'C-' . $this->faker->unique()->numerify('######'),
                        'email' => $this->faker->unique()->safeEmail,
                        'role' => 'student',
                        'department' => null,
                        'year_level' => $year,
                        'program' => $prog,
                        'birthday' => now()->subYears(rand(18, 25))->format('Y-m-d'),
                        'gender' => $gender,
                        'barcode' => 'BC-C' . $this->faker->unique()->numerify('######'),
                        'password' => Hash::make('password123'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]);
                    $this->generateSessions($user, rand(5, 10));
                }
            }
        }
    }

    private function seedBEDStudents()
    {
        $this->command->info('Seeding BED Students...');
        $grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
        foreach ($grades as $grade) {
            for ($i = 0; $i < 4; $i++) {
                $gender = rand(0, 1) ? 'male' : 'female';
                $user = User::create([
                    'firstname' => $this->faker->firstName($gender),
                    'lastname' => $this->faker->lastName,
                    'student_id' => 'B-' . $this->faker->unique()->numerify('######'),
                    'email' => $this->faker->unique()->safeEmail,
                    'role' => 'student',
                    'department' => null,
                    'grade_level' => $grade,
                    'birthday' => now()->subYears(rand(12, 16))->format('Y-m-d'),
                    'gender' => $gender,
                    'barcode' => 'BC-B' . $this->faker->unique()->numerify('######'),
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]);
                $this->generateSessions($user, rand(5, 10));
            }
        }

        $shsGrades = ['11', '12'];
        $strands = ['STEM', 'ABM', 'HUMSS'];
        foreach ($shsGrades as $year) {
            foreach ($strands as $strand) {
                for ($i = 0; $i < 4; $i++) {
                    $gender = rand(0, 1) ? 'male' : 'female';
                    $user = User::create([
                        'firstname' => $this->faker->firstName($gender),
                        'lastname' => $this->faker->lastName,
                        'student_id' => 'B-' . $this->faker->unique()->numerify('######'),
                        'email' => $this->faker->unique()->safeEmail,
                        'role' => 'student',
                        'department' => null,
                        'grade_level' => null,
                        'strand' => "{$strand} {$year}",
                        'birthday' => now()->subYears(rand(16, 18))->format('Y-m-d'),
                        'gender' => $gender,
                        'barcode' => 'BC-B' . $this->faker->unique()->numerify('######'),
                        'password' => Hash::make('password123'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]);
                    $this->generateSessions($user, rand(5, 10));
                }
            }
        }
    }

    private function seedNTPUsers()
    {
        $this->command->info('Seeding Personnel (Instructors & NTP)...');
        $departments = ['COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP'];
        for ($i = 0; $i < 20; $i++) {
            $gender = rand(0, 1) ? 'male' : 'female';
            $user = User::create([
                'firstname' => $this->faker->firstName($gender),
                'lastname' => $this->faker->lastName,
                'student_id' => null, // NTP usually don't have student IDs, maybe Employee ID but student_id is nullable
                'email' => $this->faker->unique()->safeEmail,
                'role' => 'personnel',
                'department' => $this->faker->randomElement($departments),
                'birthday' => now()->subYears(rand(25, 60))->format('Y-m-d'),
                'gender' => $gender,
                'barcode' => 'BC-N' . $this->faker->unique()->numerify('######'),
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $this->generateSessions($user, rand(5, 10));
        }
    }
}
