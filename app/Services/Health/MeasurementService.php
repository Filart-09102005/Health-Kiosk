<?php

namespace App\Services\Health;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\SessionMeasurement;
use Illuminate\Support\Facades\DB;

class MeasurementService
{
    public function __construct(
        private readonly HealthEvaluationService $evaluation,
        private readonly KioskSessionService $sessions,
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

        $session->measurements()
            ->where('status', 'successful')
            ->latest('measured_at')
            ->get()
            ->each(function (SessionMeasurement $measurement) use (&$latest) {
                if (isset($latest[$measurement->type])) {
                    return;
                }

                if ($measurement->type === 'heart_rate') {
                    $latest['heart_rate'] = (float) $measurement->value;
                    $latest['spo2'] = (float) $measurement->secondary_value;
                    return;
                }

                $latest[$measurement->type] = (float) $measurement->value;
            });

        $summary = $this->evaluation->summarize($latest);

        if ($summary['bmi']) {
            $this->sessions->activity($session, 'calculated_bmi', 'BMI recalculated.', ['bmi' => $summary['bmi']]);
        }

        return HealthRecord::updateOrCreate(
            ['kiosk_session_id' => $session->id],
            ['user_id' => $session->user_id, ...$summary]
        );
    }
}
