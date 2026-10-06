<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The four clinic reports, exported both ways.
 *
 * A failing export reaches the admin as one flat "an error occurred" toast with
 * nothing to act on, so each type is exercised here with data and without.
 */
class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    private const TYPES = ['measurement_analytics', 'alert_analytics', 'follow_up', 'recently_resolved'];

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    private function seedOneOfEverything(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'department' => 'COLLEGE',
            'program' => 'BSIT',
            'year_level' => '4th Year',
            'gender' => 'male',
            'email_verified_at' => now(),
        ]);

        $session = KioskSession::create([
            'user_id' => $student->id,
            'session_number' => 1,
            'status' => 'completed',
            'started_at' => now(),
        ]);

        HealthRecord::create([
            'user_id' => $student->id,
            'kiosk_session_id' => $session->id,
            'temperature' => 38.5,
            'heart_rate' => 110,
            'spo2' => 93,
            'height' => 170,
            'weight' => 60,
            'bmi' => 20.76,
            'bmi_category' => 'Normal',
            'health_status' => 'Alert',
        ]);

        Alert::create([
            'user_id' => $student->id,
            'kiosk_session_id' => $session->id,
            'type' => 'temperature',
            'severity' => 'critical',
            'title' => 'Critical Temperature',
            'message' => 'Temperature reading is 38.5°C.',
        ]);

        Alert::create([
            'user_id' => $student->id,
            'kiosk_session_id' => $session->id,
            'type' => 'spo2',
            'severity' => 'moderate',
            'title' => 'Low SpO2',
            'message' => 'SpO2 level is 93%.',
            'read_at' => now(),
        ]);
    }

    public function test_every_report_type_exports_a_pdf_when_records_exist(): void
    {
        $this->seedOneOfEverything();
        $admin = $this->admin();

        foreach (self::TYPES as $type) {
            $response = $this->actingAs($admin)->get("/api/admin/reports/download-pdf?type={$type}");

            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "{$type} did not return a PDF");
        }
    }

    public function test_every_report_type_exports_a_pdf_when_there_is_nothing_to_report(): void
    {
        $admin = $this->admin();

        foreach (self::TYPES as $type) {
            $response = $this->actingAs($admin)->get("/api/admin/reports/download-pdf?type={$type}");

            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "{$type} did not return a PDF");
        }
    }

    public function test_every_report_type_exports_an_excel_file(): void
    {
        $this->seedOneOfEverything();
        $admin = $this->admin();

        foreach (self::TYPES as $type) {
            $this->actingAs($admin)
                ->get("/api/admin/reports/download-excel?type={$type}")
                ->assertOk();
        }
    }

    public function test_a_date_range_filter_is_carried_into_the_pdf(): void
    {
        $this->seedOneOfEverything();

        $this->actingAs($this->admin())
            ->get('/api/admin/reports/download-pdf?type=measurement_analytics&date_from=' . now()->subDay()->toDateString() . '&date_to=' . now()->toDateString())
            ->assertOk();
    }

    /**
     * The Measurement Analytics row builds its own file from this payload, so a
     * missing route showed up as "an error occurred while generating the PDF".
     */
    public function test_the_report_data_endpoint_serves_the_measurement_rows(): void
    {
        $this->seedOneOfEverything();

        $this->actingAs($this->admin())
            ->getJson('/api/admin/reports/data?type=measurement_analytics')
            ->assertOk()
            ->assertJsonPath('type', 'measurement_analytics')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.health_status', 'Alert');
    }

    public function test_an_unknown_report_type_is_refused_rather_than_crashing(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/reports/download-pdf?type=not_a_report')
            ->assertStatus(422);
    }
}
