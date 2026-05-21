<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'barcode' => ['nullable', 'string', 'max:100', 'unique:users,barcode'],
            'role' => ['required', Rule::in(['student', 'teacher'])],
            'firstname' => ['required', 'string', 'max:100'],
            'lastname' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                'ends_with:@smcbi.edu.ph',
                'unique:users,email',
            ],
            'age' => ['required', 'integer', 'between:5,120'],
            'gender' => ['required', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'department' => ['required', Rule::in(['COLLEGE', 'FACULTY', 'BED'])],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'barcode.unique' => 'This barcode is already registered.',
            'email.ends_with' => 'Please use your school email ending in @smcbi.edu.ph.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
