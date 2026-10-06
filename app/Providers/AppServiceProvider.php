<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
            config([
                'session.secure' => true,
                'session.http_only' => true,
                'session.same_site' => 'lax',
            ]);
        }

        Gate::policy(User::class, UserPolicy::class);

        User::observe(\App\Observers\UserObserver::class);
        \App\Models\HealthRecord::observe(\App\Observers\HealthRecordObserver::class);

        // One password policy for the whole app. ProfileController already asked
        // for Password::defaults(), but nothing ever defined them - so Laravel's
        // built-in default applied and changing a password only required eight
        // characters, while registering required mixed case, a number and a
        // symbol. A weak password was rejected at sign-up and accepted on change.
        Password::defaults(fn () => Password::min(8)->mixedCase()->numbers()->symbols());

        ResetPassword::createUrlUsing(function (User $user, string $token) {
            return url('/reset-password?token='.$token.'&email='.urlencode($user->email));
        });

        // The default throttle response is a bare "Too Many Attempts.", which
        // leaves the person at the kiosk with no idea whether to wait five
        // seconds or five minutes. Retry-After already carries the answer, so it
        // is put into the message the user actually reads.
        $lockoutMessage = function (Request $request, array $headers) {
            $seconds = (int) ($headers['Retry-After'] ?? 60);

            $wait = $seconds >= 60
                ? sprintf('%d minute%s', (int) ceil($seconds / 60), $seconds >= 120 ? 's' : '')
                : sprintf('%d second%s', $seconds, $seconds === 1 ? '' : 's');

            return response()->json([
                'message' => "Too many login attempts. Please wait {$wait} before trying again.",
                'retry_after' => $seconds,
            ], 429, $headers);
        };

        RateLimiter::for('login', function (Request $request) use ($lockoutMessage) {
            return Limit::perMinute(5)
                ->by(strtolower((string) $request->input('email')).'|'.$request->ip())
                ->response($lockoutMessage);
        });

        RateLimiter::for('barcode-login', function (Request $request) use ($lockoutMessage) {
            return Limit::perMinute(10)
                ->by((string) $request->input('barcode').'|'.$request->ip())
                ->response($lockoutMessage);
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('barcode-check', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('verification-resend', function (Request $request) {
            return Limit::perMinute(3)->by(optional($request->user())->id ?: $request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by(optional($request->user())->id ?: $request->ip());
        });
    }
}
