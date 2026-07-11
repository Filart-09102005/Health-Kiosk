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
            'birthday' => ['required', 'date', 'before:today'],
            'gender' => ['required', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'department' => ['required', Rule::in(['COLLEGE', 'NTP', 'BED'])],
            'grade_level' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('department') === 'BED'),
                Rule::in(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
            ],
            'strand' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('department') === 'BED'
                    && in_array($this->input('grade_level'), ['Grade 11', 'Grade 12'], true)),
                Rule::in(['ABM', 'HUMSS', 'STEM']),
            ],
            'year_level' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('department') === 'COLLEGE'),
                Rule::in(['1st Year', '2nd Year', '3rd Year', '4th Year']),
            ],
            'program' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('department') === 'COLLEGE'),
                Rule::in(['BSIT', 'BSED', 'BEED', 'BSHM', 'BSBA']),
            ],
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
            'grade_level.required' => 'Please choose a grade level for BED.',
            'strand.required' => 'Please choose a strand for Grade 11 or Grade 12.',
            'year_level.required' => 'Please choose a year level for College.',
            'program.required' => 'Please choose a program for College.',
        ];
    }
}
