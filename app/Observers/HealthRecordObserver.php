<?php

namespace App\Observers;

use App\Models\HealthRecord;
use App\Services\SupabaseHealthRecordSyncService;
use Throwable;

class HealthRecordObserver
{
    /**
     * Handle the HealthRecord "saved" event.
     */
    public function saved(HealthRecord $record): void
    {
        // Avoid recursive loop when sync updates sync_status/synced_at
        if ($record->isDirty(['sync_status', 'synced_at', 'supabase_id'])) {
            return;
        }

        // Dispatch background sync after response is sent to user
        dispatch(function () {
            try {
                app(SupabaseHealthRecordSyncService::class)->syncHealthRecords();
            } catch (Throwable $e) {
                logger()->warning('Automatic Supabase health record sync failed', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();
    }
}
