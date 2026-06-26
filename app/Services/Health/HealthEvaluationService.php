<?php

namespace App\Services\Health;

class HealthEvaluationService
{
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

        $status = $this->status($latest, $bmi, $missing);

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
        ];
    }

    private function bmiCategory(float $bmi): string
    {
        return match (true) {
            $bmi < 18.5 => 'Underweight',
            $bmi < 25 => 'Normal',
            $bmi < 30 => 'Overweight',
            default => 'Obese',
        };
    }

    private function status(array $latest, ?float $bmi, array $missing): string
    {
        if ($missing !== []) {
            return 'Incomplete';
        }

        if (
            ($latest['temperature'] ?? 0) >= 38 ||
            ($latest['heart_rate'] ?? 0) >= 120 ||
            ($latest['spo2'] ?? 100) < 94 ||
            ($bmi !== null && ($bmi < 16 || $bmi >= 35))
        ) {
            return 'Alert';
        }

        if (
            ($latest['temperature'] ?? 0) >= 37.5 ||
            ($latest['heart_rate'] ?? 0) >= 100 ||
            ($latest['spo2'] ?? 100) < 96 ||
            ($bmi !== null && ($bmi < 18.5 || $bmi >= 30))
        ) {
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
            'Alert' => 'Please proceed to the clinic staff for immediate review.',
            'Watch' => 'Please rest, hydrate, and consider a clinic recheck if symptoms continue.',
            default => 'Vitals are within the expected range. Maintain healthy hydration and regular monitoring.',
        };
    }
}
