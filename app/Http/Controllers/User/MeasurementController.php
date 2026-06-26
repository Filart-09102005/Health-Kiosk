<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Measurement\StoreMeasurementRequest;
use App\Http\Resources\HealthRecordResource;
use App\Services\Health\KioskSessionService;
use App\Services\Health\MeasurementService;
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

        $sessions->activity($session, "opened_{$request->validated('type')}", 'Measurement flow opened.');
        $record = $measurements->save($session, $request->validated());

        return response()->json([
            'message' => 'Measurement saved successfully.',
            'record' => new HealthRecordResource($record->load(['user', 'kioskSession'])),
        ], 201);
    }

    public function summary(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $session = $sessions->activeFor($request->user());

        if (! $session) {
            return response()->json(['record' => null, 'session' => null]);
        }

        $session->load(['healthRecord.user', 'healthRecord.kioskSession', 'activities' => fn ($query) => $query->latest()->limit(20)]);

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
