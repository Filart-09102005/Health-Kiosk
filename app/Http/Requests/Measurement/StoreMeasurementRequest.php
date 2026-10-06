<?php

namespace App\Http\Requests\Measurement;

use App\Support\MeasurementRanges;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeasurementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['student', 'teacher', 'personnel', 'staff', 'faculty']) ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(MeasurementRanges::TYPES)],
            'value' => ['required', 'numeric', 'min:0'],
            'secondary_value' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
            'input_source' => ['nullable', Rule::in(['smart', 'manual'])],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'heart_rate' && ! $this->filled('secondary_value')) {
                $validator->errors()->add('secondary_value', 'SpO2 value is required with heart rate.');
            }

            // Manual entries get a wide plausibility check — enough to catch a
            // slipped decimal or a stray keypress, not enough to argue with a
            // number the person genuinely read off a device. Anything clinically
            // notable is flagged downstream by the admin thresholds instead of
            // being refused at entry. Smart readings are deliberately NOT
            // bounded here: sensor calibration is still being refined, and
            // rejecting a miscalibrated reading would break the measurement flow
            // outright. MeasurementController surfaces those as non-blocking
            // warnings.
            if ($this->input('input_source') !== 'manual') {
                return;
            }

            $violations = MeasurementRanges::violations(
                'manual',
                (string) $this->input('type'),
                $this->input('value'),
                $this->input('secondary_value'),
            );

            foreach ($violations as $field => $message) {
                $validator->errors()->add($field, $message);
            }
        });
    }
}
