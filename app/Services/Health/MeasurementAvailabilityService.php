<?php

namespace App\Services\Health;

use App\Models\Setting;

/**
 * Single source of truth for which measurements may be taken with the hardware
 * sensors ("Smart Mode").
 *
 * Manual Mode is deliberately not stored: it is the fallback that keeps the
 * kiosk usable while a sensor is down, so there is no code path — and no API
 * payload — that can switch it off.
 */
class MeasurementAvailabilityService
{
    /**
     * Stored on the shared `settings` table under a global row (user_id null)
     * rather than per-admin: sensor availability is a property of the physical
     * kiosk, not of whoever happens to be signed in.
     */
    public const SETTING_KEY = 'measurement_availability';

    /**
     * Every measurement the kiosk can offer, in display order.
     *
     * This list is the registry the whole feature reads from — the admin panel,
     * the API contract and the user-side guard all derive from it. Adding a
     * future sensor (blood pressure, blood glucose, vision, ECG…) is one entry
     * here plus its measurement flow; none of the availability code changes.
     */
    public const MEASUREMENTS = [
        'heart_rate' => 'Heart Rate & SpO2',
        'temperature' => 'Temperature',
        'height' => 'Height',
        'weight' => 'Weight',
    ];

    /**
     * A sensor is usable unless an administrator has said otherwise, so a kiosk
     * that has never visited this screen behaves exactly as it does today.
     */
    public const DEFAULT_SMART_ENABLED = true;

    public static function types(): array
    {
        return array_keys(self::MEASUREMENTS);
    }

    public static function isKnownType(string $type): bool
    {
        return array_key_exists($type, self::MEASUREMENTS);
    }

    /**
     * @return array<string, array{label: string, smart_enabled: bool, manual_enabled: bool}>
     */
    public function all(): array
    {
        $stored = $this->storedFlags();
        $availability = [];

        foreach (self::MEASUREMENTS as $type => $label) {
            $availability[$type] = [
                'label' => $label,
                'smart_enabled' => $stored[$type] ?? self::DEFAULT_SMART_ENABLED,
                // Never read from storage — Manual is the fallback and is
                // always on. Sent explicitly so clients can render it without
                // hard-coding the rule.
                'manual_enabled' => true,
            ];
        }

        return $availability;
    }

    public function isSmartEnabled(string $type): bool
    {
        if (! self::isKnownType($type)) {
            return false;
        }

        return $this->storedFlags()[$type] ?? self::DEFAULT_SMART_ENABLED;
    }

    /**
     * Merge a partial update into the stored flags.
     *
     * Partial on purpose: the admin panel toggles one sensor at a time, and a
     * merge means two admins editing different sensors cannot clobber each
     * other's change.
     *
     * @param  array<string, array{smart_enabled?: bool}|bool>  $input
     */
    public function update(array $input): array
    {
        $flags = $this->storedFlags();

        foreach ($input as $type => $value) {
            if (! self::isKnownType($type)) {
                continue;
            }

            $flags[$type] = (bool) (is_array($value) ? ($value['smart_enabled'] ?? self::DEFAULT_SMART_ENABLED) : $value);
        }

        // Keys that are no longer part of the registry would otherwise linger
        // in the JSON column forever after a measurement is retired.
        $flags = array_intersect_key($flags, self::MEASUREMENTS);

        Setting::updateOrCreate(
            ['user_id' => null, 'key' => self::SETTING_KEY],
            ['value' => $flags]
        );

        return $this->all();
    }

    /**
     * @return array<string, bool>
     */
    protected function storedFlags(): array
    {
        $value = Setting::query()
            ->whereNull('user_id')
            ->where('key', self::SETTING_KEY)
            ->value('value');

        if (! is_array($value)) {
            return [];
        }

        $flags = [];

        foreach ($value as $type => $enabled) {
            if (self::isKnownType((string) $type)) {
                $flags[$type] = (bool) $enabled;
            }
        }

        return $flags;
    }
}
