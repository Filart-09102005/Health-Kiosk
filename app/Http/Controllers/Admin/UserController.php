<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserIndexRequest;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\SupabaseAuthUserService;
use App\Services\SupabaseUserSyncService;
use App\Support\Departments;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(UserIndexRequest $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->validated();
        $perPage = min((int) ($filters['per_page'] ?? 100), 500);

        $users = User::query()
            ->select([
                'id',
                'firstname',
                'lastname',
                'student_id',
                'email',
                'email_verified_at',
                'role',
                'department',
                'birthday',
                'gender',
                'barcode',
                'grade_level',
                'strand',
                'year_level',
                'program',
                'is_active',
                'created_at',
                'updated_at',
            ])
            ->when($filters['role'] ?? null, function ($query, $role) {
                if (in_array(strtolower($role), ['teacher', 'personnel', 'staff', 'faculty'])) {
                    $query->whereIn('role', ['teacher', 'personnel', 'staff', 'faculty']);
                } else {
                    $query->where('role', $role);
                }
            })
            ->when($filters['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($users);
    }

    /**
     * Strip the academic fields that do not belong to the chosen department.
     *
     * Basic Education uses grade level and strand; College uses year level and
     * program. Nothing enforced that, so an account edited from one to the other
     * kept both sets - and analytics then counted that student twice, once under
     * a grade group and once under a course, producing two identical bars from
     * one person's single record.
     *
     * @return array{grade_level: ?string, strand: ?string, year_level: ?string, program: ?string}
     */
    /**
     * A student cannot hold a staff department, and staff cannot hold a student
     * cohort. The forms only offer the right list, but a mismatched pair filed
     * here would misplace the account in every report and chart afterwards.
     */
    private function assertDepartmentMatchesRole(string $role, string $department): void
    {
        if (Departments::allowed($role, $department)) {
            return;
        }

        throw ValidationException::withMessages([
            'department' => sprintf(
                'A %s account must belong to one of: %s.',
                Departments::isStaffRole($role) ? 'teacher or staff' : 'student',
                implode(', ', Departments::forRole($role)),
            ),
        ]);
    }

    private function academicFieldsFor(array $validated): array
    {
        $isBasicEducation = strtoupper((string) ($validated['department'] ?? '')) === 'BED';
        $isStudent = ($validated['role'] ?? null) === 'student';

        if (! $isStudent) {
            return ['grade_level' => null, 'strand' => null, 'year_level' => null, 'program' => null];
        }

        return $isBasicEducation
            ? [
                'grade_level' => $validated['grade_level'] ?? null,
                'strand' => $validated['strand'] ?? null,
                'year_level' => null,
                'program' => null,
            ]
            : [
                'grade_level' => null,
                'strand' => null,
                'year_level' => $validated['year_level'] ?? null,
                'program' => $validated['program'] ?? null,
            ];
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        $validated = $request->validate([
            'firstname' => ['required', 'string', 'max:100'],
            'lastname' => ['required', 'string', 'max:100'],
            'student_id' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:student,teacher,personnel,staff,faculty'],
            // Required, and checked against the role below. These were nullable
            // with a silent fallback, so a form submitted with the birthday and
            // gender blank created the account anyway and reported success.
            'department' => ['required', 'string', 'max:100'],
            'birthday' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', 'in:male,female,other'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:users,barcode'],
            'grade_level' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:100'],
            'year_level' => ['nullable', 'string', 'max:100'],
            'program' => ['nullable', 'string', 'max:100'],
        ]);

        $this->assertDepartmentMatchesRole($validated['role'], $validated['department']);

        if (empty($validated['barcode'])) {
            $validated['barcode'] = 'SMC-'.strtoupper(Str::random(8));
        }

        $user = User::create([
            'firstname' => $validated['firstname'],
            'lastname' => $validated['lastname'],
            // `student_id` doubles as a generic "ID number" for every role
            // here, teachers/personnel included - not just students. The
            // column name is a holdover; renaming it is a bigger change than
            // this fix warrants, so it's just noted here for whoever reads it
            // next.
            'student_id' => $validated['barcode'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'department' => strtoupper(trim($validated['department'])),
            'birthday' => $validated['birthday'],
            'gender' => $validated['gender'],
            'barcode' => $validated['barcode'],
            'is_active' => true,
            ...$this->academicFieldsFor($validated),
            'email_verified_at' => now(),
        ]);

        ActivityLog::record('admin_user_create', $request->user(), $request, "Admin created new user account {$user->email}.", [
            'created_user_id' => $user->id,
        ]);

        // Give the account a Supabase Auth login so the student can sign in to
        // the companion app. Without this an admin-created account only ever got
        // a public.users profile row - it appeared in the cloud sync but never
        // in Authentication, so it could never actually log in. Only web
        // registration and password reset used to create one.
        //
        // Deferred until after the response for the same reason the user sync
        // is: it is a ~1-2s round trip and the admin should not wait for it.
        // The plaintext password only exists here, so it has to be captured now.
        $plainPassword = $validated['password'];

        dispatch(function () use ($user, $plainPassword) {
            try {
                app(SupabaseAuthUserService::class)->createOrUpdate($user, $plainPassword);
            } catch (\Throwable $e) {
                Log::error('Supabase Auth account creation failed for new user.', [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);

                ActivityLog::record(
                    'supabase_auth_create_failed',
                    null,
                    null,
                    "Could not create a Supabase login for {$user->email}. They will not be able to sign in to the companion app until this is retried.",
                    ['email' => $user->email],
                );
            }
        })->afterResponse();

        return response()->json([
            'message' => 'User account created successfully.',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        Gate::authorize('update', $user);

        $validated = $request->validate([
            'firstname' => ['required', 'string', 'max:100'],
            'lastname' => ['required', 'string', 'max:100'],
            'student_id' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['required', 'string', 'in:student,teacher,personnel,staff,faculty'],
            // Required, and checked against the role below. These were nullable
            // with a silent fallback, so a form submitted with the birthday and
            // gender blank created the account anyway and reported success.
            'department' => ['required', 'string', 'max:100'],
            'birthday' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', 'in:male,female,other'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:users,barcode,'.$user->id],
            'grade_level' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:100'],
            'year_level' => ['nullable', 'string', 'max:100'],
            'program' => ['nullable', 'string', 'max:100'],
        ]);

        $this->assertDepartmentMatchesRole($validated['role'], $validated['department']);

        // `barcode` is nullable, so it is absent from $validated when the client
        // omits it. Reading it blind warned about an undefined key and, worse,
        // wrote null over the account's existing barcode - silently breaking
        // barcode login for that student.
        $barcode = $validated['barcode'] ?? $user->barcode;

        $user->update([
            'firstname' => $validated['firstname'],
            'lastname' => $validated['lastname'],
            'student_id' => $barcode,
            'email' => strtolower($validated['email']),
            'role' => $validated['role'],
            'department' => strtoupper(trim($validated['department'])),
            'birthday' => $validated['birthday'],
            'gender' => $validated['gender'],
            'barcode' => $barcode,
            ...$this->academicFieldsFor($validated),
        ]);

        ActivityLog::record('admin_user_update', $request->user(), $request, "Admin updated user account {$user->email}.", [
            'updated_user_id' => $user->id,
        ]);

        // Same as store(): the saved observer pushes to Supabase after the
        // response, so syncing inline only made the admin wait for it twice.

        return response()->json([
            'message' => 'User account updated successfully.',
            'user' => $user,
        ]);
    }

    public function verify(Request $request, User $user): JsonResponse
    {
        Gate::authorize('update', $user);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'User is already verified.']);
        }

        $user->markEmailAsVerified();
        // Keep the companion-app login in step with the local account. The
        // normal email-link flow dispatches this event, but manual admin
        // verification previously did not, leaving Supabase Auth unconfirmed.
        event(new Verified($user));

        ActivityLog::record('admin_user_verify', $request->user(), $request, "Admin manually verified user account {$user->email}.", [
            'verified_user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'User account manually verified successfully.',
            'user' => $user,
        ]);
    }

    /**
     * Flip an account between active and inactive. An inactive account is
     * blocked from signing in (see AuthController::login()/barcodeLogin())
     * but its row and history stay intact - this is how an admin corrects
     * that, since nothing else in the admin UI could reach `is_active` at
     * all before this endpoint existed.
     */
    public function toggleActive(
        Request $request,
        User $user,
        SupabaseAuthUserService $supabaseAuth,
        SupabaseUserSyncService $supabaseUsers,
    ): JsonResponse {
        Gate::authorize('update', $user);

        abort_if($request->user()->is($user), 422, "You can't deactivate your own account.");

        $wasActive = (bool) $user->is_active;
        $willBeActive = ! $wasActive;

        // Supabase Auth is the enforcement point for the companion app. Update
        // it first and wait for confirmation; otherwise the admin UI could say
        // "deactivated" while the account could still obtain a login session.
        try {
            $supabaseAuth->updateActiveStatus($user, $willBeActive);
        } catch (\Throwable $exception) {
            Log::error('Could not enforce companion-app account activation status.', [
                'email' => $user->email,
                'is_active' => $willBeActive,
                'error' => $exception->getMessage(),
            ]);

            ActivityLog::record(
                'supabase_auth_status_sync_failed',
                $request->user(),
                $request,
                "Could not update the companion-app activation status for {$user->email}.",
                ['email' => $user->email, 'is_active' => $willBeActive, 'error' => $exception->getMessage()],
            );

            return response()->json([
                'message' => 'Account status was not changed because Supabase could not confirm it. Please try again.',
            ], 502);
        }

        try {
            $user->update(['is_active' => $willBeActive]);
        } catch (\Throwable $exception) {
            // The cloud changed but the local save failed. Restore the cloud
            // status immediately so neither side silently disagrees.
            try {
                $supabaseAuth->updateActiveStatus($user, $wasActive);
            } catch (\Throwable $rollbackException) {
                Log::critical('Could not roll back Supabase Auth after a local activation save failed.', [
                    'email' => $user->email,
                    'error' => $rollbackException->getMessage(),
                ]);
            }

            throw $exception;
        }

        $verb = $user->is_active ? 'activated' : 'deactivated';
        $action = $user->is_active ? 'admin_user_activate' : 'admin_user_deactivate';

        $profileSynced = true;

        try {
            // Also update public.users before returning. Some companion screens
            // read the profile row even though Auth now independently enforces
            // the ban. The observer remains as an automatic retry fallback.
            $supabaseUsers->syncUser($user->fresh());
        } catch (\Throwable $exception) {
            $profileSynced = false;
            Log::warning('Supabase Auth status changed, but the public user profile sync is pending.', [
                'email' => $user->email,
                'is_active' => $user->is_active,
                'error' => $exception->getMessage(),
            ]);
        }

        ActivityLog::record($action, $request->user(), $request, "Admin {$verb} user account {$user->email}.", [
            'user_id' => $user->id,
            'supabase_profile_synced' => $profileSynced,
        ]);

        return response()->json([
            'message' => $profileSynced
                ? "User account {$verb} successfully in the kiosk and companion app."
                : "User account {$verb}; companion login access is updated and the profile sync is retrying.",
            'user' => $user,
            'cloud_synced' => $profileSynced,
        ], $profileSynced ? 200 : 202);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        Gate::authorize('delete', $user);

        $email = $user->email;
        $id = $user->id;

        // Always a real, permanent delete - health_records, kiosk_sessions,
        // session_measurements, session_activities and user_notifications all
        // cascade-delete on user_id at the database level (see their
        // migrations), and alerts/activity_logs null out user_id instead of
        // disappearing, so the audit trail and alert history survive the
        // account itself. This used to deactivate (is_active = false) an
        // account that had taken at least one measurement, to avoid losing
        // its clinical history - but that left the row, and its email/
        // barcode/student_id, permanently stuck as "already registered"
        // with no way for an admin to actually free them up again.
        $user->delete();

        ActivityLog::record('admin_user_delete', $request->user(), $request, "Admin deleted user account {$email}.", [
            'deleted_user_id' => $id,
        ]);

        // No Supabase call here: syncUsers() only pushes users that still exist
        // locally, so it can never express a deletion. UserObserver::deleted()
        // removes the Auth account and the profile row, and it fires for every
        // delete path rather than only this endpoint.

        return response()->json([
            'message' => 'User account deleted successfully.',
            'deactivated' => false,
            'deleted' => true,
        ]);
    }
}
