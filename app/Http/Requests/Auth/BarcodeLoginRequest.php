<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class BarcodeLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'barcode' => ['required', 'string', 'max:100'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
