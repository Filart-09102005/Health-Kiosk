<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Every route in routes/api.php is consumed by the React SPA via axios,
 * never by a browser navigating directly, so every response from here
 * should be JSON - including error responses. Without this, a request that
 * doesn't happen to carry an Accept: application/json header (a bare curl
 * call, some non-axios fetches) makes Laravel's auth middleware think it's
 * a normal page load, and it tries to redirect to a named "login" route
 * that doesn't exist anywhere in this app (auth is handled entirely
 * client-side) - turning what should be a 401 into an unrelated 500
 * (RouteNotFoundException: Route [login] not defined).
 *
 * Forcing the Accept header here makes expectsJson() true for every /api
 * request, so Laravel's own default unauthenticated() handling always takes
 * its JSON branch and never attempts that redirect.
 */
class ForceJsonResponse
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
