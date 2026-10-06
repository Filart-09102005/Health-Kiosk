<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'thermal_printer' => [
        'path' => env('THERMAL_PRINTER_PATH'),
        'school_name' => env('THERMAL_RECEIPT_SCHOOL_NAME', env('APP_NAME', 'Health Kiosk')),
        'cut' => env('THERMAL_PRINTER_CUT', true),
    ],

    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'secret_key' => env('SUPABASE_SECRET_KEY'),
    ],

    // Shared secret the Python serial bridge sends in the
    // X-Kiosk-Bridge-Token header. The bridge has no user session to
    // authenticate with, so this is what stands in for one on the
    // live-vitals/command endpoints. Generate with e.g.
    // `php artisan tinker --execute="echo Str::random(40);"` and set the
    // same value in the bridge's config.json / --bridge-token.
    'kiosk_bridge' => [
        'token' => env('KIOSK_BRIDGE_TOKEN'),
    ],

];
