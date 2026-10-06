<?php

namespace App\Services;

use App\Models\User;
use App\Support\SupabaseHeaders;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseUserSyncService
{
    /**
     * True while a sync is in progress.
     *
     * The sync writes supabase_id / sync_status / synced_at back onto each user,
     * and those saves fire the model's saved event, which is what schedules a
     * sync in the first place. UserObserver tried to detect that with
     * isDirty(), but during a `saved` event the attributes no longer report as
     * dirty, so the check never matched and each sync scheduled another one -
     * a ~1.2s Supabase round trip per lap, which is why creating one account
     * could take half a minute.
     */
    private static bool $running = false;

    public static function isRunning(): bool
    {
        return self::$running;
    }

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
        return DB::table('users')->update(['sync_status' => 0, 'synced_at' => null]);
    }

    public function syncUsers(): array
    {
        if (self::$running) {
            return ['synced_count' => 0, 'failed_count' => 0, 'errors' => [], 'skipped' => 'already running'];
        }

        self::$running = true;

        try {
            return $this->performSync();
        } finally {
            self::$running = false;
        }
    }

    /**
     * Push one user immediately.
     *
     * Administrative access changes use this path so the API does not report
     * success while public.users still contains the old activation flag.
     * Automatic background sync remains in place for ordinary profile edits.
     *
     * @return array<string, mixed> the saved Supabase profile row
     */
    public function syncUser(User $user): array
    {
        if (self::$running) {
            throw new RuntimeException('A Supabase user sync is already running.');
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            throw new RuntimeException('Supabase connection is not configured.');
        }

        self::$running = true;

        try {
            $rows = $this->pushUsers(collect([$user]), $url, $secretKey);

            if (! $rows->has($user->id)) {
                throw new RuntimeException('Supabase did not return the saved user profile.');
            }

            $row = $rows->get($user->id, []);

            User::withoutTimestamps(function () use ($user, $row) {
                $user->forceFill([
                    'supabase_id' => $row['id'] ?? $user->supabase_id,
                    'sync_status' => 1,
                    'synced_at' => now(),
                ])->save();
            });

            return $row;
        } catch (\Throwable $exception) {
            User::withoutTimestamps(function () use ($user) {
                $user->forceFill(['sync_status' => 2])->save();
            });

            throw $exception;
        } finally {
            self::$running = false;
        }
    }

    private function performSync(): array
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
        $syncedNames = [];

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
            ->chunkById(50, function ($users) use ($url, $secretKey, &$syncedCount, &$failedCount, &$errors, &$syncedNames) {
                Log::info('Syncing users chunk to Supabase.', [
                    'count' => $users->count(),
                    'local_user_ids' => $users->pluck('id')->values()->all(),
                ]);

                try {
                    $rowsByLocalId = $this->pushUsers($users, $url, $secretKey);
                } catch (\Throwable $exception) {
                    // One bad row (a stale duplicate, a constraint the whole
                    // chunk shares) used to fail every other user sent in the
                    // same request alongside it - a single conflict reported
                    // as "5 failed" when 4 of those 5 were perfectly fine.
                    // Retrying one row at a time isolates the real failures
                    // instead of taking the rest down with them.
                    Log::warning('Supabase users chunk failed together; retrying one at a time.', [
                        'local_user_ids' => $users->pluck('id')->values()->all(),
                        'error' => $exception->getMessage(),
                    ]);

                    $rowsByLocalId = collect();

                    foreach ($users as $user) {
                        try {
                            $rowsByLocalId = $rowsByLocalId->union($this->pushUsers(collect([$user]), $url, $secretKey));
                        } catch (\Throwable $rowException) {
                            User::withoutTimestamps(function () use ($user) {
                                $user->forceFill(['sync_status' => 2])->save();
                            });

                            Log::error('Supabase user sync failed for user.', [
                                'local_user_id' => $user->id,
                                'email' => $user->email,
                                'error' => $rowException->getMessage(),
                            ]);

                            $errors[] = [
                                'local_user_id' => $user->id,
                                'email' => $user->email,
                                'error' => $rowException->getMessage(),
                            ];
                            $failedCount++;
                        }
                    }
                }

                foreach ($users as $user) {
                    if (! $rowsByLocalId->has($user->id)) {
                        continue;
                    }

                    $supabaseRow = $rowsByLocalId->get($user->id, []);

                    User::withoutTimestamps(function () use ($user, $supabaseRow) {
                        $user->forceFill([
                            'supabase_id' => $supabaseRow['id'] ?? $user->supabase_id,
                            'sync_status' => 1,
                            'synced_at' => now(),
                        ])->save();
                    });

                    $syncedCount++;
                    $syncedNames[] = $user->full_name ?: $user->email;
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
            // Lets the admin see who was actually synced, not just a count -
            // capped so a full resync of hundreds of accounts doesn't blow up
            // the response.
            'synced_names' => array_slice($syncedNames, 0, 20),
        ];
    }

    /**
     * Upsert one batch of users and hand back the saved rows keyed by
     * local_user_id. Throws on any non-2xx response - the caller decides
     * whether that means failing the whole batch or retrying row by row.
     *
     * @param  Collection<int, User>  $users
     * @return Collection<int, array>
     */
    private function pushUsers($users, string $url, string $secretKey)
    {
        $payloads = $users->map(fn (User $user) => $this->payload($user))->values()->all();

        $response = Http::withHeaders(SupabaseHeaders::forServer($secretKey, [
            'Prefer' => 'resolution=merge-duplicates,return=representation',
        ]))
            // connectTimeout only covers opening the socket; without a
            // response timeout a stalled Supabase reply holds the worker
            // until PHP's own limit, which is how a "quick" sync ended up
            // running for minutes.
            ->connectTimeout(5)
            ->timeout(20)
            // The row's real identity here is local_user_id (that is what
            // Supabase's own unique constraint enforces, and what the
            // response is keyed back by below) - conflict used to be
            // resolved on email instead. Whenever the email on file in
            // Supabase differed at all from the local one (a rename, stray
            // whitespace, a case difference), Postgres found no conflicting
            // row on email and tried a fresh INSERT, which then hit the
            // local_user_id unique constraint and failed every user in the
            // chunk with a 23505 on "users_local_user_id_key" - the
            // "already exists" error reported for users that plainly
            // already existed.
            ->post("{$url}/rest/v1/users?on_conflict=local_user_id", $payloads);

        if (! $response->successful()) {
            Log::warning('Supabase users chunk sync response failed.', [
                'status' => $response->status(),
                'body' => $response->body(),
                'local_user_ids' => $users->pluck('id')->values()->all(),
            ]);

            if ($response->status() === 521) {
                throw new RuntimeException('Supabase project is currently PAUSED or offline (HTTP 521). Please log in to https://supabase.com/dashboard and click "Restore project".');
            }

            throw new RuntimeException(self::explain($response->json(), $response->body(), $response->status()));
        }

        return collect($response->json() ?: [])->keyBy('local_user_id');
    }

    /**
     * Turn a PostgREST error into something an administrator can act on.
     *
     * The raw body names a Postgres constraint, which says nothing about what
     * to do. The duplicate-key case in particular has a specific cause worth
     * spelling out: local user ids restart at 1 after the database is reset,
     * while rows for the old accounts are still sitting in Supabase, so a fresh
     * account claims an id that a deleted one still holds.
     */
    private static function explain(?array $json, string $body, int $status): string
    {
        $code = $json['code'] ?? null;
        $details = $json['details'] ?? '';

        if ($code === '23505' && str_contains((string) ($json['message'] ?? ''), 'local_user_id')) {
            return 'Supabase already has a row using this local user id ('.trim($details).'). '
                .'It belongs to an account that was deleted locally but never removed from Supabase, '
                .'so the id was reused. Clear the leftover rows in Supabase, then sync again.';
        }

        // Same root cause as the local_user_id case above, just on the
        // student_id/barcode column instead: a row from a locally-deleted (or
        // test) account is still sitting in Supabase holding that value, so a
        // real account that legitimately owns it now can never sync its
        // profile row - only its Auth login goes through, which is what makes
        // this look like "the account exists but can't sign in to the
        // companion app" even though authentication itself is fine.
        if ($code === '23505' && str_contains((string) ($json['message'] ?? ''), 'student_id')) {
            return 'Supabase already has a row using this student ID/barcode ('.trim($details).'). '
                .'It belongs to an account that no longer exists locally (deleted or a leftover test '
                .'account) but was never removed from Supabase. That row is blocking this account\'s '
                .'profile sync - delete the leftover row in Supabase\'s public.users table, then sync again.';
        }

        if ($code === '23505') {
            return 'Supabase rejected a duplicate value: '.trim($details ?: $body);
        }

        if ($code === '42501') {
            return 'Supabase denied the operation: the service role is missing a privilege on public.users. '
                .($json['hint'] ?? '');
        }

        return $body ?: "HTTP error {$status}";
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
