<?php

namespace App\Services\Health;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\SessionMeasurement;
use App\Models\Alert;
use Illuminate\Support\Facades\DB;

class MeasurementService
{
    public function __construct(
        private readonly HealthEvaluationService $evaluation,
        private readonly KioskSessionService $sessions,
        private readonly UserNotificationService $notifications,
    ) {}

    public function save(KioskSession $session, array $data): HealthRecord
    {
        return DB::transaction(function () use ($session, $data) {
            $attempt = ((int) $session->measurements()
                ->where('type', $data['type'])
                ->max('attempt')) + 1;

            $measurement = SessionMeasurement::create([
                'kiosk_session_id' => $session->id,
                'user_id' => $session->user_id,
                'type' => $data['type'],
                'value' => $data['value'],
                'secondary_value' => $data['secondary_value'] ?? null,
                'unit' => $data['unit'] ?? null,
                'attempt' => $attempt,
                'status' => 'successful',
                'input_source' => $data['input_source'] ?? 'smart',
                'metadata' => $data['metadata'] ?? null,
                'measured_at' => now(),
            ]);

            $this->sessions->activity(
                $session,
                $attempt > 1 ? "retry_{$data['type']}" : "saved_{$data['type']}",
                'Measurement saved.',
                ['measurement_id' => $measurement->id, 'attempt' => $attempt]
            );

            return $this->syncHealthRecord($session);
        });
    }

    public function syncHealthRecord(KioskSession $session): HealthRecord
    {
        $latest = [];
        $skipped = [];

        $session->measurements()
            ->latest('measured_at')
            ->get()
            ->each(function (SessionMeasurement $measurement) use (&$latest, &$skipped) {
                if (isset($latest[$measurement->type]) || in_array($measurement->type, $skipped)) {
                    return;
                }

                if ($measurement->status === 'skipped') {
                    $skipped[] = $measurement->type;
                    return;
                }

                if ($measurement->status === 'successful') {
                    if ($measurement->type === 'heart_rate') {
                        $latest['heart_rate'] = (float) $measurement->value;
                        $latest['spo2'] = (float) $measurement->secondary_value;
                        return;
                    }

                    $latest[$measurement->type] = (float) $measurement->value;
                }
            });

        $summary = $this->evaluation->summarize($latest);

        if ($summary['bmi']) {
            $this->sessions->activity($session, 'calculated_bmi', 'BMI recalculated.', ['bmi' => $summary['bmi']]);
        }

        $healthRecord = HealthRecord::updateOrCreate(
            ['kiosk_session_id' => $session->id],
            [
                'user_id' => $session->user_id,
                // Captured now so the record keeps the level it was taken at,
                // instead of following the account as the student moves up.
                'academic_level' => \App\Support\AcademicLevel::forUser($session->user),
                'school_year' => \App\Support\AcademicLevel::schoolYearFor(),
                'skipped_measurements' => $skipped,
                ...$summary,
            ]
        );

        $this->generateAlerts($session, $latest, $summary);

        // The student's own copy of the same findings. Written on every save
        // so a reading that returns to normal also takes its notification
        // away, rather than leaving a stale warning behind.
        $this->notifications->syncForRecord($healthRecord);

        return $healthRecord;
    }

    private function generateAlerts(KioskSession $session, array $latest, array $summary): void
    {
        $settings = \App\Support\AdminSettings::all();
        if ($settings['alertsEnabled'] === false) {
            return;
        }

        $statuses = $summary['measurement_statuses'] ?? [];

        // 1. Temperature
        if (isset($latest['temperature'], $statuses['temperature']) && $statuses['temperature'] !== 'Normal') {
            $severity = $statuses['temperature'] === 'Consult Clinic' ? 'critical' : 'moderate';
            $title = $statuses['temperature'] === 'Consult Clinic' ? 'Critical Temperature' : 'Abnormal Temperature';
            $this->createAlert($session, 'temperature', $severity, $title, "Temperature reading is {$latest['temperature']}°C.");
        }

        // 2. Heart Rate
        if (isset($latest['heart_rate'], $statuses['heart_rate']) && $statuses['heart_rate'] !== 'Normal') {
            $severity = $statuses['heart_rate'] === 'Consult Clinic' ? 'critical' : 'moderate';
            $title = $statuses['heart_rate'] === 'Consult Clinic' ? 'Critical Heart Rate' : 'Abnormal Heart Rate';
            $this->createAlert($session, 'heart_rate', $severity, $title, "Heart rate is {$latest['heart_rate']} bpm.");
        }

        // 3. SpO2
        if (isset($latest['spo2'], $statuses['spo2']) && $statuses['spo2'] !== 'Normal') {
            $severity = $statuses['spo2'] === 'Consult Clinic' ? 'critical' : 'moderate';
            $title = $statuses['spo2'] === 'Consult Clinic' ? 'Critical SpO2' : 'Low SpO2';
            $this->createAlert($session, 'spo2', $severity, $title, "SpO2 level is {$latest['spo2']}%.");
        }

        // 4. BMI
        if (isset($summary['bmi'], $statuses['bmi']) && $statuses['bmi'] !== 'Normal') {
            $cat = $summary['bmi_category'] ?? 'Abnormal';
            $this->createAlert($session, 'bmi', 'moderate', $cat, "BMI is {$summary['bmi']} ({$cat}).");
        }
    }

    private function createAlert(KioskSession $session, string $type, string $severity, string $title, string $message): void
    {
        // This is keyed by (session, type), so an already-resolved alert of
        // the same type in the same session used to stay marked resolved
        // (read_at/resolved_by/resolution_notes untouched) even when a fresh
        // measurement came back abnormal again - the admin never saw the new
        // event. Every call here means "this type is abnormal right now", so
        // it always reopens the alert.
        //
        // `new_measurement` is not touched here: it is the admin's own
        // free-text follow-up reading, entered when they resolve an alert
        // (see AlertController::resolve()) - not a flag about this
        // measurement. It used to be stamped `true` on every create/update,
        // which is what made resolveAll()'s bulk-resolved alerts display the
        // literal string "1" as their "new measurement" value.
        Alert::updateOrCreate([
            'kiosk_session_id' => $session->id,
            'type' => $type,
        ], [
            'user_id' => $session->user_id,
            'severity' => $severity,
            'title' => $title,
            'message' => $message,
            'read_at' => null,
            'resolved_by' => null,
            'resolution_notes' => null,
        ]);
    }
}
