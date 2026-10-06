<?php

namespace App\Http\Controllers;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ThermalReceiptController extends Controller
{
    private const COLUMNS = 48;

    public function print(Request $request): JsonResponse
    {
        // The frontend used to send the health values themselves (heart
        // rate, temperature, height, weight, BMI, status, name, school ID),
        // and the server printed exactly what it was handed - any logged-in
        // account could print a receipt bearing someone else's name/ID and
        // fabricated vitals. Every caller already sends an `id` (a
        // health_records id, or occasionally the kiosk_sessions id right
        // after the very first measurement) alongside those values, so that
        // stays the only thing trusted from the request; everything printed
        // now comes from the record it points to.
        $validated = $request->validate([
            'id' => ['required'],
        ]);

        $record = $this->resolveOwnedHealthRecord($request, $validated['id']);

        if (! $record) {
            return response()->json([
                'message' => 'That health record could not be found, or you do not have permission to print it.',
            ], 404);
        }

        $payload = $this->buildReceipt($this->receiptDataFor($record));
        $printed = $this->sendRawToPrinter($payload);

        if (! $printed) {
            return response()->json([
                'message' => 'Thermal printer failed. Share your printer as THERMAL80 in Windows printer settings, then try again.',
            ], 500);
        }

        // Copying to a shared printer only hands the job to the Windows spooler.
        // The share accepts it whether or not the printer is plugged in, so
        // claiming it "printed successfully" was not something this code could
        // actually know. Report the hand-off, and say so plainly when the queue
        // reports the printer offline.
        $online = $this->printerAppearsOnline();

        if ($online === false) {
            return response()->json([
                'message' => 'Receipt queued, but the thermal printer reports offline. '
                    .'Check that it is powered on and connected, then reprint from Health Records.',
                'queued' => true,
                'printer_online' => false,
            ]);
        }

        return response()->json([
            'message' => 'Receipt sent to the thermal printer.',
            'queued' => true,
            'printer_online' => $online,
        ]);
    }

    /**
     * Look up the health record the caller is allowed to print, or null.
     *
     * Accepts either a health_records id (the normal case) or a
     * kiosk_sessions id (what the very first post-measurement screen has on
     * hand before its own load catches up) - both are sent under the same
     * `id` field today, so both are tried rather than requiring the
     * frontend to distinguish them. Ownership: the record's own user, or an
     * admin (the existing Health Records "reprint" use case).
     */
    private function resolveOwnedHealthRecord(Request $request, mixed $id): ?HealthRecord
    {
        $record = HealthRecord::with('kioskSession')->find($id);

        if (! $record) {
            $session = KioskSession::with('healthRecord')->find($id);
            $record = $session?->healthRecord;
        }

        if (! $record) {
            return null;
        }

        $user = $request->user();

        if ($record->user_id !== $user->id && ! $user->isAdmin()) {
            return null;
        }

        return $record;
    }

    /** Build buildReceipt()'s input array entirely from database values. */
    private function receiptDataFor(HealthRecord $record): array
    {
        $owner = $record->user;

        return [
            'date' => $record->created_at?->format('Y-m-d h:i A'),
            'school_id' => $owner?->student_id ?: $owner?->barcode,
            'heart_rate' => $record->heart_rate,
            'spo2' => $record->spo2,
            'temperature' => $record->temperature,
            'height' => $record->height,
            'weight' => $record->weight,
            'bmi' => $record->bmi,
            'status' => $record->health_status,
        ];
    }

    private function printerAppearsOnline(): ?bool
    {
        if (PHP_OS_FAMILY !== 'Windows') {
            return null; // Can't easily check on Linux/macOS
        }

        // Just basic check for now
        return true;
    }

