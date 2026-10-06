<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\Health\HealthEvaluationService;

class HealthRecordResource extends JsonResource
{
    private const MEASUREMENT_KEYS = ['heart_rate', 'spo2', 'temperature', 'height', 'weight', 'bmi'];

    public function toArray(Request $request): array
    {
        $missingMeasurements = collect(self::MEASUREMENT_KEYS)
            ->filter(fn (string $key) => $this->{$key} === null || $this->{$key} === '')
            ->values()
            ->all();

        $completedMeasurements = count(self::MEASUREMENT_KEYS) - count($missingMeasurements);

        $evaluator = app(HealthEvaluationService::class);
        $latest = [
            'temperature' => $this->temperature,
            'heart_rate' => $this->heart_rate,
            'spo2' => $this->spo2,
            'height' => $this->height,
            'weight' => $this->weight,
        ];
        
        $summary = $evaluator->summarize($latest);

        return [
            'id' => $this->id,
            'session_id' => $this->kiosk_session_id,
            'heart_rate' => $this->heart_rate,
            'spo2' => $this->spo2,
            'temperature' => $this->temperature,
            'height' => $this->height,
            'weight' => $this->weight,
            'bmi' => $this->bmi,
            // Graded live from $summary rather than read back from the stored
            // columns, so an admin's threshold change applies to existing
            // records immediately. The stored columns stay as the snapshot of
            // what was in force when the reading was taken, and the alerts
            // raised back then are left alone.
            'bmi_category' => $summary['bmi_category'] ?? $this->bmi_category,
            'health_status' => $summary['health_status'] ?? $this->health_status,
            'measurement_statuses' => $summary['measurement_statuses'] ?? [],
            'missing_measurements' => $missingMeasurements,
            'skipped_measurements' => $this->skipped_measurements ?? [],
            'measurement_summary' => [
                'completed' => $completedMeasurements,
                'total' => count(self::MEASUREMENT_KEYS),
                'missing' => $missingMeasurements,
                'skipped' => $this->skipped_measurements ?? [],
            ],
            'advice' => $summary['advice'] ?? $this->advice,
            // Snapshot taken when the record was saved. Null on records created
            // before the column existed — the client falls back to the account.
            'academic_level' => $this->academic_level,
            'school_year' => $this->school_year,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'firstname' => $this->user->firstname,
                'lastname' => $this->user->lastname,
                'name' => $this->user->full_name,
                'email' => $this->user->email,
                'barcode' => $this->user->barcode,
                'role' => $this->user->role,
                'department' => $this->user->department,
                // Without these the client had no real academic level to show
                // and fell back to inventing one from the record's date.
                'grade_level' => $this->user->grade_level,
                'strand' => $this->user->strand,
                'year_level' => $this->user->year_level,
                'program' => $this->user->program,
            ]),
            'session' => $this->whenLoaded('kioskSession', fn () => [
                'session_number' => $this->kioskSession->session_number,
                'status' => $this->kioskSession->status,
                'started_at' => $this->kioskSession->started_at,
            ]),
        ];
    }
}
