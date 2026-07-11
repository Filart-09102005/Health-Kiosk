<?php

namespace App\Services;

use App\Models\HealthRecord;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseHealthRecordSyncService
{
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

                        throw new RuntimeException($response->body());
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
            'missing_measurements' => $record->missing_measurements,
            'recorded_at' => $record->created_at?->toISOString(),
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->toISOString(),
        ];
    }
}
