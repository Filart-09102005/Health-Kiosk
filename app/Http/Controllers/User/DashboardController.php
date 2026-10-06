<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\Health\HealthEvaluationService;
use App\Services\Health\KioskSessionService;

class DashboardController extends Controller
{
    private const MEASUREMENT_KEYS = ['heart_rate', 'spo2', 'temperature', 'height', 'weight', 'bmi'];

    public function __invoke(Request $request, KioskSessionService $sessions, HealthEvaluationService $evaluator): JsonResponse
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

        // Same evaluation the measurement flow and HealthRecordResource run, so
        // a reading that shows as abnormal there cannot show as normal here.
        $summary = $record
            ? $evaluator->summarize([
                'temperature' => $record->temperature,
                'heart_rate' => $record->heart_rate,
                'spo2' => $record->spo2,
                'height' => $record->height,
                'weight' => $record->weight,
            ])
            : [];

        return response()->json([
            'user' => [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'full_name' => $user->full_name,
                'student_id' => $user->student_id,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'grade_level' => $user->grade_level,
                'strand' => $user->strand,
                'year_level' => $user->year_level,
                'program' => $user->program,
                'age' => $user->age,
                'gender' => $user->gender,
                'birthday' => $user->birthday?->format('Y-m-d'),
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
            'measurement_statuses' => $summary['measurement_statuses'] ?? [],
            // The bands in force. Notification wording is now composed
            // server-side, so nothing in the kiosk UI depends on these — they
            // stay on the payload for the companion app, which shows a reading
            // against its range.
            'thresholds' => collect(\App\Support\AdminSettings::all())
                ->only(['temperature', 'heartRate', 'spo2', 'bmi'])
                ->all(),
            'record_updated_at' => $record?->updated_at?->toISOString(),
            'health_status' => $summary['health_status'] ?? $record?->health_status ?? 'Incomplete',
            'missing_measurements' => $missingMeasurements,
        ]);
    }
}
