<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\SupabaseAuthUserService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tell Supabase when a student confirms their email.
 *
 * The Auth account is created at registration with `email_confirm` set to
 * whatever the local account was at that moment — which for a self-registered
 * student is false. Confirming the email afterwards only updated the local
 * row, so the Supabase account stayed unconfirmed for good and the companion
 * app refused the sign-in with nothing on the kiosk to explain it.
 */
class SyncVerifiedEmailToSupabase
{
    public function handle(Verified $event): void
    {
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        // createOrUpdate() can recover a missing local Supabase Auth id by an
        // exact email lookup. Do not skip that repair path: older accounts can
        // have a real companion login even though supabase_auth_id was never
        // persisted locally.

        // A round trip the person waiting on the verification screen should not
        // have to sit through.
        dispatch(function () use ($user) {
            try {
                app(SupabaseAuthUserService::class)->createOrUpdate($user->fresh());
            } catch (Throwable $exception) {
                Log::error('Could not confirm the Supabase login after email verification.', [
                    'email' => $user->email,
                    'error' => $exception->getMessage(),
                ]);

                ActivityLog::record(
                    'supabase_auth_confirm_failed',
                    null,
                    null,
                    "Verified {$user->email} locally, but their Supabase login is still unconfirmed. "
                    .'They cannot sign in to the companion app until it is repaired.',
                    ['email' => $user->email, 'error' => $exception->getMessage()],
                );
            }
        })->afterResponse();
    }
}
