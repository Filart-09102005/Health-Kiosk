<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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

        return [
            'id' => $this->id,
            'session_id' => $this->kiosk_session_id,
            'heart_rate' => $this->heart_rate,
            'spo2' => $this->spo2,
            'temperature' => $this->temperature,
            'height' => $this->height,
            'weight' => $this->weight,
            'bmi' => $this->bmi,
            'bmi_category' => $this->bmi_category,
            'health_status' => $this->health_status,
            'missing_measurements' => $missingMeasurements,
            'measurement_summary' => [
                'completed' => $completedMeasurements,
                'total' => count(self::MEASUREMENT_KEYS),
                'missing' => $missingMeasurements,
            ],
            'advice' => $this->advice,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->full_name,
                'barcode' => $this->user->barcode,
                'role' => $this->user->role,
                'department' => $this->user->department,
            ]),
            'session' => $this->whenLoaded('kioskSession', fn () => [
                'session_number' => $this->kioskSession->session_number,
                'status' => $this->kioskSession->status,
                'started_at' => $this->kioskSession->started_at,
            ]),
        ];
    }
}
