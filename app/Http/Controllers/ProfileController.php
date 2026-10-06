<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\SupabaseAuthUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $validated = $request->validate([
                'firstname' => ['required', 'string', 'max:255'],
                'lastname' => ['required', 'string', 'max:255'],
            ]);
        } else {
            $validated = $request->validate([
                'firstname' => ['required', 'string', 'max:255'],
                'lastname' => ['required', 'string', 'max:255'],
                'department' => ['required', Rule::in(['COLLEGE', 'NTP', 'BED', 'COLLEGE INSTRUCTOR', 'BED INSTRUCTOR'])],
                'grade_level' => [
                    'nullable',
                    Rule::requiredIf(fn () => $request->input('department') === 'BED' && $user->role === 'student'),
                    Rule::in(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
                ],
                'strand' => [
                    'nullable',
                    Rule::requiredIf(fn () => $request->input('department') === 'BED' && $user->role === 'student'
                        && in_array($request->input('grade_level'), ['Grade 11', 'Grade 12'], true)),
                    Rule::in(['ABM', 'HUMSS', 'STEM']),
                ],
                'year_level' => [
                    'nullable',
                    Rule::requiredIf(fn () => $request->input('department') === 'COLLEGE' && $user->role === 'student'),
                    Rule::in(['1st Year', '2nd Year', '3rd Year', '4th Year']),
                ],
                'program' => [
                    'nullable',
                    Rule::requiredIf(fn () => $request->input('department') === 'COLLEGE' && $user->role === 'student'),
                    Rule::in(['BSIT', 'BSED', 'BEED', 'BSHM', 'BSBA']),
                ],
                'gender' => ['required', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
                'birthday' => ['required', 'date', 'before:today'],
            ]);
        }

        $user->update($validated);

        ActivityLog::record('profile_updated', $user, $request, 'User updated their profile.');

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->only(['id', 'firstname', 'lastname', 'email', 'role']),
        ]);
    }

    public function updatePassword(Request $request, SupabaseAuthUserService $supabaseAuth): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current' => ['required', 'current_password'],
            'next' => ['required', 'confirmed', Password::defaults()],
        ], [
            'next.confirmed' => 'The password confirmation does not match.',
            'current.current_password' => 'The provided password does not match your current password.',
        ], [
            // Without these the rule messages surface the raw field names, e.g.
            // "The next field must contain at least one symbol."
            'current' => 'current password',
            'next' => 'new password',
        ]);

        $user->update([
            'password' => Hash::make($validated['next']),
        ]);

        // The password-reset flow already kept Supabase Auth in step with the
        // local password (same method call); this one didn't, so a password
        // changed here silently left the companion app signed in with the old
        // one. Failure here doesn't block the response - the local password
        // change has already succeeded, and syncUsers() will retry the
        // profile row later regardless.
        try {
            $supabaseAuth->createOrUpdate($user, $validated['next']);
        } catch (\Throwable $exception) {
            report($exception);
        }

        ActivityLog::record('password_updated', $user, $request, 'User updated their password.');

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}
