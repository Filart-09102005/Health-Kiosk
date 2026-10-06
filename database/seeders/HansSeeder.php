<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HansSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'hanskurveyfilart@smcbi.edu.ph'],
            [
                'firstname' => 'Hans',
                'lastname' => 'Filart',
                'student_id' => null,
                'password' => Hash::make('hans123'),
                'role' => 'student',
                'department' => 'Clinic',
                'birthday' => null,
                'gender' => null,
                'barcode' => 'C-230204',
                'email_verified_at' => now(),
            ]
        );
    }
}
