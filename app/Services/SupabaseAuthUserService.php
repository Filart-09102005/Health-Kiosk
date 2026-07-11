<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SupabaseAuthUserService
{
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

        if (! $plainPassword) {
            throw new RuntimeException('Plain password is required to create a Supabase Auth user.');
        }

        return $this->createAuthUser($url, $secretKey, $user, $plainPassword);
    }

    private function createAuthUser(string $url, string $secretKey, User $user, string $plainPassword): string
    {
        $response = $this->request($url, $secretKey)
            ->post("{$url}/auth/v1/admin/users", [
                'email' => $user->email,
                'password' => $plainPassword,
                'email_confirm' => (bool) $user->email_verified_at,
                'user_metadata' => $this->metadata($user),
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

    private function updateAuthUser(string $url, string $secretKey, User $user, ?string $plainPassword = null): string
    {
        $payload = [
            'email' => $user->email,
            'email_confirm' => (bool) $user->email_verified_at,
            'user_metadata' => $this->metadata($user),
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

    private function request(string $url, string $secretKey)
    {
        return Http::withHeaders([
            'apikey' => $secretKey,
            'Authorization' => "Bearer {$secretKey}",
            'Content-Type' => 'application/json',
        ])
            ->connectTimeout(5)
            ->timeout(12);
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

    private function metadata(User $user): array
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
            'is_active' => (bool) $user->is_active,
        ];
    }
}
