<?php

namespace App\Console\Commands;

use App\Models\Alert;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\SessionMeasurement;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedHansEmergencyAlertsCommand extends Command
{
    protected $signature = 'app:seed-hans-emergency-alerts {--fresh : Remove previous Hans emergency demo alerts first}';

    protected $description = 'Creates Hans Filart emergency demo records for testing separated admin alert popups.';

    public function handle(): int
    {
        $hans = User::query()
            ->where('student_id', 'C-230204')
            ->orWhere('barcode', 'C-230204')
            ->orWhere('email', 'hanskurveyfilart@smcbi.edu.ph')
            ->first();

        if (! $hans) {
            $this->error('Hans Filart was not found. Please run the user testing seeder first.');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->deletePreviousDemoData($hans);
        }

        $fullName = trim("{$hans->firstname} {$hans->lastname}");
        $baseTime = now()->subMinutes(45);
        $nextSessionNumber = ((int) KioskSession::where('user_id', $hans->id)->max('session_number')) + 1;

        $cases = [
            [
                'type' => 'high_temperature',
                'severity' => 'critical',
                'title' => 'High temperature warning detected',
                'health_status' => 'High Temperature Alert',
                'temperature' => 38.6,
                'heart_rate' => 92,
                'spo2' => 97,
                'height' => 165,
                'weight' => 58,
                'bmi' => 21.3,
                'bmi_category' => 'Normal',
                'measurement' => ['type' => 'temperature', 'value' => 38.6, 'unit' => 'C', 'status' => 'critical'],
                'message' => "{$fullName} has a high body temperature reading. Notify the clinic nurse immediately.",
            ],
            [
                'type' => 'low_spo2',
                'severity' => 'critical',
                'title' => 'Low oxygen level detected',
                'health_status' => 'Low SpO2 Alert',
                'temperature' => 36.8,
                'heart_rate' => 88,
                'spo2' => 91,
                'height' => 165,
                'weight' => 58,
                'bmi' => 21.3,
                'bmi_category' => 'Normal',
                'measurement' => ['type' => 'spo2', 'value' => 91, 'unit' => '%', 'status' => 'critical'],
                'message' => "{$fullName} has a low SpO2 reading. Repeat the oximeter reading and notify clinic staff.",
            ],
            [
                'type' => 'high_heart_rate',
                'severity' => 'high',
                'title' => 'High heart rate detected',
                'health_status' => 'High Heart Rate Alert',
                'temperature' => 37.1,
                'heart_rate' => 124,
                'spo2' => 98,
                'height' => 165,
                'weight' => 58,
                'bmi' => 21.3,
                'bmi_category' => 'Normal',
                'measurement' => ['type' => 'heart_rate', 'value' => 124, 'unit' => 'bpm', 'status' => 'alert'],
                'message' => "{$fullName} has an elevated heart rate. Let the student rest and verify symptoms.",
            ],
            [
                'type' => 'low_heart_rate',
                'severity' => 'high',
                'title' => 'Low heart rate detected',
                'health_status' => 'Low Heart Rate Alert',
                'temperature' => 36.4,
                'heart_rate' => 48,
                'spo2' => 98,
                'height' => 165,
                'weight' => 58,
                'bmi' => 21.3,
                'bmi_category' => 'Normal',
                'measurement' => ['type' => 'heart_rate', 'value' => 48, 'unit' => 'bpm', 'status' => 'alert'],
                'message' => "{$fullName} has a low heart rate reading. Clinic verification is recommended.",
            ],
            [
                'type' => 'high_bmi',
                'severity' => 'moderate',
                'title' => 'BMI health risk detected',
                'health_status' => 'BMI Follow-up',
                'temperature' => 36.7,
                'heart_rate' => 82,
                'spo2' => 98,
                'height' => 165,
                'weight' => 84,
                'bmi' => 30.9,
                'bmi_category' => 'Obese',
                'measurement' => ['type' => 'bmi', 'value' => 30.9, 'unit' => '', 'status' => 'alert'],
                'message' => "{$fullName} has a BMI value that needs clinic follow-up.",
            ],
        ];

        foreach ($cases as $index => $case) {
            $startedAt = (clone $baseTime)->addMinutes($index * 7);
            $endedAt = (clone $startedAt)->addMinutes(5);

            $session = KioskSession::create([
                'user_id' => $hans->id,
                'session_number' => $nextSessionNumber + $index,
                'status' => 'completed',
                'login_method' => 'barcode',
                'started_at' => $startedAt,
                'ended_at' => $endedAt,
            ]);

            $measurement = $case['measurement'];

            SessionMeasurement::create([
                'kiosk_session_id' => $session->id,
                'user_id' => $hans->id,
                'type' => $measurement['type'],
                'value' => $measurement['value'],
                'unit' => $measurement['unit'],
                'attempt' => 1,
                'status' => $measurement['status'],
                'measured_at' => (clone $startedAt)->addMinutes(3),
            ]);

            HealthRecord::create([
                'kiosk_session_id' => $session->id,
                'user_id' => $hans->id,
                'heart_rate' => $case['heart_rate'],
                'spo2' => $case['spo2'],
                'temperature' => $case['temperature'],
                'height' => $case['height'],
                'weight' => $case['weight'],
                'bmi' => $case['bmi'],
                'bmi_category' => $case['bmi_category'],
                'health_status' => $case['health_status'],
                'missing_measurements' => [],
                'sync_status' => 0,
            ]);

            Alert::create([
                'user_id' => $hans->id,
                'kiosk_session_id' => $session->id,
                'type' => $case['type'],
                'severity' => $case['severity'],
                'title' => $case['title'],
                'message' => $case['message'],
                'read_at' => null,
            ]);

            DB::table('session_activities')->insert([
                [
                    'kiosk_session_id' => $session->id,
                    'user_id' => $hans->id,
                    'action' => 'Login',
                    'description' => 'Student authenticated at kiosk',
                    'metadata' => json_encode(['source' => 'emergency_demo']),
                    'created_at' => $startedAt,
                    'updated_at' => $startedAt,
                ],
                [
                    'kiosk_session_id' => $session->id,
                    'user_id' => $hans->id,
                    'action' => $case['title'],
                    'description' => $case['message'],
                    'metadata' => json_encode(['source' => 'emergency_demo', 'alert_type' => $case['type']]),
                    'created_at' => (clone $startedAt)->addMinutes(3),
                    'updated_at' => (clone $startedAt)->addMinutes(3),
                ],
                [
                    'kiosk_session_id' => $session->id,
                    'user_id' => $hans->id,
                    'action' => 'Logout',
                    'description' => 'Student exited kiosk after emergency alert review',
                    'metadata' => json_encode(['source' => 'emergency_demo']),
                    'created_at' => $endedAt,
                    'updated_at' => $endedAt,
                ],
            ]);
        }

        $this->info("Created ".count($cases)." emergency demo records for {$fullName}.");
        $this->comment('Open the admin dashboard. The global alert modal should show the unread emergency alerts one by one.');

        return self::SUCCESS;
    }

    private function deletePreviousDemoData(User $hans): void
    {
        $demoSessionIds = DB::table('session_activities')
            ->where('user_id', $hans->id)
            ->where('metadata->source', 'emergency_demo')
            ->pluck('kiosk_session_id')
            ->unique()
            ->values();

        if ($demoSessionIds->isEmpty()) {
            return;
        }

        Alert::whereIn('kiosk_session_id', $demoSessionIds)->delete();
        KioskSession::whereIn('id', $demoSessionIds)->delete();
    }
}
