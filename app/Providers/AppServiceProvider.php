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

        ResetPassword::createUrlUsing(function (User $user, string $token) {
            return url('/reset-password?token='.$token.'&email='.urlencode($user->email));
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        RateLimiter::for('barcode-login', function (Request $request) {
            return Limit::perMinute(10)->by((string) $request->input('barcode').'|'.$request->ip());
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
