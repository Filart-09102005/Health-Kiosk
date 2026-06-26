<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\Health\KioskSessionService;

class DashboardController extends Controller
{
    private const MEASUREMENT_KEYS = ['heart_rate', 'spo2', 'temperature', 'height', 'weight', 'bmi'];

    public function __invoke(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $user = $request->user();
        $session = $sessions->activeFor($user);
        $record = $session?->healthRecord;

        $missingMeasurements = $record
            ? collect(self::MEASUREMENT_KEYS)
                ->filter(fn (string $key) => $record->{$key} === null || $record->{$key} === '')
                ->values()
                ->all()
            : self::MEASUREMENT_KEYS;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'barcode' => $user->barcode,
            ],
            'session' => $session ? [
                'id' => $session->id,
                'session_number' => $session->session_number,
                'status' => $session->status,
                'started_at' => $session->started_at,
            ] : null,
            'metrics' => [
                'heart_rate' => $record?->heart_rate,
                'spo2' => $record?->spo2,
                'temperature' => $record?->temperature,
                'height' => $record?->height,
                'weight' => $record?->weight,
                'bmi' => $record?->bmi,
            ],
            'health_status' => $record?->health_status ?? 'Incomplete',
            'missing_measurements' => $missingMeasurements,
        ]);
    }
}
