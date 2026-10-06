<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    try {
        app(\App\Services\SupabaseUserSyncService::class)->syncUsers();
        app(\App\Services\SupabaseHealthRecordSyncService::class)->syncHealthRecords();
    } catch (\Throwable $e) {
        logger()->warning('Scheduled Supabase sync skipped: ' . $e->getMessage());
    }
})->everyFifteenMinutes();
