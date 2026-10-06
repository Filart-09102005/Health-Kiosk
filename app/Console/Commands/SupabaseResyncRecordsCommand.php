<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Models\User;
use App\Services\SupabaseHealthRecordSyncService;
use Illuminate\Console\Command;

/**
 * Re-push health records to Supabase so rows written before a payload change
 * pick up the new columns.
 *
 * Needed because the sync only sends records it considers pending. Adding a
 * field to SupabaseHealthRecordSyncService::payload() does nothing for rows
 * already marked synced — they keep whatever shape they had on the day.
 *
 * Marking is done with a query-builder update rather than a model save: the
 * HealthRecord observer dispatches a sync on every write, so saving 800 models
 * would queue 800 syncs.
 */
class SupabaseResyncRecordsCommand extends Command
{
    protected $signature = 'supabase:resync-records
                            {--user= : Limit to one account by email}
                            {--mark-only : Flag the records but do not run the sync}';

    protected $description = 'Re-send health records to Supabase to backfill newly added payload fields';

    public function handle(SupabaseHealthRecordSyncService $sync): int
    {
        // Records whose user has no Supabase Auth link can never sync, so
        // flagging them would just inflate the pending count forever.
        $query = HealthRecord::query()
            ->whereHas('user', fn ($q) => $q->whereNotNull('supabase_auth_id'));

        if ($email = $this->option('user')) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $this->error("No account found for {$email}.");

                return self::FAILURE;
            }

            if (! $user->supabase_auth_id) {
                $this->error("{$email} has no Supabase Auth link, so its records cannot sync.");

                return self::FAILURE;
            }

            $query->where('user_id', $user->id);
        }

        $eligible = (clone $query)->count();

        if ($eligible === 0) {
            $this->warn('No eligible records. Accounts need a Supabase Auth link before their records can sync.');

            $unlinked = HealthRecord::whereHas('user', fn ($q) => $q->whereNull('supabase_auth_id'))->count();
            $this->line("  {$unlinked} records belong to accounts with no auth link.");

            return self::SUCCESS;
        }

        // Nulling synced_at is what the sync's own pending check looks for.
        // updated_at is left alone — it describes the record, not its transport.
        $marked = (clone $query)->update(['synced_at' => null, 'sync_status' => 0]);

        $this->info("Flagged {$marked} record(s) for re-sync.");

        if ($this->option('mark-only')) {
            $this->line('Skipping the push (--mark-only). The scheduled sync will pick these up within 15 minutes.');

            return self::SUCCESS;
        }

        $this->line('Pushing to Supabase…');

        $result = $sync->syncHealthRecords();

        $this->info(sprintf(
            'Synced %d, failed %d, skipped %d.',
            $result['synced_count'] ?? 0,
            $result['failed_count'] ?? 0,
            $result['skipped_count'] ?? 0,
        ));

        foreach (($result['errors'] ?? []) as $error) {
            $this->warn('  '.json_encode($error));
        }

        return self::SUCCESS;
    }
}
