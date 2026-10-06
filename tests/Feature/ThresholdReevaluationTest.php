<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\AdminSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ThresholdReevaluationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    /**
     * A complete set of readings, all comfortably normal under the shipped
     * bands. Complete matters: a record with any measurement missing grades as
     * Incomplete whatever the others say, so a partial one could not show the
     * change of grade this is testing.
     */
    private function normalRecord(User $student): HealthRecord
    {
        $session = KioskSession::create([
            'user_id' => $student->id,
            'session_number' => 1,
            'status' => 'active',
            'started_at' => now(),
        ]);

        return HealthRecord::create([
            'user_id' => $student->id,
            'kiosk_session_id' => $session->id,
            'temperature' => 36.8,
            'heart_rate' => 75,
            'spo2' => 98,
            'height' => 170,
            'weight' => 60,
            'bmi' => 20.76,
            'bmi_category' => 'Normal',
            'health_status' => 'Normal',
        ]);
    }

    private function tightenTemperatureBand(User $admin): void
    {
        $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'temperature' => ['alertLow' => 36.9, 'normalLow' => 36.9, 'normalHigh' => 37.0, 'alertHigh' => 37.0],
            ],
        ])->assertOk();
    }

    public function test_tightening_a_band_regrades_the_stored_record(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $record = $this->normalRecord($student);

        $this->tightenTemperatureBand($this->admin());

        $this->assertSame('Alert', $record->fresh()->health_status);
    }

    public function test_the_student_is_notified_when_a_band_makes_their_reading_abnormal(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $this->normalRecord($student);

        $this->assertSame(0, UserNotification::where('user_id', $student->id)->count());

        $this->tightenTemperatureBand($this->admin());

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $student->id,
            'key' => 'temp-low',
            'read_at' => null,
        ]);
    }

    public function test_the_clinic_gets_an_alert_when_a_band_makes_a_reading_abnormal(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $record = $this->normalRecord($student);

        $this->tightenTemperatureBand($this->admin());

        $this->assertDatabaseHas('alerts', [
            'kiosk_session_id' => $record->kiosk_session_id,
            'type' => 'temperature',
            'severity' => 'critical',
        ]);
    }

    public function test_widening_a_band_retires_the_alert_and_the_notification(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $record = $this->normalRecord($student);
        $admin = $this->admin();

        $this->tightenTemperatureBand($admin);
        $this->assertSame(1, Alert::where('kiosk_session_id', $record->kiosk_session_id)->count());

        // Back to the shipped band, where 36.8 °C is normal again.
        $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'temperature' => ['alertLow' => 35, 'normalLow' => 35, 'normalHigh' => 37.2, 'alertHigh' => 37.2],
            ],
        ])->assertOk();

        $this->assertSame('Normal', $record->fresh()->health_status);
        $this->assertSame(0, Alert::where('kiosk_session_id', $record->kiosk_session_id)->count());
        $this->assertSame(0, UserNotification::where('user_id', $student->id)->count());
    }

    public function test_saving_a_setting_that_is_not_a_band_regrades_nothing(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $this->normalRecord($student);

        $response = $this->actingAs($this->admin())->putJson('/api/admin/settings', [
            'settings' => ['platformOffsetCm' => 3],
        ]);

        $response->assertOk()->assertJsonPath('regraded_records', 0);
        $this->assertSame(3.0, (float) AdminSettings::all()['platformOffsetCm']);
    }
}
