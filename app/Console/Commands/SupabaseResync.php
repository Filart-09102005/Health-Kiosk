<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Models\User;
use App\Services\SupabaseAuthUserService;
use App\Services\SupabaseHealthRecordSyncService;
use App\Services\SupabaseUserSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Push everything to Supabase again.
 *
 * The admin portal's "Sync Users & Records" only sends rows it believes are
 * pending — sync_status, synced_at and updated_at, all held locally. That is
 * right for the normal case and useless for the one that actually happens:
 * rows deleted in the Supabase dashboard leave every local flag saying
 * "synced", so the button reports success and sends nothing. `--force` clears
 * those flags first, which is the only way back from a cloud-side delete.
 */
class SupabaseResync extends Command
{
    protected $signature = 'supabase:resync
        {--force : Clear the local sync flags first, so rows deleted in Supabase are pushed again}
        {--auth : Also restore missing Supabase Auth accounts. Resets those students to the default password}
        {--dry-run : Report what is there and what would be sent, without sending anything}';

    protected $description = 'Re-push users and health records to Supabase';

    public function handle(
        SupabaseUserSyncService $users,
        SupabaseHealthRecordSyncService $records,
        SupabaseAuthUserService $auth,
    ): int {
        $remote = $this->readRemote();

        if ($remote === null) {
            $this->error('Could not read Supabase. Check the connection settings and that the project is not paused.');

            return self::FAILURE;
        }

        $this->line('');
        $this->info('Local');
        $this->line(sprintf('  users            %d  (%d linked to a Supabase Auth account)',
            User::count(), User::whereNotNull('supabase_auth_id')->count()));
        $this->line(sprintf('  health records   %d', HealthRecord::count()));

        $this->info('Supabase');
        $this->line(sprintf('  users            %d', $remote['users']));
        $this->line(sprintf('  health records   %d', $remote['records']));
        $this->line(sprintf('  auth accounts    %d', $remote['auth']));
        $this->line('');

        if ($this->option('dry-run')) {
            $this->comment('Dry run — nothing was sent.');

            return self::SUCCESS;
        }

        if ($this->option('force')) {
            $this->markEverythingPending();
        }

        if ($this->option('auth')) {
            $this->restoreAuthAccounts($auth, $remote['authAccounts']);
        }

        $this->line('Syncing users...');
        $userResult = $users->syncUsers();
        $this->reportResult($userResult);

        $this->line('Syncing health records...');
        $recordResult = $records->syncHealthRecords();
        $this->reportResult($recordResult);

        $after = $this->readRemote();
        if ($after !== null) {
            $this->line('');
            $this->info('Supabase now holds');
            $this->line(sprintf('  users            %d', $after['users']));
            $this->line(sprintf('  health records   %d', $after['records']));
            $this->line(sprintf('  auth accounts    %d', $after['auth']));
        }

        return self::SUCCESS;
    }

    /**
     * Clear the flags that make the sync think there is nothing to do.
     *
     * Timestamps are left alone: updated_at is a fact about the record, not
     * about whether it has been uploaded.
     */
    private function markEverythingPending(): void
    {
        $users = SupabaseUserSyncService::markAllPending();
        $records = SupabaseHealthRecordSyncService::markAllPending();

        $this->comment(sprintf('Marked %d user(s) and %d health record(s) as pending.', $users, $records));
    }

