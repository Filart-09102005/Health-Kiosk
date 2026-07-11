<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\SessionMeasurement;
use App\Models\Alert;
use App\Models\User;
use Illuminate\Console\Command;

class TestAlertCommand extends Command
{
    protected $signature = 'app:test-alert {--role=student : The role to query (student or teacher)}';

    protected $description = 'Creates a test high-temperature health alert for an existing student/teacher from the database.';

    public function handle(): int
    {
        $role = $this->option('role');

        // 1. Get an existing student/user from the database
        $student = User::where('role', $role)->first();

        if (! $student) {
            $this->error("No user with role '{$role}' found in the database. Please create one first.");
            return self::FAILURE;
        }

        $fullName = trim("{$student->firstname} {$student->lastname}");

        $displayId = $student->student_id ?? $student->barcode ?? 'N/A';

        $this->info("Found user: {$fullName} (ID: {$displayId})");

        // 2. Create a kiosk session for that student
        $nextSessionNumber = KioskSession::where('user_id', $student->id)->max('session_number');
        $nextSessionNumber = ($nextSessionNumber ?? 0) + 1;

        $session = KioskSession::create([
            'user_id'        => $student->id,
            'session_number' => $nextSessionNumber,
            'status'         => 'completed',
            'login_method'   => 'test_alert',
            'started_at'     => now()->subMinutes(5),
            'ended_at'       => now(),
        ]);

        $this->info("Created kiosk session: #{$session->id} (session #{$nextSessionNumber})");

        // 3. Insert an abnormal temperature measurement (38.7°C = critical high)
        $measurement = SessionMeasurement::create([
            'kiosk_session_id' => $session->id,
            'user_id'          => $student->id,
            'type'             => 'temperature',
            'value'            => 38.7,
            'unit'             => '°C',
            'attempt'          => 1,
            'status'           => 'critical',
            'measured_at'      => now(),
        ]);

        $this->info("Created measurement: Temperature 38.7°C (status: critical)");

        // 4. Create the matching health record
        $record = HealthRecord::create([
            'kiosk_session_id'   => $session->id,
            'user_id'            => $student->id,
            'temperature'        => 38.7,
            'health_status'      => 'Critical High Temperature',
            'advice'             => 'Call the student, assist them to the clinic, and manually verify the result.',
        ]);

        $this->info("Created health record: #{$record->id}");

        // 5. Create an unread/unacknowledged health alert
        $alertMessage = "{$fullName} has a critical high temperature and needs immediate attention. "
            . "Please call the student and assess the condition.\n\n"
            . "Temperature: 38.7°C\n"
            . "Status: Critical High Temperature\n"
            . "Recommended Action: Call the student, assist them to the clinic, and manually verify the result.";

        $alert = Alert::create([
            'user_id'          => $student->id,
            'kiosk_session_id' => $session->id,
            'type'             => 'high_temperature',
            'severity'         => 'critical',
            'title'            => "Critical High Temperature — {$fullName}",
            'message'          => $alertMessage,
            'read_at'          => null, // unread/unacknowledged
        ]);

        $this->info("Created health alert: #{$alert->id} (unread/unacknowledged)");

        $this->newLine();
        $this->line("--------------------------------------------------");
        $this->info("✅ Test alert successfully created!");
        $this->line("   Student : {$fullName}");
        $this->line("   ID      : " . ($student->student_id ?? $student->barcode ?? 'N/A'));
        $this->line("   Alert ID: {$alert->id}");
        $this->line("   Severity: Critical");
        $this->line("   Temp    : 38.7°C");
        $this->line("--------------------------------------------------");
        $this->comment("The admin modal should now detect this unread alert on the next poll.");

        return self::SUCCESS;
    }
}
