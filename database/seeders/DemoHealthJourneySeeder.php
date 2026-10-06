<?php

namespace Database\Seeders;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Backfills a plausible 1st → 4th Year College history so the Health Journey
 * timeline, School-Year Progress cards and growth chart can be seen with a full
 * range of academic years.
 *
 * DEMONSTRATION DATA. It is additive — real records are never touched — and
 * every row it writes is tagged so it can be removed again:
 *
 *     php artisan demo:journey          # add
 *     php artisan demo:journey --clear  # remove
 *
 * Driven through a console command rather than seeder arguments because
 * `db:seed` consumes everything after --class as the class name.
 *
 * Target a specific account with DEMO_JOURNEY_EMAIL in .env; otherwise the
 * seeder uses the student with the most existing records.
 */
class DemoHealthJourneySeeder extends Seeder
{
    /**
     * Written to kiosk_sessions.login_method. Nothing else in the app writes
     * this value, so it is a safe handle for finding and deleting demo rows
     * without risking a real session.
     */
    public const DEMO_TAG = 'demo_journey';

    /**
     * Three screenings per academic year, 1st through 4th Year College.
     *
     * Three rather than one so the section has something real to summarise: an
     * in-year Height/Weight change to report, and several readings to average
     * the vitals from. Values follow a believable college-age curve — height
     * has largely plateaued by 18, weight climbs modestly, resting heart rate
     * drifts down with fitness. Two years carry an off-normal reading so the
     * Watch and Alert styling both appear.
     *
     * Each entry: [school year start, level, [visits...]]
     * Each visit: [month, day, height cm, weight kg, HR, SpO2, temp]
     */
    private const JOURNEY = [
        [2022, '1st Year College', [
            [8,  22, 167.4, 56.8, 78, 98, 36.6],
            [12,  5, 167.8, 57.9, 77, 99, 36.8],
            [3,  18, 168.2, 58.4, 76, 98, 36.5],
        ]],
        [2023, '2nd Year College', [
            [8,  20, 168.6, 59.2, 75, 99, 36.7],
            [11, 28, 169.0, 60.1, 74, 98, 37.4], // Watch: mild fever
            [3,  14, 169.3, 60.8, 74, 99, 36.6],
        ]],
        [2024, '3rd Year College', [
            [8,  19, 169.6, 61.5, 73, 98, 36.9],
            [12,  3, 169.9, 62.3, 72, 99, 36.5],
            [3,  20, 170.1, 62.9, 71, 99, 36.7],
        ]],
        [2025, '4th Year College', [
            [8,  18, 170.3, 63.4, 71, 98, 36.6],
            [11, 26, 170.5, 64.0, 70, 99, 38.3], // Alert: fever
            [3,  16, 170.6, 64.6, 69, 99, 36.8],
        ]],
    ];

