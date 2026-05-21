<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ResendVerificationEmailRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        abort_unless(hash_equals($hash, sha1($user->getEmailForVerification())), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
            ActivityLog::record('email_verified', $user, $request, 'User verified their email address.');
        }

        return redirect('/verify-email?verified=1');
    }

    public function resend(ResendVerificationEmailRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $user = User::where('email', $email)->first();

        if (! $user || $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'If the email is registered and unverified, a new verification link will be sent.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification link sent.',
        ]);
    }
}
