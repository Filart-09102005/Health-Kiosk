<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Measurement\StoreMeasurementRequest;
use App\Http\Resources\HealthRecordResource;
use App\Services\Health\KioskSessionService;
use App\Services\Health\MeasurementService;
use App\Models\SessionMeasurement;
use App\Support\MeasurementRanges;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MeasurementController extends Controller
{
    public function store(
        StoreMeasurementRequest $request,
        KioskSessionService $sessions,
        MeasurementService $measurements,
    ): JsonResponse {
        $session = $sessions->activeFor($request->user());

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['No active kiosk session was found. Please log in again.'],
            ]);
        }

        $data = $request->validated();

        $sessions->activity($session, "opened_{$data['type']}", 'Measurement flow opened.');
        $record = $measurements->save($session, $data);

        // Manual entries are already hard-blocked when out of range by
        // StoreMeasurementRequest, so anything implausible reaching here came
        // from a sensor. Report it without refusing the save — calibration is
        // still in progress and a rejected save would dead-end the flow.
        $warnings = ($data['input_source'] ?? 'smart') === 'smart'
            ? array_values(MeasurementRanges::violations(
                'smart',
                $data['type'],
                $data['value'],
                $data['secondary_value'] ?? null,
            ))
            : [];

        return response()->json([
            'message' => 'Measurement saved successfully.',
            'warnings' => $warnings,
            'record' => new HealthRecordResource($record->load(['user', 'kioskSession'])),
        ], 201);
    }

    public function skip(Request $request, KioskSessionService $sessions, MeasurementService $measurements): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:heart_rate,temperature,height,weight']
        ]);

        $session = $sessions->activeFor($request->user());

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['No active kiosk session was found. Please log in again.'],
            ]);
        }

        SessionMeasurement::create([
            'kiosk_session_id' => $session->id,
            'user_id' => $session->user_id,
            'type' => $data['type'],
            'status' => 'skipped',
        ]);

        $sessions->activity($session, "skipped_{$data['type']}", 'Measurement skipped.');
        
        $record = $measurements->syncHealthRecord($session);

        return response()->json([
            'message' => 'Measurement skipped.',
            'record' => new HealthRecordResource($record->load(['user', 'kioskSession'])),
        ]);
    }

    public function summary(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $session = $sessions->activeFor($request->user());

        if (! $session) {
            return response()->json(['record' => null, 'session' => null]);
        }

        $session->load(['user', 'healthRecord.user', 'healthRecord.kioskSession', 'activities' => fn ($query) => $query->latest()->limit(20)]);

        return response()->json([
            'session' => new \App\Http\Resources\KioskSessionResource($session),
            'record' => $session->healthRecord ? new HealthRecordResource($session->healthRecord) : null,
        ]);
    }

    public function records(Request $request)
    {
        $records = $request->user()
            ->healthRecords()
            ->with(['user', 'kioskSession'])
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 50));

        return HealthRecordResource::collection($records);
    }
}