    public function run(): void
    {
        $user = $this->targetUser();

        if (! $user) {
            $this->command?->error('No student account found to attach the demo journey to.');

            return;
        }

        $this->command?->info("Seeding demo Health Journey for {$user->full_name} ({$user->email}).");

        // Start above the account's existing numbering so the unique
        // (user_id, session_number) pair cannot collide with real sessions.
        $nextNumber = (int) KioskSession::where('user_id', $user->id)->max('session_number') + 1;
        $created = 0;

        DB::transaction(function () use ($user, &$nextNumber, &$created) {
            foreach (self::JOURNEY as [$syStart, $level, $visits]) {
                // Re-running must not double up. One check is enough: the whole
                // year is written together or not at all.
                $alreadySeeded = KioskSession::where('user_id', $user->id)
                    ->where('login_method', self::DEMO_TAG)
                    ->whereBetween('started_at', [
                        CarbonImmutable::create($syStart, 7, 1),
                        CarbonImmutable::create($syStart + 1, 6, 30, 23, 59, 59),
                    ])
                    ->exists();

                if ($alreadySeeded) {
                    continue;
                }

                foreach ($visits as [$month, $day, $height, $weight, $heartRate, $spo2, $temperature]) {
                    // Months before July belong to the second half of the school
                    // year, so they fall in the following calendar year.
                    $calendarYear = $month >= 7 ? $syStart : $syStart + 1;
                    $takenAt = CarbonImmutable::create($calendarYear, $month, $day, 10, 30, 0);

                    $session = KioskSession::create([
                        'user_id' => $user->id,
                        'session_number' => $nextNumber++,
                        'status' => 'completed',
                        'started_at' => $takenAt,
                        'ended_at' => $takenAt->addMinutes(6),
                        'login_method' => self::DEMO_TAG,
                    ]);

                    // created_at drives the timeline grouping, so it has to be
                    // backdated rather than left at "now".
                    $session->forceFill([
                        'created_at' => $takenAt,
                        'updated_at' => $takenAt,
                    ])->saveQuietly();

                    $bmi = round($weight / (($height / 100) ** 2), 2);

                    $record = HealthRecord::create([
                        'kiosk_session_id' => $session->id,
                        'user_id' => $user->id,
                        'academic_level' => $level,
                        'school_year' => sprintf('S.Y. %d - %d', $syStart, $syStart + 1),
                        'heart_rate' => $heartRate,
                        'spo2' => $spo2,
                        'temperature' => $temperature,
                        'height' => $height,
                        'weight' => $weight,
                        'bmi' => $bmi,
                        'bmi_category' => $this->bmiCategory($bmi),
                        'health_status' => $this->status($temperature, $heartRate, $spo2),
                        'missing_measurements' => [],
                        'skipped_measurements' => [],
                        'advice' => 'Demonstration record.',
                    ]);

                    $record->forceFill([
                        'created_at' => $takenAt,
                        'updated_at' => $takenAt,
                    ])->saveQuietly();

                    $created++;
                }
            }
        });

        $this->command?->info("Added {$created} demo records across 4 academic years (1st → 4th Year College).");
        $this->command?->warn('Remove them with: php artisan demo:journey --clear');
    }

    public function clear(): void
    {
        $sessions = KioskSession::where('login_method', self::DEMO_TAG)->get();

        if ($sessions->isEmpty()) {
            $this->command?->info('No demo journey data to remove.');

            return;
        }

        $ids = $sessions->pluck('id');
        $records = HealthRecord::whereIn('kiosk_session_id', $ids)->count();

        HealthRecord::whereIn('kiosk_session_id', $ids)->delete();
        KioskSession::whereIn('id', $ids)->delete();

        $this->command?->info("Removed {$records} demo records and {$sessions->count()} demo sessions from the local database. Real data untouched.");
        // The sync is push-only: deleting locally leaves the rows in Supabase,
        // where the mobile app still reads them.
        $this->command?->warn('Rows already pushed to Supabase are NOT removed by this. Run: php artisan supabase:purge-orphans');
    }

    private function targetUser(): ?User
    {
        $email = env('DEMO_JOURNEY_EMAIL');

        if ($email) {
            return User::where('email', $email)->first();
        }

        // Whoever is actually being used for testing — the account with the
        // most records is the one whose timeline you are looking at.
        return User::where('role', 'student')
            ->withCount('healthRecords')
            ->orderByDesc('health_records_count')
            ->first();
    }

    private function bmiCategory(float $bmi): string
    {
        if ($bmi < 18.5) return 'Underweight';
        if ($bmi < 25) return 'Normal';
        if ($bmi < 30) return 'Overweight';

        return 'Obese';
    }

    /**
     * Capitalised to match HealthEvaluationService::overallStatus(). Writing
     * these lowercase produced a second spelling of every status, which any
     * client grouping by health_status would have counted as separate buckets.
     */
    private function status(float $temperature, int $heartRate, int $spo2): string
    {
        if ($temperature >= 37.5 || $temperature <= 35.0 || $heartRate >= 100 || $spo2 < 95) {
            return 'Alert';
        }

        if ($temperature >= 37.3 || $heartRate >= 90 || $spo2 < 97) {
            return 'Watch';
        }

        return 'Normal';
    }
}
