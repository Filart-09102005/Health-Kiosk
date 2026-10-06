<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Support\SupabaseHeaders;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Removes health_records rows from Supabase that no longer exist locally.
 *
 * The sync is push-only — SupabaseHealthRecordSyncService upserts, and nothing
 * ever issues a delete. So a record removed from MySQL stays in Supabase
 * forever, and the mobile app keeps reading it. Deleting demo data locally is
 * exactly how this happens.
 *
 * Dry-run by default. Deleting rows from the live project is not something to
 * do as a side effect of typing a command name.
 */
class SupabasePurgeOrphansCommand extends Command
{
    protected $signature = 'supabase:purge-orphans
                            {--confirm : Actually delete. Without this the command only reports}
                            {--ids= : Restrict to a comma-separated list of local_health_record_id}';

    protected $description = 'Find (and optionally delete) Supabase health_records with no local counterpart';

    public function handle(): int
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.secret_key');

        if ($url === '' || $key === '') {
            $this->error('Supabase connection is not configured.');

            return self::FAILURE;
        }

        $headers = SupabaseHeaders::forServer($key);

        $this->line('Reading Supabase health_records…');

        $response = Http::withHeaders($headers)
            ->timeout(30)
            ->get("{$url}/rest/v1/health_records", [
                'select' => 'local_health_record_id,local_user_id,recorded_at,health_status',
                'limit' => 2000,
            ]);

        if (! $response->successful()) {
            $this->error('Read failed: '.$response->body());

            return self::FAILURE;
        }

        $remote = collect($response->json())
            ->filter(fn ($row) => ! empty($row['local_health_record_id']))
            ->keyBy('local_health_record_id');

        if ($remote->isEmpty()) {
            $this->info('No rows in Supabase.');

            return self::SUCCESS;
        }

        $localIds = HealthRecord::whereIn('id', $remote->keys()->all())->pluck('id')->all();
        $orphans = $remote->except($localIds);

        if ($restrict = $this->option('ids')) {
            $allowed = array_map('intval', array_filter(explode(',', $restrict)));
            $orphans = $orphans->only($allowed);
        }

        $this->newLine();
        $this->line("Supabase rows: {$remote->count()}");
        $this->line("Orphaned (deleted locally, still remote): {$orphans->count()}");

        if ($orphans->isEmpty()) {
            $this->info('Nothing to purge.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->table(
            ['local id', 'local user', 'recorded_at', 'status'],
            $orphans->map(fn ($row) => [
                $row['local_health_record_id'],
                $row['local_user_id'] ?? '—',
                $row['recorded_at'] ?? '—',
                $row['health_status'] ?? '—',
            ])->values()->all(),
        );

        if (! $this->option('confirm')) {
            $this->newLine();
            $this->warn('Dry run. Nothing was deleted.');
            $this->line('Re-run with --confirm to delete, or --ids=1,2,3 to restrict the set first.');

            return self::SUCCESS;
        }

        $ids = $orphans->keys()->implode(',');

        // The filter MUST be on the query string. PostgREST treats an
        // unfiltered DELETE as "delete every row in the table".
        $delete = Http::withHeaders($headers + ['Prefer' => 'return=representation'])
            ->timeout(60)
            ->delete("{$url}/rest/v1/health_records?local_health_record_id=in.({$ids})");

        if (! $delete->successful()) {
            $this->error('Delete failed: '.$delete->body());

            return self::FAILURE;
        }

        $deleted = is_array($delete->json()) ? count($delete->json()) : $orphans->count();
        $this->info("Deleted {$deleted} orphaned row(s) from Supabase.");

        return self::SUCCESS;
    }
}
