<?php

namespace App\Services\Health;

use App\Models\KioskSession;
use App\Models\SessionActivity;
use App\Models\User;
use Illuminate\Http\Request;

class KioskSessionService
{
    public function start(User $user, Request $request, string $loginMethod): KioskSession
    {
        // Close any previously abandoned active sessions for this user
        $user->kioskSessions()->where('status', 'active')->update([
            'status' => 'timeout',
            'ended_at' => now(),
        ]);

        $nextNumber = ((int) $user->kioskSessions()->max('session_number')) + 1;

        $session = KioskSession::create([
            'user_id' => $user->id,
            'session_number' => $nextNumber,
            'status' => 'active',
            'started_at' => now(),
            'login_method' => $loginMethod,
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        $this->activity($session, 'login', 'User started kiosk session.', ['login_method' => $loginMethod]);

        return $session;
    }

    public function end(?KioskSession $session, string $reason = 'logout'): void
    {
        if (! $session || $session->status !== 'active') {
            return;
        }

        $session->update([
            'status' => $reason === 'timeout' ? 'timeout' : 'completed',
            'ended_at' => now(),
        ]);

        $this->activity($session, $reason, 'Kiosk session ended.');
    }

    public function activeFor(User $user): ?KioskSession
    {
        return $user->kioskSessions()
            ->where('status', 'active')
            ->latest()
            ->first();
    }

    public function activity(KioskSession $session, string $action, ?string $description = null, array $metadata = []): SessionActivity
    {
        return SessionActivity::create([
            'kiosk_session_id' => $session->id,
            'user_id' => $session->user_id,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ?: null,
        ]);
    }
}
