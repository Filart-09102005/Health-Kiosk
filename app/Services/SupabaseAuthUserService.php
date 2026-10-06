<?php

namespace App\Services;

use App\Models\User;
use App\Support\SupabaseHeaders;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseAuthUserService
{
    /** Supabase's documented 100-year ban for an administratively disabled user. */
    private const INACTIVE_BAN_DURATION = '876000h';

    public function createOrUpdate(User $user, ?string $plainPassword = null): ?string
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            throw new RuntimeException('Supabase connection is not configured.');
        }

        if ($user->supabase_auth_id) {
            return $this->updateAuthUser($url, $secretKey, $user, $plainPassword);
        }

        // Older accounts (and accounts created while local ID persistence
        // failed) can already exist in Supabase Auth without having the Auth id
        // stored locally. Verification and activation updates have no plaintext
        // password available, so recover the link by exact email before giving
        // up. This also repairs the local link for future updates.
        if (! $plainPassword) {
            $authId = $this->findAuthIdByEmail($url, $secretKey, (string) $user->email);

            if ($authId) {
                $this->markAuthSynced($user, $authId);

                return $this->updateAuthUser($url, $secretKey, $user, null);
            }
        }

        if (! $plainPassword) {
            throw new RuntimeException('Plain password is required to create a Supabase Auth user.');
        }

        return $this->createAuthUser($url, $secretKey, $user, $plainPassword);
    }

    /**
     * Enforce an activation change in Supabase Auth before it is saved locally.
     *
     * Metadata is informational and companion clients can accidentally ignore
     * it. `ban_duration` is enforced by Supabase Auth itself, so an inactive
     * account cannot obtain a new session even if the app forgets to inspect
     * public.users or user_metadata.
     */
    public function updateActiveStatus(User $user, bool $isActive): string
    {
        [$url, $secretKey] = $this->connection();

        if (! $user->supabase_auth_id) {
            $authId = $this->findAuthIdByEmail($url, $secretKey, (string) $user->email);

            if (! $authId) {
                throw new RuntimeException('No Supabase Auth account was found for this email address.');
            }

            // Keep this in memory until the remote update succeeds. The normal
            // markAuthSynced() call below persists it only after confirmation.
            $user->forceFill(['supabase_auth_id' => $authId]);
        }

        return $this->updateAuthUser($url, $secretKey, $user, null, $isActive);
    }

    private function createAuthUser(string $url, string $secretKey, User $user, string $plainPassword): string
    {
        $response = $this->request($url, $secretKey)
            ->post("{$url}/auth/v1/admin/users", [
                'email' => $user->email,
                'password' => $plainPassword,
                'email_confirm' => (bool) $user->email_verified_at,
                'user_metadata' => $this->metadata($user),
                'ban_duration' => $this->banDuration((bool) ($user->is_active ?? true)),
            ]);

        if (! $response->successful()) {
            Log::warning('Supabase Auth create user failed.', [
                'local_user_id' => $user->id,
                'email' => $user->email,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException($response->body());
        }

        $authId = (string) $response->json('id');
        $this->markAuthSynced($user, $authId);

        return $authId;
    }

    private function updateAuthUser(
        string $url,
        string $secretKey,
        User $user,
        ?string $plainPassword = null,
        ?bool $activeOverride = null,
    ): string {
        $isActive = $activeOverride ?? (bool) ($user->is_active ?? true);
        $payload = [
            'email' => $user->email,
            'email_confirm' => (bool) $user->email_verified_at,
            'user_metadata' => $this->metadata($user, $isActive),
            // `none` explicitly removes an earlier ban when the admin
            // reactivates the account.
            'ban_duration' => $this->banDuration($isActive),
        ];

        if ($plainPassword) {
            $payload['password'] = $plainPassword;
        }

        $response = $this->request($url, $secretKey)
            ->put("{$url}/auth/v1/admin/users/{$user->supabase_auth_id}", $payload);

        if (! $response->successful()) {
            Log::warning('Supabase Auth update user failed.', [
                'local_user_id' => $user->id,
                'email' => $user->email,
                'supabase_auth_id' => $user->supabase_auth_id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException($response->body());
        }

        $authId = (string) ($response->json('id') ?: $user->supabase_auth_id);
        $this->markAuthSynced($user, $authId);

        return $authId;
    }

    /**
     * Remove a user from Supabase entirely: the Auth account that governs
     * companion-app sign-in, and the public.users profile row.
     *
     * Both are resolved by email when the local record has no stored id. That
     * fallback is the point of this method — supabase_auth_id is only set during
     * web registration or password reset, so most accounts never had one, and a
     * delete that keyed solely off the stored id left their Auth login alive.
     *
     * @return array{auth: string, profile: string} per-target outcome:
     *                                              deleted | not_found | failed | skipped
     */
    public function deleteFor(User $user): array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            return ['auth' => 'skipped', 'profile' => 'skipped'];
        }

        return [
            'auth' => $this->deleteAuthUser($url, $secretKey, $user),
            'profile' => $this->deleteProfileRow($url, $secretKey, $user),
        ];
    }

    private function deleteAuthUser(string $url, string $secretKey, User $user): string
    {
        $authId = $user->supabase_auth_id ?: $this->findAuthIdByEmail($url, $secretKey, (string) $user->email);

        if (! $authId) {
            return 'not_found';
        }

        $response = $this->request($url, $secretKey)->delete("{$url}/auth/v1/admin/users/{$authId}");

        // A 404 means someone else already removed it, which is the desired end
        // state rather than an error.
        if ($response->successful() || $response->status() === 404) {
            return 'deleted';
        }

        Log::error('Supabase Auth delete failed.', [
            'email' => $user->email,
            'supabase_auth_id' => $authId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return 'failed';
    }

    private function deleteProfileRow(string $url, string $secretKey, User $user): string
    {
        $query = $user->supabase_id
            ? 'id=eq.'.rawurlencode((string) $user->supabase_id)
            : 'email=eq.'.rawurlencode((string) $user->email);

        $response = $this->request($url, $secretKey)->delete("{$url}/rest/v1/users?{$query}");

        if ($response->successful() || $response->status() === 404) {
            return 'deleted';
        }

        Log::error('Supabase profile row delete failed.', [
            'email' => $user->email,
            'query' => $query,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return 'failed';
    }

    /**
     * Resolve an Auth user id from an email address.
     *
     * The admin API's `filter` is a search, not an equality test, so the results
     * are matched exactly before returning one — otherwise a filter that also
     * caught a similar address could delete the wrong person's login.
     */
    public function findAuthIdByEmail(string $url, string $secretKey, string $email): ?string
    {
        if ($email === '') {
            return null;
        }

        $response = $this->request($url, $secretKey)
            ->get("{$url}/auth/v1/admin/users", ['filter' => $email, 'per_page' => 50]);

        if (! $response->successful()) {
            Log::warning('Supabase Auth lookup by email failed.', [
                'email' => $email,
                'status' => $response->status(),
            ]);

            return null;
        }

        foreach (($response->json('users') ?? []) as $candidate) {
            if (isset($candidate['email'], $candidate['id'])
                && strcasecmp((string) $candidate['email'], $email) === 0) {
                return (string) $candidate['id'];
            }
        }

        return null;
    }

    private function request(string $url, string $secretKey)
    {
        return Http::withHeaders(SupabaseHeaders::forServer($secretKey))
            ->connectTimeout(5)
            ->timeout(12);
    }

    /** @return array{0: string, 1: string} */
    private function connection(): array
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $url = preg_replace('#/rest/v1$#', '', $url);
        $secretKey = (string) config('services.supabase.secret_key');

        if ($url === '' || $secretKey === '') {
            throw new RuntimeException('Supabase connection is not configured.');
        }

        return [$url, $secretKey];
    }

    private function markAuthSynced(User $user, string $authId): void
    {
        User::withoutTimestamps(function () use ($user, $authId) {
            $user->forceFill([
                'supabase_auth_id' => $authId,
                'sync_status' => 0,
                'synced_at' => null,
            ])->save();
        });
    }

    private function metadata(User $user, ?bool $activeOverride = null): array
    {
        return [
            'local_user_id' => $user->id,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'student_id' => $user->student_id,
            'role' => $user->role,
            'department' => $user->department,
            'grade_level' => $user->grade_level,
            'strand' => $user->strand,
            'year_level' => $user->year_level,
            'program' => $user->program,
            'age' => $user->age,
            'gender' => $user->gender,
            'barcode' => $user->barcode,
            // A just-created Eloquent model may not yet contain database-side
            // defaults. Missing means the account uses the default (active),
            // while an explicit false must remain false.
            'is_active' => $activeOverride ?? (bool) ($user->is_active ?? true),
        ];
    }

    private function banDuration(bool $isActive): string
    {
        return $isActive ? 'none' : self::INACTIVE_BAN_DURATION;
    }
}
