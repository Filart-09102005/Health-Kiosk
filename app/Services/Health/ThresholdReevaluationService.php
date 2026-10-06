<?php

namespace App\Services\Health;

use App\Models\Alert;
use App\Models\HealthRecord;

/**
 * Re-grades stored records against the thresholds in force.
 *
 * Changing a band used to move a reading from Normal to Consult Clinic on the records
 * screen and nowhere else: the student was never told, and no alert reached the
 * clinic. The grade, the student's notification and the clinic's alert all come
 * from the same numbers, so they are all rebuilt together.
 */
class ThresholdReevaluationService
{
    /** Alert types this service owns, so it can retire the ones that no longer apply. */
    private const ALERT_TYPES = ['temperature', 'heart_rate', 'spo2', 'bmi'];

    public function __construct(private readonly UserNotificationService $notifications) {}

    /** @return int the number of records re-graded */
    public function run(): int
    {
        // Built here rather than injected: the evaluator reads the settings once
        // in its constructor, and this runs immediately after they changed.
        $evaluator = new HealthEvaluationService();
        $count = 0;

        HealthRecord::query()
            ->with('kioskSession')
            ->orderBy('id')
            ->chunkById(200, function ($records) use ($evaluator, &$count) {
                foreach ($records as $record) {
                    $this->regrade($record, $evaluator);
                    $count++;
                }
            });

        return $count;
    }

    private function regrade(HealthRecord $record, HealthEvaluationService $evaluator): void
    {
        $summary = $evaluator->summarize(array_filter([
            'heart_rate' => $record->heart_rate,
            'spo2' => $record->spo2,
            'temperature' => $record->temperature,
            'height' => $record->height,
            'weight' => $record->weight,
        ], fn ($value) => $value !== null && $value !== ''));

        $record->forceFill([
            'bmi' => $summary['bmi'],
            'bmi_category' => $summary['bmi_category'],
            'health_status' => $summary['health_status'],
            'missing_measurements' => $summary['missing_measurements'],
            'advice' => $summary['advice'],
        ])->save();

        $this->syncAlerts($record, $summary);
        $this->notifications->syncForRecord($record->fresh());
    }

    /**
     * Bring the clinic's alerts for this session in line with the new grades.
     *
     * Retires as well as raises: a band widened so a reading is now normal must
     * not leave the old alert sitting in the queue.
     */
    private function syncAlerts(HealthRecord $record, array $summary): void
    {
        $session = $record->kioskSession;

        if (! $session) {
            return;
        }

        $statuses = $summary['measurement_statuses'] ?? [];
        $wanted = [];

        foreach (['temperature' => '°C', 'heart_rate' => ' bpm', 'spo2' => '%'] as $type => $unit) {
            $status = $statuses[$type] ?? 'Normal';
            $value = $summary[$type] ?? null;

            if ($status === 'Normal' || $value === null) {
                continue;
            }

            $wanted[$type] = [
                'severity' => $status === 'Consult Clinic' ? 'critical' : 'moderate',
                'title' => $this->alertTitle($type, $status),
                'message' => $this->alertMessage($type, $value, $unit),
            ];
        }

        if (isset($summary['bmi'], $statuses['bmi']) && $statuses['bmi'] !== 'Normal') {
            $category = $summary['bmi_category'] ?? 'Abnormal';
            $wanted['bmi'] = [
                'severity' => 'moderate',
                'title' => $category,
                'message' => "BMI is {$summary['bmi']} ({$category}).",
            ];
        }

        foreach ($wanted as $type => $payload) {
            // Same reactivation rule as MeasurementService::createAlert(): a
            // threshold change that turns a previously-normal reading
            // abnormal must surface even if that alert type was already
            // resolved from before the change - that is the whole point of
            // this service. `new_measurement` is left alone; it holds the
            // admin's own free-text follow-up value from resolving an alert,
            // not a flag this code should be setting.
            Alert::updateOrCreate(
                ['kiosk_session_id' => $session->id, 'type' => $type],
                ['user_id' => $session->user_id, 'read_at' => null, 'resolved_by' => null, 'resolution_notes' => null, ...$payload],
            );
        }

        Alert::query()
            ->where('kiosk_session_id', $session->id)
            ->whereIn('type', array_values(array_diff(self::ALERT_TYPES, array_keys($wanted))))
            ->delete();
    }

    private function alertTitle(string $type, string $status): string
    {
        $critical = $status === 'Consult Clinic';

        return match ($type) {
            'temperature' => $critical ? 'Critical Temperature' : 'Abnormal Temperature',
            'heart_rate' => $critical ? 'Critical Heart Rate' : 'Abnormal Heart Rate',
            'spo2' => $critical ? 'Critical SpO2' : 'Low SpO2',
            default => 'Abnormal Reading',
        };
    }

    private function alertMessage(string $type, mixed $value, string $unit): string
    {
        $reading = rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.');

        return match ($type) {
            'temperature' => "Temperature reading is {$reading}{$unit}.",
            'heart_rate' => "Heart rate is {$reading}{$unit}.",
            'spo2' => "SpO2 level is {$reading}{$unit}.",
            default => "Reading is {$reading}{$unit}.",
        };
    }
}
