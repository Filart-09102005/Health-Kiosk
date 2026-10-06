<?php

namespace App\Support;

/**
 * Plausible bounds for each measurement type, per acquisition mode.
 *
 * These answer "could this number have come from this source?", which is a
 * different question from the concern thresholds in HealthEvaluationService
 * (those decide whether an already-valid reading warrants an alert).
 *
 * Both modes now share one table. Manual entry used to be graded more tightly
 * on the theory that a hand-transcribed number outside clinical norms is a typo
 * worth blocking. In practice the person at the kiosk is copying whatever the
 * external device displays and cannot know in advance which readings the form
 * will accept — being told "Temperature must be between 34 and 43" after
 * reading 33.0 off a thermometer is a dead end, since the only honest response
 * is to type a number the device never showed.
 *
 * So these bounds now answer one question in both modes: could any real device
 * have displayed this? They stay wide enough to admit any plausible reading and
 * tight enough to catch genuine garbage (an empty sensor, a stray keypress).
 * Whether a reading is *concerning* is not decided here — that is
 * HealthEvaluationService's job, driven by the admin thresholds, and it flags
 * rather than blocks.
 *
 * Mirrored on the client in
 * resources/js/Pages/User/Measurements/constants/measurementRanges.js —
 * the two must be changed together.
 */
class MeasurementRanges
{
    public const TYPES = ['heart_rate', 'temperature', 'height', 'weight'];

    public const MODES = ['smart', 'manual'];

    /**
     * Sensor-acquisition bounds, following the kiosk firmware's own profiles in
     * arduino/HealthKioskFirmware/src/config/SensorProfiles.h, widened where the
     * firmware permitted physically impossible readings (its height and weight
     * floors are 0, which is reasonable for a sensor but not for a person).
     *
     * Keyed by request field so violations map straight onto validation errors.
     */
    private const SMART = [
        'heart_rate' => [
            'value' => ['min' => 25, 'max' => 250, 'label' => 'Heart rate', 'unit' => 'bpm'],
            'secondary_value' => ['min' => 50, 'max' => 100, 'label' => 'SpO2', 'unit' => '%'],
        ],
        'temperature' => [
            'value' => ['min' => 25, 'max' => 45, 'label' => 'Temperature', 'unit' => '°C'],
        ],
        'height' => [
            'value' => ['min' => 50, 'max' => 250, 'label' => 'Height', 'unit' => 'cm'],
        ],
        'weight' => [
            'value' => ['min' => 1, 'max' => 250, 'label' => 'Weight', 'unit' => 'kg'],
        ],
    ];

    /**
     * Manual-entry divergences, merged field-wise over SMART.
     *
     * Intentionally empty: manual entry is held to the same bounds as the
     * sensors. The extension point is kept because merging one field is a
     * one-line change if a future device genuinely needs a different limit.
     */
    private const MANUAL_OVERRIDES = [];

    /**
     * @return array<string, array{min: int|float, max: int|float, label: string, unit: string}>
     */
    public static function for(string $mode, string $type): array
    {
        $ranges = self::SMART[$type] ?? [];

        if ($mode !== 'manual') {
            return $ranges;
        }

        foreach (self::MANUAL_OVERRIDES[$type] ?? [] as $field => $override) {
            if (isset($ranges[$field])) {
                $ranges[$field] = array_replace($ranges[$field], $override);
            }
        }

        return $ranges;
    }

    /**
     * Every type's bounds for one mode — a serialisable shape for handing the
     * same limits to the client.
     *
     * @return array<string, array<string, array{min: int|float, max: int|float, label: string, unit: string}>>
     */
    public static function all(string $mode): array
    {
        $ranges = [];

        foreach (self::TYPES as $type) {
            $ranges[$type] = self::for($mode, $type);
        }

        return $ranges;
    }

    /**
     * Field-keyed messages for each value outside its plausible range.
     *
     * Non-numeric input yields nothing — the caller's own `numeric` rules
     * already report that, and repeating it here would show two errors for
     * one mistake.
     *
     * @return array<string, string>
     */
    public static function violations(string $mode, string $type, mixed $value, mixed $secondaryValue = null): array
    {
        $candidates = ['value' => $value, 'secondary_value' => $secondaryValue];
        $violations = [];

        foreach (self::for($mode, $type) as $field => $range) {
            $candidate = $candidates[$field] ?? null;

            if ($candidate === null || $candidate === '' || ! is_numeric($candidate)) {
                continue;
            }

            $number = (float) $candidate;

            if ($number < $range['min'] || $number > $range['max']) {
                $violations[$field] = sprintf(
                    '%s must be between %s and %s %s.',
                    $range['label'],
                    self::formatBound($range['min']),
                    self::formatBound($range['max']),
                    $range['unit'],
                );
            }
        }

        return $violations;
    }

    private static function formatBound(int|float $bound): string
    {
        return rtrim(rtrim(number_format($bound, 1, '.', ''), '0'), '.');
    }
}
