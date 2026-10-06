<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\TestAlertCommand::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->throttleApi();

        // See ForceJsonResponse's own docblock: without this, an API request
        // with no Accept: application/json header made Laravel's auth
        // middleware try to redirect to a named "login" route that doesn't
        // exist in this SPA-only app, crashing with a 500 instead of a 401.
        $middleware->api(prepend: [\App\Http\Middleware\ForceJsonResponse::class]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'kiosk.bridge' => \App\Http\Middleware\AuthenticateKioskBridge::class,
            'kiosk.bridge_or_user' => \App\Http\Middleware\AuthenticateKioskBridgeOrUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Routing\Exceptions\InvalidSignatureException $e, $request) {
            return redirect('/verify-email?expired=1');
        });
    })->create();
