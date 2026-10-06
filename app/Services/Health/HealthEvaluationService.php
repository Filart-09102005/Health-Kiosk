<?php

namespace App\Services\Health;

use App\Support\AdminSettings;

class HealthEvaluationService
{
    private array $settings;

    public function __construct()
    {
        // Saved values merged over the shipped defaults, so a settings row that
        // omits a group still grades rather than indexing a missing key.
        $this->settings = AdminSettings::all();
    }

    public function summarize(array $latest): array
    {
        $missing = collect(['heart_rate', 'spo2', 'temperature', 'height', 'weight'])
            ->filter(fn (string $key) => ! isset($latest[$key]))
            ->values()
            ->all();

        $bmi = null;
        $bmiCategory = null;

        if (isset($latest['height'], $latest['weight']) && (float) $latest['height'] > 0) {
            $heightMeters = (float) $latest['height'] / 100;
            $bmi = round((float) $latest['weight'] / ($heightMeters * $heightMeters), 2);
            $bmiCategory = $this->bmiCategory($bmi);
        }

        if ($bmi === null) {
            $missing[] = 'bmi';
        }

        $measurementStatuses = $this->evaluateMeasurements($latest, $bmi);
        $status = $this->overallStatus($measurementStatuses, $missing);

        return [
            'heart_rate' => $latest['heart_rate'] ?? null,
            'spo2' => $latest['spo2'] ?? null,
            'temperature' => $latest['temperature'] ?? null,
            'height' => $latest['height'] ?? null,
            'weight' => $latest['weight'] ?? null,
            'bmi' => $bmi,
            'bmi_category' => $bmiCategory,
            'health_status' => $status,
            'missing_measurements' => $missing,
            'advice' => $this->advice($status, $missing),
            'measurement_statuses' => $measurementStatuses,
        ];
    }

    private function bmiCategory(float $bmi): string
    {
        $cfg = $this->settings['bmi'];
        return match (true) {
            $bmi <= $cfg['underweightMax'] => 'Underweight',
            $bmi <= $cfg['normalMax'] => 'Normal',
            $bmi <= $cfg['overweightMax'] => 'Overweight',
            default => 'Obese',
        };
    }

    private function evaluateMeasurements(array $latest, ?float $bmi): array
    {
        $statuses = [];

        if (isset($latest['temperature'])) {
            $val = (float) $latest['temperature'];
            $cfg = $this->settings['temperature'];
            if ($val < $cfg['alertLow'] || $val > $cfg['alertHigh']) {
                $statuses['temperature'] = 'Consult Clinic';
            } elseif ($val < $cfg['normalLow'] || $val > $cfg['normalHigh']) {
                $statuses['temperature'] = 'Watch';
            } else {
                $statuses['temperature'] = 'Normal';
            }
        }

        if (isset($latest['heart_rate'])) {
            $val = (float) $latest['heart_rate'];
            $cfg = $this->settings['heartRate'];
            if ($val < $cfg['alertLow'] || $val > $cfg['alertHigh']) {
                $statuses['heart_rate'] = 'Consult Clinic';
            } elseif ($val < $cfg['normalLow'] || $val > $cfg['normalHigh']) {
                $statuses['heart_rate'] = 'Watch';
            } else {
                $statuses['heart_rate'] = 'Normal';
            }
        }

        if (isset($latest['spo2'])) {
            $val = (float) $latest['spo2'];
            $cfg = $this->settings['spo2'];
            if ($val < $cfg['alertLow']) {
                $statuses['spo2'] = 'Consult Clinic';
            } elseif ($val < $cfg['normalLow']) {
                $statuses['spo2'] = 'Watch';
            } else {
                $statuses['spo2'] = 'Normal';
            }
        }

        if ($bmi !== null) {
            $cat = $this->bmiCategory($bmi);
            if ($cat === 'Underweight' || $cat === 'Obese') {
                $statuses['bmi'] = 'Watch';
            } else {
                $statuses['bmi'] = 'Normal';
            }
        }

        return $statuses;
    }

    private function overallStatus(array $measurementStatuses, array $missing): string
    {
        if ($missing !== []) {
            return 'Incomplete';
        }

        if (in_array('Consult Clinic', $measurementStatuses, true)) {
            return 'Consult Clinic';
        }

        if (in_array('Watch', $measurementStatuses, true)) {
            return 'Watch';
        }

        return 'Normal';
    }

    private function advice(string $status, array $missing): string
    {
        if ($status === 'Incomplete') {
            return 'Complete the missing measurements before printing a final health summary: '.implode(', ', $missing).'.';
        }

        return match ($status) {
            'Consult Clinic' => 'Please proceed to the clinic staff for immediate review.',
            'Watch' => 'Please rest, hydrate, and consider a clinic recheck if symptoms continue.',
            default => 'Vitals are within the expected range. Maintain healthy hydration and regular monitoring.',
        };
    }
}
