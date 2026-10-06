<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Services\Health\UserNotificationService;
use Illuminate\Console\Command;

/**
 * Writes the notifications for health records saved before notifications were
 * stored, so a student's history is not blank on the day this ships.
 *
 * Safe to re-run: the sync is a reconciliation, not an insert.
 */
class BackfillUserNotifications extends Command
{
    protected $signature = 'notifications:backfill';

    protected $description = 'Generate stored user notifications for existing health records';

    public function handle(UserNotificationService $notifications): int
    {
        $seen = 0;

        HealthRecord::query()
            ->orderBy('id')
            ->chunkById(200, function ($records) use ($notifications, &$seen) {
                foreach ($records as $record) {
                    $notifications->syncForRecord($record);
                    $seen++;
                }
            });

        $this->info("Reconciled notifications for {$seen} health record(s).");

        return self::SUCCESS;
    }
}
