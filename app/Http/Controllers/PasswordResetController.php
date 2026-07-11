<?php

namespace App\Http\Controllers;

use App\Services\SupabaseAuthUserService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink($validated);

        return response()->json([
            'message' => $status === Password::RESET_LINK_SENT
                ? 'Password reset link sent. Please check your school email.'
                : 'If this email exists, a password reset link will be sent.',
        ], $status === Password::RESET_THROTTLED ? 429 : 200);
    }

    public function reset(Request $request, SupabaseAuthUserService $supabaseAuth): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $status = Password::reset(
            $validated,
            function ($user, string $password) use ($supabaseAuth) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                    'sync_status' => 0,
                    'synced_at' => null,
                ])->save();

                try {
                    $supabaseAuth->createOrUpdate($user, $password);
                } catch (\Throwable $exception) {
                    report($exception);
                }

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => 'Password reset successful. You can now sign in.',
        ]);
    }
}
