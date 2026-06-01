<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ThermalReceiptController extends Controller
{
    private const COLUMNS = 48;

    public function print(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable'],
            'school_name' => ['nullable', 'string', 'max:120'],
            'name' => ['nullable', 'string', 'max:120'],
            'user_name' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'max:40'],
            'user_role' => ['nullable', 'string', 'max:40'],
            'school_id' => ['nullable', 'string', 'max:80'],
            'schoolId' => ['nullable', 'string', 'max:80'],
            'barcode' => ['nullable', 'string', 'max:80'],
            'date' => ['nullable', 'string', 'max:80'],
            'heart_rate' => ['nullable'],
            'spo2' => ['nullable'],
            'temperature' => ['nullable'],
            'height' => ['nullable'],
            'weight' => ['nullable'],
            'bmi' => ['nullable'],
            'status' => ['nullable', 'string', 'max:80'],
            'advice' => ['nullable', 'string', 'max:500'],
        ]);

        $payload = $this->buildReceipt($data);
        $printed = $this->sendRawToPrinter($payload);

        if (! $printed) {
            return response()->json([
                'message' => 'Thermal printer failed. Share your printer as THERMAL80 in Windows printer settings, then try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'Receipt printed successfully.',
        ]);
    }

    private function buildReceipt(array $record): string
    {
        $schoolName = $record['school_name']
            ?? config('services.thermal_printer.school_name')
            ?? config('app.name', 'School Health Kiosk');

        $rows = [
            ['Date/Time', $record['date'] ?? now()->format('Y-m-d h:i A')],
            ['School ID', $record['school_id'] ?? $record['schoolId'] ?? $record['barcode'] ?? '--'],
            ['Heart Rate', $this->withUnit($record['heart_rate'] ?? null, 'bpm')],
            ['SpO2', $this->withUnit($record['spo2'] ?? null, '%')],
            ['Body Temp', $this->withUnit($record['temperature'] ?? null, 'C')],
            ['Height', $this->withUnit($record['height'] ?? null, 'cm')],
            ['Weight', $this->withUnit($record['weight'] ?? null, 'kg')],
            ['BMI', $record['bmi'] ?? '--'],
            ['Status', $record['status'] ?? '--'],
        ];

        $advice = $record['advice'] ?? 'Please consult the clinic staff if you feel unwell.';

        $receipt = [
            "\x1B\x40",
            "\x1B\x74\x00",
            "\x1B\x61\x01",
            "\x1B\x45\x01",
            "\x1B\x21\x38",
            $this->clean(strtoupper($schoolName))."\n",
            "\x1B\x21\x00",
            "\x1B\x45\x00",
            $this->center('Health Check Summary')."\n",
            $this->line('=')."\n",
            "\x1B\x61\x00",
        ];

        foreach ($rows as [$label, $value]) {
            $receipt[] = $this->row($label, (string) $value)."\n";
        }

        $receipt[] = $this->line('-')."\n";
        $receipt[] = "\x1B\x45\x01"."ADVICE / REMINDER\n"."\x1B\x45\x00";

        foreach ($this->wrap($advice) as $line) {
            $receipt[] = $line."\n";
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
