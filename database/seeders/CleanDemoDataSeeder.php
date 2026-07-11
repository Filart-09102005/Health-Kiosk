<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class CleanDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Cleaning up demo data...');

        DB::transaction(function () {
            // Keep admins and Hans
            $usersToKeep = User::where('role', 'admin')
                ->orWhere('email', 'hanskurveyfilart@smcbi.edu.ph')
                ->pluck('id');

            // Find users to delete
            $usersToDelete = User::whereNotIn('id', $usersToKeep)->pluck('id');

            if ($usersToDelete->isEmpty()) {
                $this->command->info('No demo users found to delete.');
                return;
            }

            // Delete related records first to avoid foreign key constraints
            DB::table('alerts')->whereIn('user_id', $usersToDelete)->delete();
            DB::table('health_records')->whereIn('user_id', $usersToDelete)->delete();
            DB::table('kiosk_sessions')->whereIn('user_id', $usersToDelete)->delete();
            
            // Delete the users
            User::whereIn('id', $usersToDelete)->delete();

            $this->command->info('Successfully deleted ' . $usersToDelete->count() . ' demo users and their related records.');
        });
    }
}
