<?php

namespace Tests\Feature;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The admin header's "Sync Users & Records" button.
 *
 * It decided what to send from local flags alone, so a row deleted in the
 * Supabase dashboard still looked synced here and was skipped — the button then
 * reported "no users or health records need syncing" while the cloud table was
 * empty. Pressing it now means "make the cloud match this kiosk".
 */
class CloudSyncButtonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.supabase.url' => 'https://example.supabase.co',
            'services.supabase.secret_key' => 'test-secret',
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    /** A student already marked as fully synced, with one record in the same state. */
    private function alreadySyncedStudent(): User
    {
        $student = User::factory()->create([
            'role' => 'student',
            'email_verified_at' => now(),
            'supabase_auth_id' => 'auth-'.uniqid(),
        ]);

        $session = KioskSession::create([
            'user_id' => $student->id,
            'session_number' => 1,
            'status' => 'completed',
            'started_at' => now(),
        ]);

        $record = HealthRecord::create([
            'user_id' => $student->id,
            'kiosk_session_id' => $session->id,
            'temperature' => 36.5,
            'health_status' => 'Normal',
        ]);

        User::withoutTimestamps(fn () => $student->forceFill(['sync_status' => 1, 'synced_at' => now()])->save());
        HealthRecord::withoutTimestamps(fn () => $record->forceFill(['sync_status' => 1, 'synced_at' => now()])->save());

        return $student;
    }

    private function fakeSupabase(): void
    {
        Http::fake([
            '*/rest/v1/users*' => Http::response([['id' => 'remote-1', 'local_user_id' => 2]], 201),
            '*/rest/v1/health_records*' => Http::response([['id' => 'remote-rec-1', 'local_health_record_id' => 1]], 201),
            '*' => Http::response([], 200),
        ]);
    }

    public function test_pressing_sync_uploads_rows_that_are_already_marked_synced(): void
    {
        $this->fakeSupabase();
        $student = $this->alreadySyncedStudent();

        $this->assertSame(1, (int) $student->fresh()->sync_status, 'precondition: the row looks synced');

        $response = $this->actingAs($this->admin())->postJson('/api/admin/sync/users');

        $response->assertOk()->assertJsonPath('full_resync', true);

        // The whole point: it went up anyway.
        $this->assertGreaterThan(0, $response->json('users.synced_count'));
    }

    public function test_health_records_are_re_uploaded_too(): void
    {
        $this->fakeSupabase();
        $this->alreadySyncedStudent();

        $response = $this->actingAs($this->admin())->postJson('/api/admin/sync/users');

        $response->assertOk();
        $this->assertGreaterThan(0, $response->json('health_records.synced_count'));
    }

    public function test_everything_is_marked_synced_again_afterwards(): void
    {
        $this->fakeSupabase();
        $student = $this->alreadySyncedStudent();

        $this->actingAs($this->admin())->postJson('/api/admin/sync/users')->assertOk();

        $this->assertSame(1, (int) $student->fresh()->sync_status);
        $this->assertNotNull($student->fresh()->synced_at);
    }

    public function test_a_non_admin_cannot_trigger_a_sync(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);

        $this->actingAs($student)->postJson('/api/admin/sync/users')->assertForbidden();
    }

    public function test_mark_all_pending_clears_the_flags_without_touching_updated_at(): void
    {
        Http::fake();
        $student = $this->alreadySyncedStudent();
        $before = $student->fresh()->updated_at;

        \App\Services\SupabaseUserSyncService::markAllPending();

        $after = $student->fresh();
        $this->assertSame(0, (int) $after->sync_status);
        $this->assertNull($after->synced_at);
        $this->assertEquals($before, $after->updated_at, 'updated_at is a fact about the record, not the upload');
    }
}
