<?php

namespace App\Http\Requests\Measurement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeasurementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['student', 'teacher']) ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['heart_rate', 'temperature', 'height', 'weight'])],
            'value' => ['required', 'numeric', 'min:0'],
            'secondary_value' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'heart_rate' && ! $this->filled('secondary_value')) {
                $validator->errors()->add('secondary_value', 'SpO2 value is required with heart rate.');
            }
        });
    }
}
