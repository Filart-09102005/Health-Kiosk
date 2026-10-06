<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
            // Which sign-in the person chose on the login page. The account's
            // own role must match it - see AuthController::login().
            'login_as' => ['sometimes', 'nullable', 'in:student,admin'],
        ];
    }
}
