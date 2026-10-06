<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The live-vitals write endpoint has two legitimate callers that share no
 * credentials with each other: the browser (an already-authenticated kiosk
 * user resetting the display between measurements) and the Python serial
 * bridge (no user session at all, sensor payloads). This lets either in,
 * and only either of them - a request with neither a valid session nor the
 * bridge token is refused.
 */
class AuthenticateKioskBridgeOrUser
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configured = (string) config('services.kiosk_bridge.token');
        $supplied = (string) $request->header('X-Kiosk-Bridge-Token', '');
        $hasBridgeToken = $configured !== '' && $supplied !== '' && hash_equals($configured, $supplied);

        if ($hasBridgeToken) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user || ! $user->hasVerifiedEmail()) {
            abort(401, 'Missing or invalid kiosk bridge token, and no authenticated session.');
        }

        return $next($request);
    }
}
