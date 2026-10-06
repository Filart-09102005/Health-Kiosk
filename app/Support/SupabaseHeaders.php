<?php

namespace App\Support;

/**
 * Build headers for server-to-server Supabase requests.
 *
 * Modern sb_secret_ keys are opaque API keys, not JWTs. Sending one through
 * Authorization: Bearer makes Supabase reject the request as an invalid JWT.
 * Legacy service_role JWTs still need that header, so both formats remain
 * supported while projects migrate to the current key system.
 */
final class SupabaseHeaders
{
    /** @param array<string, string> $extra */
    public static function forServer(string $apiKey, array $extra = []): array
    {
        $headers = [
            'apikey' => $apiKey,
            'Content-Type' => 'application/json',
            'User-Agent' => 'Health-Kiosk-Laravel-Server/1.0',
        ];

        if (self::isLegacyJwt($apiKey)) {
            $headers['Authorization'] = "Bearer {$apiKey}";
        }

        return array_merge($headers, $extra);
    }

    private static function isLegacyJwt(string $apiKey): bool
    {
        return str_starts_with($apiKey, 'eyJ') && substr_count($apiKey, '.') === 2;
    }
}
