<?php

namespace Tests\Unit;

use App\Support\SupabaseHeaders;
use PHPUnit\Framework\TestCase;

class SupabaseHeadersTest extends TestCase
{
    public function test_modern_secret_key_is_only_sent_as_an_api_key(): void
    {
        $headers = SupabaseHeaders::forServer('sb_secret_example');

        $this->assertSame('sb_secret_example', $headers['apikey']);
        $this->assertArrayNotHasKey('Authorization', $headers);
        $this->assertSame('Health-Kiosk-Laravel-Server/1.0', $headers['User-Agent']);
    }

    public function test_legacy_service_role_jwt_keeps_the_bearer_header(): void
    {
        $jwt = 'eyJheader.payload.signature';
        $headers = SupabaseHeaders::forServer($jwt);

        $this->assertSame($jwt, $headers['apikey']);
        $this->assertSame("Bearer {$jwt}", $headers['Authorization']);
    }

    public function test_call_specific_headers_are_merged(): void
    {
        $headers = SupabaseHeaders::forServer('sb_secret_example', [
            'Prefer' => 'resolution=merge-duplicates,return=representation',
        ]);

        $this->assertSame('resolution=merge-duplicates,return=representation', $headers['Prefer']);
    }
}