    /**
     * Repair the Supabase logins.
     *
     * Two different faults land here, and only one of them costs anything:
     *
     *  - **Unconfirmed.** The Auth account exists but was created while the
     *    local account was still unverified, and nothing ever pushed the
     *    confirmation afterwards. Correcting it is free — no password changes —
     *    so it happens without asking.
     *  - **Missing.** No Auth account at all, because creating one failed and
     *    was only logged. Supabase needs a plain password to create an account
     *    and we hold nothing but a hash, so the account comes back on the
     *    default password the admin portal issues. That is a password change,
     *    so it is confirmed first.
     *
     * An account whose email is not verified locally is left alone in both
     * cases: an unverified student is supposed to be unable to sign in.
     */
    private function restoreAuthAccounts(SupabaseAuthUserService $auth, array $remoteAccounts): void
    {
        $byEmail = [];
        foreach ($remoteAccounts as $account) {
            $byEmail[strtolower((string) ($account['email'] ?? ''))] = $account;
        }

        $candidates = User::query()->where('role', '!=', 'admin')->whereNotNull('email')->get();

        $unverified = $candidates->filter(fn (User $user) => ! $user->email_verified_at);
        $verified = $candidates->filter(fn (User $user) => (bool) $user->email_verified_at);

        $unconfirmed = $verified->filter(function (User $user) use ($byEmail) {
            $account = $byEmail[strtolower((string) $user->email)] ?? null;

            return $account !== null && empty($account['email_confirmed_at']);
        });

        $missing = $verified->filter(fn (User $user) => ! isset($byEmail[strtolower((string) $user->email)]));

        foreach ($unverified as $user) {
            $this->line(sprintf('  skipped %s — email not verified on the kiosk, so it must not sign in yet', $user->email));
        }

        // ── Free repair ───────────────────────────────────────────────────
        foreach ($unconfirmed as $user) {
            try {
                $auth->createOrUpdate($user->fresh());
                $this->line(sprintf('  confirmed %s', $user->email));
            } catch (Throwable $exception) {
                $this->error(sprintf('  could not confirm %s — %s', $user->email, $exception->getMessage()));
            }
        }

        if ($missing->isEmpty()) {
            if ($unconfirmed->isEmpty()) {
                $this->comment('Every verified account already has a working Supabase login.');
            }

            return;
        }

        // ── Costly repair ─────────────────────────────────────────────────
        $this->warn(sprintf('%d verified account(s) have no Supabase login at all:', $missing->count()));
        foreach ($missing as $user) {
            $this->line('    '.$user->email);
        }
        $this->warn('Restoring these resets each one to its default password, because only a hash is stored here.');

        if (! $this->confirm('Restore them and reset those passwords?', false)) {
            $this->comment('Left alone. Those accounts still cannot sign in to the companion app.');

            return;
        }

        foreach ($missing as $user) {
            // The stored id points at an account that is gone, so the update
            // path would 404. Clear it and create a fresh one.
            if ($user->supabase_auth_id) {
                User::withoutTimestamps(fn () => $user->forceFill(['supabase_auth_id' => null])->save());
            }

            $password = str_replace(' ', '', (string) $user->firstname).'12345';

            try {
                $auth->createOrUpdate($user->fresh(), $password);
                $this->line(sprintf('  restored %s (password now %s)', $user->email, $password));
            } catch (Throwable $exception) {
                $this->error(sprintf('  failed %s — %s', $user->email, $exception->getMessage()));
            }
        }
    }

    private function reportResult(array $result): void
    {
        $this->line(sprintf('  synced %d, failed %d',
            $result['synced_count'] ?? 0, $result['failed_count'] ?? 0));

        foreach ($result['errors'] ?? [] as $error) {
            $this->error('  '.(is_array($error) ? json_encode($error) : $error));
        }
    }

    /** @return array{users:int,records:int,auth:int,authAccounts:array<int,array>}|null */
    private function readRemote(): ?array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $key = (string) config('services.supabase.secret_key');

        if ($url === '' || $key === '') {
            return null;
        }

        try {
            $headers = ['apikey' => $key, 'Authorization' => "Bearer {$key}"];

            $users = Http::withHeaders($headers)->timeout(20)->get("{$url}/rest/v1/users", ['select' => 'email']);
            $records = Http::withHeaders($headers)->timeout(20)->get("{$url}/rest/v1/health_records", ['select' => 'id']);
            $auth = Http::withHeaders($headers)->timeout(20)->get("{$url}/auth/v1/admin/users", ['per_page' => 200]);

            if (! $users->successful() || ! $auth->successful()) {
                return null;
            }

            $authUsers = $auth->json('users') ?? [];

            return [
                'users' => count($users->json() ?: []),
                'records' => $records->successful() ? count($records->json() ?: []) : 0,
                'auth' => count($authUsers),
                // The whole row, not just the address: whether the account is
                // confirmed is the difference between a login that works and
                // one that is refused.
                'authAccounts' => $authUsers,
            ];
        } catch (Throwable) {
            return null;
        }
    }
}