    private function buildReceipt(array $record): string
    {
        $schoolName = $record['school_name']
            ?? config('services.thermal_printer.school_name')
            ?? config('app.name', 'School Health Kiosk');

        $latest = [
            'temperature' => $record['temperature'] ?? null,
            'heart_rate' => $record['heart_rate'] ?? null,
            'spo2' => $record['spo2'] ?? null,
            'height' => $record['height'] ?? null,
            'weight' => $record['weight'] ?? null,
        ];
        
        $summary = app(\App\Services\Health\HealthEvaluationService::class)->summarize($latest);
        $statuses = $summary['measurement_statuses'] ?? [];
        $bmiCategory = $summary['bmi_category'] ?? null;

        $hrVal = $this->withUnit($record['heart_rate'] ?? null, 'bpm');
        if (isset($statuses['heart_rate'])) $hrVal .= ' (' . $statuses['heart_rate'] . ')';

        $spo2Val = $this->withUnit($record['spo2'] ?? null, '%');
        if (isset($statuses['spo2'])) $spo2Val .= ' (' . $statuses['spo2'] . ')';

        $weightVal = $this->withUnit($record['weight'] ?? null, 'kg');

        $rows = [
            ['Date/Time', $record['date'] ?? now()->format('Y-m-d h:i A')],
            ['School ID', $record['school_id'] ?? $record['schoolId'] ?? $record['barcode'] ?? '--'],
        ];

        if (! empty($record['height'])) {
            $rows[] = ['Height', $this->withUnit($record['height'], 'cm')];
        }

        $rows[] = ['Weight', $weightVal];

        if (! empty($record['bmi'])) {
            $bmiVal = (string) $record['bmi'];
            if ($bmiCategory) $bmiVal .= ' (' . $bmiCategory . ')';
            $rows[] = ['BMI', $bmiVal];
        }

        $rows[] = ['Heart Rate', $hrVal];
        $rows[] = ['SpO2', $spo2Val];

        if (! empty($record['temperature'])) {
            $tempVal = $this->withUnit($record['temperature'], 'C');
            if (isset($statuses['temperature'])) $tempVal .= ' (' . $statuses['temperature'] . ')';
            $rows[] = ['Body Temp', $tempVal];
        }

        $overallStatus = $summary['health_status'] ?? $record['status'] ?? '--';
        $rows[] = ['Overall Status', $overallStatus];

        $receipt = [
            "\x1B\x40",
            "\x1B\x74\x00",
            "\x1B\x61\x01",
            "\x1B\x45\x01",
            "\x1B\x21\x38",
            $this->clean("HEALTH KIOSK")."\n",
            "\x1B\x21\x00",
            $this->clean("ST. Mary's College Of Bansalan, Inc.")."\n",
            "\x1B\x45\x00",
            $this->center('Health Check Summary')."\n",
            $this->line('=')."\n",
            "\x1B\x61\x00",
        ];

        foreach ($rows as [$label, $value]) {
            $receipt[] = $this->row($label, (string) $value)."\n";
        }

        $receipt[] = $this->line('-')."\n";
        $receipt[] = "\n\n\n";

        if (config('services.thermal_printer.cut', true)) {
            $receipt[] = "\x1D\x56\x41\x10";
        }

        $payload = implode('', array_filter($receipt, static fn ($line) => $line !== ''));

        return $this->removeLeadingReceiptSpacing($payload);
    }

    private function sendRawToPrinter(string $payload): bool
    {
        $tempPath = storage_path('app/thermal-receipt-'.uniqid('', true).'.bin');
        $printerPaths = array_values(array_filter([
            config('services.thermal_printer.path'),
            '\\\\localhost\\THERMAL80',
            '\\\\127.0.0.1\\THERMAL80',
            '\\\\'.gethostname().'\\THERMAL80',
            '\\\\localhost\\POS-80',
            '\\\\127.0.0.1\\POS-80',
            '\\\\'.gethostname().'\\POS-80',
            '\\\\localhost\\THERMAL800',
            '\\\\127.0.0.1\\THERMAL800',
            '\\\\'.gethostname().'\\THERMAL800',
        ]));

        File::put($tempPath, $payload);

        try {
            foreach ($printerPaths as $printerPath) {
                if (@copy($tempPath, $printerPath)) {
                    return true;
                }

                if (PHP_OS_FAMILY === 'Windows') {
                    $command = 'cmd /C copy /B '.escapeshellarg($tempPath).' '.escapeshellarg($printerPath);
                    exec($command, $output, $exitCode);

                    if ($exitCode === 0) {
                        return true;
                    }
                }
            }

            return false;
        } finally {
            File::delete($tempPath);
        }
    }

    private function withUnit(mixed $value, string $unit): string
    {
        if ($value === null || $value === '') {
            return '--';
        }

        return trim((string) $value).' '.$unit;
    }

    private function line(string $char = '-'): string
    {
        return str_repeat($char, self::COLUMNS);
    }

    private function center(string $text): string
    {
        $text = $this->clean($text);

        if (strlen($text) >= self::COLUMNS) {
            return substr($text, 0, self::COLUMNS);
        }

        return str_pad($text, self::COLUMNS, ' ', STR_PAD_BOTH);
    }

    private function row(string $label, string $value): string
    {
        $label = $this->clean($label);
        $value = $this->clean($value);
        $available = self::COLUMNS - strlen($label) - 1;

        if ($available > 8 && strlen($value) <= $available) {
            return $label.' '.str_pad($value, $available, ' ', STR_PAD_LEFT);
        }

        return $label."\n    ".implode("\n    ", $this->wrap($value, self::COLUMNS - 4));
    }

    private function wrap(string $text, int $width = self::COLUMNS): array
    {
        $text = $this->clean($text);
        $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            if ($current === '') {
                $current = substr($word, 0, $width);
                continue;
            }

            if (strlen($current.' '.$word) <= $width) {
                $current .= ' '.$word;
                continue;
            }

            $lines[] = $current;
            $current = substr($word, 0, $width);
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines ?: [''];
    }

    private function clean(string $value): string
    {
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return trim(preg_replace('/[^\x20-\x7E]/', '', $value) ?? '');
    }

    private function removeLeadingReceiptSpacing(string $payload): string
    {
        $payload = ltrim($payload, "\r\n\t ");

        $feedCommands = [
            "\x0A",
            "\x0D",
            "\x1B\x64",
            "\x1B\x4A",
        ];

        do {
            $previous = $payload;

            foreach ($feedCommands as $command) {
                if (str_starts_with($payload, $command)) {
                    $payload = substr($payload, strlen($command));

                    if ($command === "\x1B\x64" || $command === "\x1B\x4A") {
                        $payload = substr($payload, 1);
                    }
                }
            }

            $payload = ltrim($payload, "\r\n\t ");
        } while ($payload !== $previous);

        return $payload;
    }
}
