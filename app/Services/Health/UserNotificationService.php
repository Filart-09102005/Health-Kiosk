<?php

namespace App\Services\Health;

use App\Models\HealthRecord;
use App\Models\UserNotification;
use App\Support\AdminSettings;
use Illuminate\Support\Collection;

/**
 * Turns a saved health record into the notifications its owner sees.
 *
 * The wording and the trigger points mirror what the browser used to derive on
 * the fly, so nothing a student was already being told has changed — what
 * changed is that the result is written down. A notification therefore outlives
 * the page that produced it, the kiosk session, and signing out.
 *
 * Bands come from AdminSettings, so an administrator widening a range both
 * stops new notifications firing and rewrites the range quoted in the ones
 * that remain, the next time the reading is saved.
 */
class UserNotificationService
{
    /**
     * Bring the stored notifications for one record in line with its readings.
     *
     * Runs on every save, so it also has to take notifications away: a student
     * who re-measures a fever and comes back normal should not keep the old
     * fever notice for that record.
     */
    public function syncForRecord(HealthRecord $record): void
    {
        $expected = $this->describe($record);

        $existing = UserNotification::query()
            ->where('user_id', $record->user_id)
            ->where('health_record_id', $record->id)
            ->get()
            ->keyBy('key');

        foreach ($expected as $key => $payload) {
            $current = $existing->get($key);

            if (! $current) {
                UserNotification::create([
                    'user_id' => $record->user_id,
                    'health_record_id' => $record->id,
                    'kiosk_session_id' => $record->kiosk_session_id,
                    'key' => $key,
                    ...$payload,
                ]);

                continue;
            }

            // A changed message means a new reading behind the same heading, so
            // it goes back to unread — the student has not been told this yet.
            $isNew = $current->message !== $payload['message'];

            $current->fill($payload);
            if ($isNew) {
                $current->read_at = null;
            }
            $current->save();
        }

        $stale = $existing->keys()->diff(array_keys($expected));
        if ($stale->isNotEmpty()) {
            UserNotification::query()
                ->where('user_id', $record->user_id)
                ->where('health_record_id', $record->id)
                ->whereIn('key', $stale->all())
                ->delete();
        }
    }

    /** The notifications a record should currently have, keyed by notification key. */
    private function describe(HealthRecord $record): array
    {
        $settings = AdminSettings::all();
        $out = [];

        $hr = $this->number($record->heart_rate);
        if ($hr !== null) {
            $cfg = $settings['heartRate'];
            $band = $this->band($cfg['normalLow'], $cfg['normalHigh'], ' bpm');
            $severity = ($hr < $cfg['alertLow'] || $hr > $cfg['alertHigh']) ? 'alert' : 'watch';

            if ($hr < $cfg['normalLow']) {
                $out['hr-low'] = [
                    'type' => 'heart_rate',
                    'severity' => $severity,
                    'title' => 'Low Heart Rate',
                    'message' => 'Your heart rate is '.$this->plain($hr).' bpm, which is below the normal resting range ('.$band.').',
                ];
            } elseif ($hr > $cfg['normalHigh']) {
                $out['hr-high'] = [
                    'type' => 'heart_rate',
                    'severity' => $severity,
                    'title' => 'High Heart Rate',
                    'message' => 'Your heart rate is '.$this->plain($hr).' bpm, which is above the normal resting range ('.$band.').',
                ];
            }
        }

        $spo2 = $this->number($record->spo2);
        if ($spo2 !== null && $spo2 < $settings['spo2']['normalLow']) {
            $cfg = $settings['spo2'];
            $out['spo2-low'] = [
                'type' => 'spo2',
                'severity' => $spo2 < $cfg['alertLow'] ? 'alert' : 'watch',
                'title' => 'Low Oxygen Saturation',
                'message' => 'Your SpO2 is '.$this->plain($spo2).'%, which is below the normal level ('.$this->plain($cfg['normalLow']).'-100%).',
            ];
        }

        $temp = $this->number($record->temperature);
        if ($temp !== null) {
            $cfg = $settings['temperature'];
            $band = $this->band($cfg['normalLow'], $cfg['normalHigh'], '°C');
            $severity = ($temp < $cfg['alertLow'] || $temp > $cfg['alertHigh']) ? 'alert' : 'watch';
            $reading = number_format($temp, 1);

            if ($temp < $cfg['normalLow']) {
                $out['temp-low'] = [
                    'type' => 'temperature',
                    'severity' => $severity,
                    'title' => 'Low Body Temperature',
                    'message' => 'Your temperature is '.$reading.'°C, which is below the normal range ('.$band.').',
                ];
            } elseif ($temp > $cfg['normalHigh']) {
                $out['temp-high'] = [
                    'type' => 'temperature',
                    'severity' => $severity,
                    'title' => 'High Body Temperature',
                    'message' => 'Your temperature is '.$reading.'°C, which is above the normal range ('.$band.') and may indicate a fever.',
                ];
            }
        }

        $bmi = $this->number($record->bmi);
        if ($bmi !== null) {
            $cfg = $settings['bmi'];
            $reading = number_format($bmi, 1);

            if ($bmi <= $cfg['underweightMax']) {
                $out['bmi-under'] = [
                    'type' => 'bmi',
                    'severity' => 'watch',
                    'title' => 'BMI: Underweight',
                    'message' => 'Your BMI is '.$reading.', which is considered underweight (at or below '.$this->plain($cfg['underweightMax']).').',
                ];
            } elseif ($bmi > $cfg['normalMax']) {
                $out['bmi-over'] = [
                    'type' => 'bmi',
                    'severity' => 'watch',
                    'title' => 'BMI: Overweight/Obese',
                    'message' => 'Your BMI is '.$reading.', which is outside the healthy range ('.$this->plain($cfg['underweightMax']).' - '.$this->plain($cfg['normalMax']).').',
                ];
            }
        }

        return $out;
    }

    private function number(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }

    /** "35-37.2", never "35.0-37.20". */
    private function band(mixed $low, mixed $high, string $unit): string
    {
        return $this->plain($low).'-'.$this->plain($high).$unit;
    }

    /** Trims trailing zeros so a band reads "35", not "35.00". */
    private function plain(mixed $value): string
    {
        $formatted = number_format((float) $value, 2, '.', '');

        return str_contains($formatted, '.')
            ? rtrim(rtrim($formatted, '0'), '.')
            : $formatted;
    }

    /** The list a user sees, newest first. */
    public function listFor(int $userId, int $limit = 100): Collection
    {
        return UserNotification::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function unreadCount(int $userId): int
    {
        return UserNotification::query()->where('user_id', $userId)->unread()->count();
    }
}
