<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Models\User;
use App\Services\SupabaseAuthUserService;
use App\Services\SupabaseHealthRecordSyncService;
use Illuminate\Console\Command;
use Throwable;

/**
 * Creates Supabase Auth users for existing local accounts so their health
 * records can reach the mobile app.
 *
 * Records only sync for users with a supabase_auth_id, and that is normally set
 * only during web registration — so any seeded or imported account is invisible
 * to the app no matter how many records it has.
 *
 * Two things worth knowing before running this:
 *
 *  - Supabase Auth needs a plaintext password, which Laravel does not keep. So
 *    this SETS a password for the mobile app. The account's web password is not
 *    touched and the two will differ. Fine for test accounts, not something to
 *    do to a real person without telling them.
 *  - Accounts are created through the admin API, which does not send a
 *    confirmation email. `email_confirm` mirrors the local verified flag.
 */
class SupabaseLinkTestAccountsCommand extends Command
{
    protected $signature = 'supabase:link-accounts
                            {emails : Comma-separated account emails}
                            {--password= : Password to set for the mobile app}
                            {--force : Allow addresses that are not obviously test accounts}
                            {--dry-run : Show what would happen and stop}';

    protected $description = 'Give local accounts a Supabase Auth login and sync their health records';

    /**
     * RFC 2606 reserves example.com/net/org — those addresses cannot receive
     * mail. `scenario.*@` are this project's seeded testing personas.
     */
    private function looksLikeTestAccount(string $email): bool
    {
        return (bool) preg_match('/@example\.(com|net|org)$/i', $email)
            || str_starts_with(strtolower($email), 'scenario.')
            || str_starts_with(strtolower($email), 'e2e.');
    }

    public function handle(SupabaseAuthUserService $auth, SupabaseHealthRecordSyncService $sync): int
    {
        $emails = collect(explode(',', (string) $this->argument('emails')))
            ->map(fn ($email) => trim($email))
            ->filter()
            ->all();

        $password = $this->option('password');

        if (! $password && ! $this->option('dry-run')) {
            $this->error('--password is required. It becomes the account password for the mobile app.');

            return self::FAILURE;
        }

        $targets = [];

        foreach ($emails as $email) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $this->error("  {$email} — no such account, skipping.");
                continue;
            }

            if (! $this->looksLikeTestAccount($email) && ! $this->option('force')) {
                $this->error("  {$email} — does not look like a test account. Re-run with --force if you are certain.");
                continue;
            }

            $targets[] = $user;
        }

        if ($targets === []) {
            $this->warn('Nothing to do.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->table(
            ['email', 'records', 'already linked'],
            collect($targets)->map(fn (User $u) => [
                $u->email,
                $u->healthRecords()->count(),
                $u->supabase_auth_id ? 'yes' : 'no',
            ])->all(),
        );

        if ($this->option('dry-run')) {
            $this->warn('Dry run. Nothing was created.');

            return self::SUCCESS;
        }

        $linked = 0;

        foreach ($targets as $user) {
            try {
                $authId = $auth->createOrUpdate($user, $password);
                $this->info("  linked {$user->email} → {$authId}");
                $linked++;
            } catch (Throwable $e) {
                $this->error("  {$user->email} — ".mb_substr($e->getMessage(), 0, 160));
            }
        }

        if ($linked === 0) {
            return self::FAILURE;
        }

        // Their records were skipped by every previous sync, so clear the
        // transport flags to make them pending again.
        $ids = collect($targets)->pluck('id');
        $flagged = HealthRecord::whereIn('user_id', $ids)->update(['synced_at' => null, 'sync_status' => 0]);

        $this->newLine();
        $this->line("Flagged {$flagged} record(s) for sync. Pushing…");

        $result = $sync->syncHealthRecords();

        $this->info(sprintf(
            'Synced %d, failed %d.',
            $result['synced_count'] ?? 0,
            $result['failed_count'] ?? 0,
        ));

        foreach (($result['errors'] ?? []) as $error) {
            $this->warn('  '.json_encode($error));
        }

        return self::SUCCESS;
    }
}
