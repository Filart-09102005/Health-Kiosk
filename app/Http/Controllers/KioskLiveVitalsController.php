<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class KioskLiveVitalsController extends Controller
{
    private const STORAGE_PATH = 'kiosk/live-vitals.json';
    private const COMMAND_PATH = 'kiosk/live-command.json';
    private const STALE_AFTER_SECONDS = 75;

    public function show(): JsonResponse
    {
        $payload = Storage::disk('local')->exists(self::STORAGE_PATH)
            ? json_decode(Storage::disk('local')->get(self::STORAGE_PATH), true)
            : [];

        $fresh = $this->isFresh($payload['updated_at'] ?? null);

        return $this->noStoreResponse([
            'heart_rate' => $fresh ? $payload['heart_rate'] ?? null : null,
            'spo2' => $fresh ? $payload['spo2'] ?? null : null,
            'weight' => $fresh ? $payload['weight'] ?? null : null,
            'ready' => $fresh ? (bool) ($payload['ready'] ?? false) : false,
            'mode' => $fresh ? $payload['mode'] ?? 'IDLE' : 'IDLE',
            'status' => $fresh ? $payload['status'] ?? null : null,
            'debug_ir' => $fresh ? $payload['debug_ir'] ?? null : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'heart_rate' => ['nullable', 'numeric', 'min:0', 'max:260'],
            'spo2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'ready' => ['nullable', 'boolean'],
            'mode' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'max:80'],
            'debug_ir' => ['nullable', 'numeric', 'min:0'],
            'reset' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('reset')) {
            $payload = [
                'heart_rate' => null,
                'spo2' => null,
                'weight' => null,
                'ready' => false,
                'mode' => 'IDLE',
                'status' => null,
                'debug_ir' => null,
                'updated_at' => now()->toISOString(),
            ];

            Storage::disk('local')->put(self::STORAGE_PATH, json_encode($payload, JSON_PRETTY_PRINT));

            return $this->noStoreResponse([
                'heart_rate' => null,
                'spo2' => null,
                'weight' => null,
                'ready' => false,
                'mode' => 'IDLE',
                'status' => null,
                'debug_ir' => null,
            ], 201);
        }

        if (
            ! array_key_exists('heart_rate', $validated)
            && ! array_key_exists('spo2', $validated)
            && ! array_key_exists('weight', $validated)
            && ! array_key_exists('ready', $validated)
            && ! array_key_exists('mode', $validated)
            && ! array_key_exists('status', $validated)
            && ! array_key_exists('debug_ir', $validated)
        ) {
            return $this->noStoreResponse([
                'message' => 'At least one live vital value or status field is required.',
            ], 422);
        }

        $current = Storage::disk('local')->exists(self::STORAGE_PATH)
            ? json_decode(Storage::disk('local')->get(self::STORAGE_PATH), true) ?: []
            : [];

        if (! $this->isFresh($current['updated_at'] ?? null)) {
            $current = [];
        }

        $payload = [
            'heart_rate' => array_key_exists('heart_rate', $validated)
                ? ($validated['heart_rate'] === null ? null : round((float) $validated['heart_rate'], 0))
                : ($current['heart_rate'] ?? null),
            'spo2' => array_key_exists('spo2', $validated)
                ? ($validated['spo2'] === null ? null : round((float) $validated['spo2'], 0))
                : ($current['spo2'] ?? null),
            'weight' => array_key_exists('weight', $validated)
                ? ($validated['weight'] === null ? null : round((float) $validated['weight'], 2))
                : ($current['weight'] ?? null),
            'ready' => array_key_exists('ready', $validated)
                ? (bool) $validated['ready']
                : (bool) ($current['ready'] ?? false),
            'mode' => $validated['mode'] ?? ($current['mode'] ?? 'IDLE'),
            'status' => array_key_exists('status', $validated)
                ? $validated['status']
                : ($current['status'] ?? null),
            'debug_ir' => array_key_exists('debug_ir', $validated)
                ? round((float) $validated['debug_ir'], 0)
                : ($current['debug_ir'] ?? null),
            'updated_at' => now()->toISOString(),
        ];

        Storage::disk('local')->put(self::STORAGE_PATH, json_encode($payload, JSON_PRETTY_PRINT));

        return $this->noStoreResponse([
            'heart_rate' => $payload['heart_rate'],
            'spo2' => $payload['spo2'],
            'weight' => $payload['weight'],
            'ready' => $payload['ready'],
            'mode' => $payload['mode'],
            'status' => $payload['status'],
            'debug_ir' => $payload['debug_ir'],
        ], 201);
    }

    public function command(): JsonResponse
    {
        $payload = Storage::disk('local')->exists(self::COMMAND_PATH)
            ? json_decode(Storage::disk('local')->get(self::COMMAND_PATH), true)
            : [];

        return $this->noStoreResponse([
            'command' => $payload['command'] ?? null,
            'id' => $payload['id'] ?? null,
        ]);
    }

    public function setCommand(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'command' => ['required', 'string', 'in:START_OXIMETER,START_WEIGHT,STOP'],
        ]);

        $payload = [
            'command' => $validated['command'],
            'id' => now()->timestamp.microtime(true),
            'created_at' => now()->toISOString(),
        ];

        Storage::disk('local')->put(self::COMMAND_PATH, json_encode($payload, JSON_PRETTY_PRINT));

        return $this->noStoreResponse($payload, 201);
    }

    private function noStoreResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()
            ->json($payload, $status)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    private function isFresh(?string $timestamp): bool
    {
        if (! $timestamp) {
            return false;
        }

        return Carbon::parse($timestamp)->diffInSeconds(now()) <= self::STALE_AFTER_SECONDS;
    }
}
