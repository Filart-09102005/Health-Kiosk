<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseUserSyncService
{
    public function syncUsers(): array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            throw new RuntimeException('Supabase connection is not configured.');
        }

        $syncedCount = 0;
        $failedCount = 0;
        $errors = [];

        $pendingUsers = User::query()
            ->where(function ($query) {
                $query->where('sync_status', '!=', 1)
                    ->orWhereNull('synced_at')
                    ->orWhereColumn('updated_at', '>', 'synced_at');
            });

        $pendingCount = (clone $pendingUsers)->count();

        Log::info('Supabase users sync started.', [
            'pending_users' => $pendingCount,
        ]);

        $pendingUsers
            ->orderBy('id')
            ->chunkById(50, function ($users) use ($url, $secretKey, &$syncedCount, &$failedCount, &$errors) {
                $payloads = $users->map(fn (User $user) => $this->payload($user))->values()->all();

                try {
                    Log::info('Syncing users chunk to Supabase.', [
                        'count' => $users->count(),
                        'local_user_ids' => $users->pluck('id')->values()->all(),
                    ]);

                    $response = Http::withHeaders([
                        'apikey' => $secretKey,
                        'Authorization' => "Bearer {$secretKey}",
                        'Content-Type' => 'application/json',
                        'Prefer' => 'resolution=merge-duplicates,return=representation',
                    ])
                        ->connectTimeout(5)
                        ->timeout(12)
                        ->post("{$url}/rest/v1/users?on_conflict=local_user_id", $payloads);

                    if (! $response->successful()) {
                        Log::warning('Supabase users chunk sync response failed.', [
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ]);

                        throw new RuntimeException($response->body());
                    }

                    $syncedRows = collect($response->json() ?: []);
                    $rowsByLocalId = $syncedRows->keyBy('local_user_id');

                    foreach ($users as $user) {
                        $supabaseRow = $rowsByLocalId->get($user->id, []);

                        User::withoutTimestamps(function () use ($user, $supabaseRow) {
                            $user->forceFill([
                                'supabase_id' => $supabaseRow['id'] ?? $user->supabase_id,
                                'sync_status' => 1,
                                'synced_at' => now(),
                            ])->save();
                        });

                        $syncedCount++;
                    }
                } catch (\Throwable $exception) {
                    foreach ($users as $user) {
                        User::withoutTimestamps(function () use ($user) {
                            $user->forceFill([
                                'sync_status' => 2,
                            ])->save();
                        });

                        Log::error('Supabase user sync failed for user.', [
                            'local_user_id' => $user->id,
                            'email' => $user->email,
                            'error' => $exception->getMessage(),
                        ]);

                        $errors[] = [
                            'local_user_id' => $user->id,
                            'email' => $user->email,
                            'error' => $exception->getMessage(),
                        ];
                        $failedCount++;
                    }
                }
            });

        Log::info('Supabase users sync completed.', [
            'pending_users' => $pendingCount,
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
        ]);

        return [
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'errors' => array_slice($errors, 0, 5),
        ];
    }

    private function payload(User $user): array
    {
        return [
            'local_user_id' => $user->id,
            'auth_user_id' => $user->supabase_auth_id,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'student_id' => $user->student_id,
            'email' => $user->email,
            'password' => $user->password,
            'role' => $user->role,
            'department' => $user->department,
            'grade_level' => $user->grade_level,
            'strand' => $user->strand,
            'year_level' => $user->year_level,
            'program' => $user->program,
            'age' => $user->age,
            'gender' => $user->gender,
            'barcode' => $user->barcode,
            'is_active' => (bool) $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }
}
