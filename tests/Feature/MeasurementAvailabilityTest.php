<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Setting;
use App\Models\User;
use App\Services\Health\MeasurementAvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MeasurementAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Creating a user fires UserObserver, which reaches out to Supabase.
        // Faked so these tests never touch the network.
        Http::fake();
    }

    protected function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    protected function student(): User
    {
        return User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
    }

    public function test_every_sensor_defaults_to_smart_mode_enabled(): void
    {
        $response = $this->actingAs($this->student())->getJson('/api/measurement-availability');

        $response->assertOk();

        foreach (MeasurementAvailabilityService::types() as $type) {
            $response->assertJsonPath("availability.{$type}.smart_enabled", true);
            $response->assertJsonPath("availability.{$type}.manual_enabled", true);
        }
    }

    public function test_admin_can_disable_smart_mode_for_one_sensor(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/measurement-availability', [
                'availability' => ['heart_rate' => ['smart_enabled' => false]],
            ])
            ->assertOk()
            ->assertJsonPath('availability.heart_rate.smart_enabled', false)
            ->assertJsonPath('availability.temperature.smart_enabled', true);

        $this->assertFalse(app(MeasurementAvailabilityService::class)->isSmartEnabled('heart_rate'));
        $this->assertTrue(app(MeasurementAvailabilityService::class)->isSmartEnabled('weight'));
    }

    public function test_state_is_persisted_globally_in_a_single_settings_row(): void
    {
        $service = app(MeasurementAvailabilityService::class);

        $service->update(['height' => ['smart_enabled' => false]]);
        $service->update(['weight' => ['smart_enabled' => false]]);

        $rows = Setting::where('key', MeasurementAvailabilityService::SETTING_KEY)->get();

        $this->assertCount(1, $rows);
        $this->assertNull($rows->first()->user_id);
        // Second write merges rather than replacing.
        $this->assertFalse($service->isSmartEnabled('height'));
        $this->assertFalse($service->isSmartEnabled('weight'));
    }

    public function test_manual_mode_can_never_be_disabled(): void
    {
        $service = app(MeasurementAvailabilityService::class);

        // Even a payload that tries to switch Manual off leaves it on.
        $service->update(['temperature' => ['smart_enabled' => false, 'manual_enabled' => false]]);

        $this->assertTrue($service->all()['temperature']['manual_enabled']);

        $this->actingAs($this->student())
            ->getJson('/api/measurement-availability')
            ->assertJsonPath('availability.temperature.manual_enabled', true)
            ->assertJsonPath('availability.temperature.smart_enabled', false);
    }

    public function test_unknown_measurement_keys_are_not_stored(): void
    {
        app(MeasurementAvailabilityService::class)->update([
            'weight' => ['smart_enabled' => false],
            'blood_pressure' => ['smart_enabled' => false],
        ]);

        $stored = Setting::whereNull('user_id')
            ->where('key', MeasurementAvailabilityService::SETTING_KEY)
            ->value('value');

        $this->assertSame(['weight' => false], $stored);
    }

    public function test_non_admins_cannot_change_availability(): void
    {
        $this->actingAs($this->student())
            ->putJson('/api/admin/measurement-availability', [
                'availability' => ['weight' => ['smart_enabled' => false]],
            ])
            ->assertForbidden();

        $this->assertTrue(app(MeasurementAvailabilityService::class)->isSmartEnabled('weight'));
    }

    public function test_guests_cannot_read_availability(): void
    {
        $this->getJson('/api/measurement-availability')->assertUnauthorized();
    }

    public function test_invalid_payload_is_rejected(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/measurement-availability', [
                'availability' => ['weight' => ['smart_enabled' => 'maybe']],
            ])
            ->assertStatus(422);
    }

    public function test_a_change_is_written_to_the_activity_log(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->putJson('/api/admin/measurement-availability', [
            'availability' => ['height' => ['smart_enabled' => false]],
        ])->assertOk();

        $log = ActivityLog::where('action', 'measurement_availability_updated')->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, $log->user_id);
        $this->assertSame(['height' => false], $log->metadata['changes']);

        // Re-sending the same value is not a change, so it must not log again.
        $this->actingAs($admin)->putJson('/api/admin/measurement-availability', [
            'availability' => ['height' => ['smart_enabled' => false]],
        ])->assertOk();

        $this->assertSame(1, ActivityLog::where('action', 'measurement_availability_updated')->count());
    }
}
