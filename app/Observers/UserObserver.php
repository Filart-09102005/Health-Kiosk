<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\SupabaseAuthUserService;
use App\Services\SupabaseUserSyncService;
use Throwable;

class UserObserver
{
    /**
     * Handle the User "saved" event.
     */
    public function saved(User $user): void
    {
        // The sync writes its bookkeeping columns back onto every user it
        // pushes, and those saves land here. isDirty() was used to spot them,
        // but attributes do not report as dirty during a `saved` event, so the
        // check never matched: each sync scheduled another sync, and one
        // account creation turned into a chain of Supabase round trips.
        if (SupabaseUserSyncService::isRunning()) {
            return;
        }

        // Supabase sync will be handled automatically.
        dispatch(function () {
            try {
                app(SupabaseUserSyncService::class)->syncUsers();
            } catch (Throwable $e) {
                logger()->warning('Automatic Supabase user sync failed', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();
    }

    /**
     * Handle the User "deleted" event.
     *
     * Runs inline rather than after the response so the outcome is known while
     * the request is still open, and a failure leaves an audit trail instead of
     * a silently surviving Supabase login.
     */
    public function deleted(User $user): void
    {
        $email = (string) $user->email;

        try {
            $result = app(SupabaseAuthUserService::class)->deleteFor($user);
        } catch (Throwable $e) {
            $result = ['auth' => 'failed', 'profile' => 'failed'];

            logger()->error('Automatic Supabase user deletion threw.', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }

        if (in_array('failed', $result, true)) {
            // Recorded so an admin can see that the account may still exist in
            // Supabase and could still sign in to the companion app.
            ActivityLog::record(
                'supabase_user_delete_failed',
                null,
                null,
                "Supabase cleanup failed for deleted account {$email}. The companion-app login may still work.",
                ['email' => $email, 'result' => $result],
            );

            return;
        }

        logger()->info('Supabase user deletion complete.', [
            'email' => $email,
            'result' => $result,
        ]);
    }
}
