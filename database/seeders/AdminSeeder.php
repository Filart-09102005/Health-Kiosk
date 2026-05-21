<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the Health Kiosk admin account.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'smcbihealthkiosk@gmail.com'],
            [
                'firstname' => 'Health',
                'lastname' => 'Kiosk',
                'student_id' => null,
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'department' => 'Clinic',
                'age' => null,
                'gender' => null,
                'barcode' => null,
                'email_verified_at' => now(),
            ]
        );
    }
}
