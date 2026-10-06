<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for requests that only the Python serial bridge makes (it holds no
 * user session/cookies, so auth:sanctum was never an option here). The
 * bridge sends a shared secret in the X-Kiosk-Bridge-Token header,
 * configured via KIOSK_BRIDGE_TOKEN in .env - never hardcoded, never sent
 * to the browser.
 *
 * If the token isn't configured at all, every bridge request is refused
 * (fail closed) rather than silently falling back to the old "anyone can
 * call this" behaviour.
 */
class AuthenticateKioskBridge
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configured = (string) config('services.kiosk_bridge.token');
        $supplied = (string) $request->header('X-Kiosk-Bridge-Token', '');

        if ($configured === '' || $supplied === '' || ! hash_equals($configured, $supplied)) {
            abort(401, 'Missing or invalid kiosk bridge token.');
        }

        return $next($request);
    }
}
