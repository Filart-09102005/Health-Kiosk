<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Canonical read/write for the admin threshold settings.
 *
 * Settings used to be stored per administrator (the `settings` table is unique
 * on user_id + key) while every consumer read them globally with
 * `Setting::where('key', 'admin_settings')->value('value')` — no user filter and
 * no ordering. With one admin that happened to work; with two it applied
 * whichever row the database returned first, and the settings screen showed the
 * signed-in admin's row rather than the one actually in force.
 *
 * Thresholds govern how everyone's readings are graded, so they are global by
 * nature: one row, stored with a null user_id. `updated_by` records which
 * administrator last changed them.
 */
class AdminSettings
{
    public const KEY = 'admin_settings';

    /**
     * Shipped defaults. Mirrored on the client in
     * resources/js/Pages/Admin/Settings/Settings.jsx — change both together.
     */
    public static function defaults(): array
    {
        return [
            // Temperature and heart rate are deliberately two-state: the alert
            // bounds sit on the normal bounds, leaving no gap for a Watch grade.
            // A reading is either acceptable or it is escalated.
            //   temp  <35 Alert | 35-37.2 Normal | >37.2 Alert
            //   hr    <60 Alert (bradycardia) | 60-100 Normal | >100 Alert (tachycardia)
            //   spo2  <91 Alert (severe hypoxia) | 91-94 Watch (mild) | >=95 Normal
            'temperature' => ['alertLow' => 35, 'normalLow' => 35, 'normalHigh' => 37.2, 'alertHigh' => 37.2],
            'heartRate' => ['alertLow' => 60, 'normalLow' => 60, 'normalHigh' => 100, 'alertHigh' => 100],
            'spo2' => ['alertLow' => 91, 'normalLow' => 95],
            'bmi' => ['underweightMax' => 18.4, 'normalMax' => 24.9, 'overweightMax' => 29.9],
            'alertsEnabled' => true,
            'alertSensitivity' => 'Standard',
            'platformOffsetCm' => 2.0,
            // The on-screen keyboard that pops up on focus. Split in two
            // because the admin side (a back-office desk, usually a real
            // keyboard) and the user/kiosk side (the touchscreen station,
            // login/register/measurements) are physically different
            // machines with different needs - one can be off while the
            // other stays on.
            'kioskKeyboardEnabledAdmin' => true,
            'kioskKeyboardEnabledUser' => true,
        ];
    }

    /**
     * The settings in force, with saved values merged over the defaults.
     *
     * The merge matters: a payload that omits a group (or an older row saved
     * before a group existed) previously left the consumer indexing a missing
     * key, so a half-saved settings row could break grading outright.
     */
    public static function all(): array
    {
        $saved = Setting::query()
            ->where('key', self::KEY)
            ->orderByRaw('user_id IS NOT NULL')
            ->orderByDesc('updated_at')
            ->value('value');

        return self::normalize(self::merge(self::defaults(), is_array($saved) ? $saved : []));
    }

    /** One threshold group, guaranteed complete. */
    public static function group(string $name): array
    {
        return self::all()[$name] ?? self::defaults()[$name] ?? [];
    }

    /**
     * Persist a settings payload.
     *
     * The incoming array is pruned to the keys in defaults() before merging, so
     * unknown keys cannot accumulate in the row. Pruning here rather than
     * relying on the controller's validated() output matters: validated() drops
     * any key without an explicit rule, which would silently discard a setting
     * the moment someone adds a field to the screen without adding a rule.
     * Adding it to defaults() is now the only step required.
     *
     * The payload merges over the settings currently in force, not over the
     * defaults — so saving one group leaves the others as they are. Merging over
     * defaults meant a partial save quietly reset every key it did not mention.
     */
    public static function save(array $settings, ?int $updatedBy = null): array
    {
        // Pruned again after merging, not just on the way in: the base comes from
        // all(), which carries whatever the stored row holds. Without this, a key
        // retired from defaults() (as the kioskMaintenance* ones were) would be
        // copied forward on every save and never go away.
        $merged = self::prune(
            self::normalize(self::merge(self::all(), self::prune($settings, self::defaults()))),
            self::defaults(),
        );

        Setting::updateOrCreate(
            ['user_id' => null, 'key' => self::KEY],
            ['value' => $merged + ['updated_by' => $updatedBy]],
        );

        return $merged;
    }

    /** Drops anything the defaults do not declare, recursively. */
    private static function prune(array $settings, array $allowed): array
    {
        $pruned = [];

        foreach ($settings as $key => $value) {
            if (! array_key_exists($key, $allowed)) {
                continue;
            }

            $pruned[$key] = is_array($value) && is_array($allowed[$key])
                ? self::prune($value, $allowed[$key])
                : $value;
        }

        return $pruned;
    }

    /** Recursive so threshold groups merge key-by-key rather than wholesale. */
    private static function merge(array $defaults, array $saved): array
    {
        foreach ($saved as $key => $value) {
            $defaults[$key] = is_array($value) && is_array($defaults[$key] ?? null)
                ? self::merge($defaults[$key], $value)
                : $value;
        }

        return $defaults;
    }

    /**
     * Number inputs post their values as strings ("36.5"), and the settings row
     * already holds entries such as platformOffsetCm => "3". Casting once here
     * keeps every comparison downstream numeric.
     */
    private static function normalize(array $settings): array
    {
        foreach ($settings as $key => $value) {
            if (is_array($value)) {
                $settings[$key] = self::normalize($value);
            } elseif (is_string($value) && is_numeric($value)) {
                $settings[$key] = (float) $value;
            }
        }

        return $settings;
    }
}
