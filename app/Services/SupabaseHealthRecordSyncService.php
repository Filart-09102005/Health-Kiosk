<?php

namespace App\Services;

use App\Models\HealthRecord;
use App\Services\Health\HealthEvaluationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseHealthRecordSyncService
{
    /**
     * Resolved once per sync run rather than per record: the constructor reads
     * admin_settings from the database, and a 50-record chunk would otherwise
     * issue 50 identical queries.
     */
    private ?HealthEvaluationService $evaluator = null;

    /**
     * Mark every row as needing an upload.
     *
     * The sync decides what to send from local flags alone, so a row deleted in
     * the Supabase dashboard still looks synced here and is skipped — the sync
     * then reports success while the cloud stays empty. Clearing the flags is
     * the only way back from a cloud-side delete.
     *
     * Timestamps are untouched: updated_at is a fact about the record, not
     * about whether it has been uploaded.
     *
     * @return int rows marked
     */
    public static function markAllPending(): int
    {
        return DB::table('health_records')->update(['sync_status' => 0, 'synced_at' => null]);
    }

    public function syncHealthRecords(): array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            throw new RuntimeException('Supabase connection is not configured.');
        }

        $syncedCount = 0;
        $failedCount = 0;
        $skippedCount = 0;
        $errors = [];

        $pendingRecords = HealthRecord::query()
            ->with(['user', 'kioskSession'])
            ->whereHas('user', fn ($query) => $query->whereNotNull('supabase_auth_id'))
            ->where(function ($query) {
                $query->where('sync_status', '!=', 1)
                    ->orWhereNull('synced_at')
                    ->orWhereColumn('updated_at', '>', 'synced_at');
            });

        $pendingCount = (clone $pendingRecords)->count();
        $skippedCount = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->whereNull('supabase_auth_id'))
            ->count();

        Log::info('Supabase health records sync started.', [
            'pending_records' => $pendingCount,
            'skipped_without_auth_user' => $skippedCount,
        ]);

        $pendingRecords
            ->orderBy('id')
            ->chunkById(50, function ($records) use ($url, $secretKey, &$syncedCount, &$failedCount, &$errors) {
                $payloads = $records->map(fn (HealthRecord $record) => $this->payload($record))->values()->all();

                try {
                    Log::info('Syncing health records chunk to Supabase.', [
                        'count' => $records->count(),
                        'local_health_record_ids' => $records->pluck('id')->values()->all(),
                    ]);

                    $response = Http::withHeaders([
                        'apikey' => $secretKey,
                        'Authorization' => "Bearer {$secretKey}",
                        'Content-Type' => 'application/json',
                        'Prefer' => 'resolution=merge-duplicates,return=representation',
                    ])
                        ->connectTimeout(5)
                        ->timeout(12)
                        ->post("{$url}/rest/v1/health_records?on_conflict=local_health_record_id", $payloads);

                    if (! $response->successful()) {
                        Log::warning('Supabase health records chunk sync response failed.', [
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ]);

                        if ($response->status() === 521) {
                            throw new RuntimeException('Supabase project is currently PAUSED or offline (HTTP 521). Please log in to https://supabase.com/dashboard and click "Restore project".');
                        }

                        throw new RuntimeException($response->body() ?: "HTTP error {$response->status()}");
                    }

                    $syncedRows = collect($response->json() ?: []);
                    $rowsByLocalId = $syncedRows->keyBy('local_health_record_id');

                    foreach ($records as $record) {
                        $supabaseRow = $rowsByLocalId->get($record->id, []);

                        HealthRecord::withoutTimestamps(function () use ($record, $supabaseRow) {
                            $record->forceFill([
                                'supabase_id' => $supabaseRow['id'] ?? $record->supabase_id,
                                'sync_status' => 1,
                                'synced_at' => now(),
                            ])->save();
                        });

                        $syncedCount++;
                    }
                } catch (\Throwable $exception) {
                    foreach ($records as $record) {
                        HealthRecord::withoutTimestamps(function () use ($record) {
                            $record->forceFill([
                                'sync_status' => 2,
                            ])->save();
                        });

                        Log::error('Supabase health record sync failed.', [
                            'local_health_record_id' => $record->id,
                            'local_user_id' => $record->user_id,
                            'error' => $exception->getMessage(),
                        ]);

                        $errors[] = [
                            'local_health_record_id' => $record->id,
                            'local_user_id' => $record->user_id,
                            'error' => $exception->getMessage(),
                        ];

                        $failedCount++;
                    }
                }
            });

        Log::info('Supabase health records sync completed.', [
            'pending_records' => $pendingCount,
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'skipped_without_auth_user' => $skippedCount,
        ]);

        return [
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'skipped_count' => $skippedCount,
            'errors' => array_slice($errors, 0, 5),
        ];
    }

    private function payload(HealthRecord $record): array
    {
        return [
            'local_health_record_id' => $record->id,
            'local_user_id' => $record->user_id,
            'auth_user_id' => $record->user->supabase_auth_id,
            'local_kiosk_session_id' => $record->kiosk_session_id,
            'session_number' => $record->kioskSession?->session_number,
            'session_status' => $record->kioskSession?->status,
            'heart_rate' => $record->heart_rate,
            'spo2' => $record->spo2,
            'temperature' => $record->temperature,
            'height' => $record->height,
            'weight' => $record->weight,
            'bmi' => $record->bmi,
            'bmi_category' => $record->bmi_category,
            'health_status' => $record->health_status,
            'measurement_statuses' => $this->measurementStatuses($record),
            'missing_measurements' => $record->missing_measurements,
            'recorded_at' => $record->created_at?->toISOString(),
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->toISOString(),
        ];
    }

    /**
     * Per-measurement verdicts, e.g. ['temperature' => 'Alert', 'spo2' => 'Normal'].
     *
     * `health_status` collapses a whole session into one word, and completeness
     * outranks severity in overallStatus() — so a 40°C reading taken during an
     * unfinished session is stored as 'Incomplete', and the alert disappears.
     * The mobile push needs to see that alert, so the breakdown is forwarded
     * alongside the summary rather than derived a second time downstream.
     *
     * Nothing about the existing status changes: this is purely additive, and
     * the kiosk UI, printed summary and admin views are untouched.
     */
    private function measurementStatuses(HealthRecord $record): array|\stdClass
    {
        $this->evaluator ??= app(HealthEvaluationService::class);

        // summarize() treats a key as missing via isset(), so nulls correctly
        // read as "not measured" rather than as a zero reading.
        $statuses = $this->evaluator->summarize([
            'temperature' => $record->temperature,
            'heart_rate' => $record->heart_rate,
            'spo2' => $record->spo2,
            'height' => $record->height,
            'weight' => $record->weight,
        ])['measurement_statuses'] ?? [];

        // A session where nothing could be evaluated yields an empty PHP array,
        // which json_encode renders as `[]` — a JSON *array*. Supabase's push
        // trigger calls jsonb_each_text() on this column and that requires an
        // object, so one such row raises 22023 and fails the ENTIRE batch it
        // was posted in, not just itself. Force an object.
        return $statuses === [] ? new \stdClass() : $statuses;
    }
}
