<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Single-kiosk assumption: live-vitals and command state each live in one
 * shared file (STORAGE_PATH / COMMAND_PATH below), not scoped per kiosk or
 * per session. That is deliberate and safe for the current one-kiosk
 * deployment this system is built for - the Python serial bridge on that one
 * machine is the only writer of sensor data, and the browser polling it is
 * always looking at "the kiosk", singular.
 *
 * It is NOT safe to point a second physical kiosk at this same backend: both
 * would read and overwrite each other's live readings and commands through
 * this same pair of files. If the school ever adds a second kiosk, this
 * needs a per-kiosk key (e.g. a kiosk id in the storage path) before that
 * can work - out of scope for now, noted here so it isn't missed later.
 */
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
            'sensor' => $fresh ? $payload['sensor'] ?? null : null,
            'machine_state' => $fresh ? $payload['machine_state'] ?? 'IDLE' : 'IDLE',
            'session_id' => $fresh ? $payload['session_id'] ?? null : null,
            'live_data' => $fresh ? $payload['live_data'] ?? null : null,
            'final_result' => $fresh ? $payload['final_result'] ?? null : null,
            'error' => $fresh ? $payload['error'] ?? null : null,

            // Link health, for the admin Devices view. Reported even when the
            // payload is stale — "we last heard from the kiosk at X" is the
            // whole point of that screen, and nulling it would hide the fact
            // that the firmware has gone quiet.
            'fresh' => $fresh,
            'updated_at' => $payload['updated_at'] ?? null,
            'stale_after_seconds' => self::STALE_AFTER_SECONDS,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sensor' => ['nullable', 'string', 'max:40'],
            'machine_state' => ['nullable', 'string', 'max:40'],
            'live_data' => ['nullable', 'array'],
            'live_data.primary' => ['nullable', 'numeric'],
            'live_data.secondary' => ['nullable', 'numeric'],
            'live_data.debug_ir' => ['nullable', 'numeric'],
            'final_result' => ['nullable', 'array'],
            'final_result.primary' => ['nullable', 'numeric'],
            'final_result.secondary' => ['nullable', 'numeric'],
            'error' => ['nullable'],
            'session_id' => ['nullable', 'string', 'max:255'],
            'reset' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('reset')) {
            $payload = [
                'sensor' => null,
                'machine_state' => $validated['machine_state'] ?? 'IDLE',
                'session_id' => null,
                'live_data' => null,
                'final_result' => null,
                'error' => null,
                'updated_at' => now()->toISOString(),
            ];
            Storage::disk('local')->put(self::STORAGE_PATH, json_encode($payload, JSON_PRETTY_PRINT));
            return $this->noStoreResponse($payload, 201);
        }

        $current = Storage::disk('local')->exists(self::STORAGE_PATH)
            ? json_decode(Storage::disk('local')->get(self::STORAGE_PATH), true) ?: []
            : [];

        if (! $this->isFresh($current['updated_at'] ?? null)) {
            $current = [];
        }

        $platformOffset = (float) \App\Support\AdminSettings::all()['platformOffsetCm'];

        // Apply platform offset to HEIGHT sensor primary value
        $liveData = $validated['live_data'] ?? ($current['live_data'] ?? null);
        $finalResult = $validated['final_result'] ?? ($current['final_result'] ?? null);
        
        $sensor = $validated['sensor'] ?? ($current['sensor'] ?? null);
        
        if ($sensor === 'HEIGHT') {
            if (isset($liveData['primary']) && is_numeric($liveData['primary'])) {
                $liveData['primary'] = round((float) $liveData['primary'] - $platformOffset, 2);
            }
            if (isset($finalResult['primary']) && is_numeric($finalResult['primary'])) {
                $finalResult['primary'] = round((float) $finalResult['primary'] - $platformOffset, 2);
            }
        }

        $payload = [
            'sensor' => $sensor,
            'machine_state' => $validated['machine_state'] ?? ($current['machine_state'] ?? 'IDLE'),
            'session_id' => $validated['session_id'] ?? ($current['session_id'] ?? null),
            'live_data' => $liveData,
            'final_result' => $finalResult,
            'error' => $validated['error'] ?? ($current['error'] ?? null),
            'updated_at' => now()->toISOString(),
        ];

        Storage::disk('local')->put(self::STORAGE_PATH, json_encode($payload, JSON_PRETTY_PRINT));

        return $this->noStoreResponse([
            'sensor' => $payload['sensor'],
            'machine_state' => $payload['machine_state'],
            'session_id' => $payload['session_id'],
            'live_data' => $payload['live_data'],
            'final_result' => $payload['final_result'],
            'error' => $payload['error']
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
            'command' => ['required', 'string', 'in:START_HEART,START_OXIMETER,START_WEIGHT,START_HEIGHT,START_TEMPERATURE,START_ALL,STOP'],
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
