<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\HealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlertController extends Controller
{
    public function index(): JsonResponse
    {
        $records = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->leftJoin('users as resolver', 'alerts.resolved_by', '=', 'resolver.id')
            ->leftJoin('kiosk_sessions', 'alerts.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->select([
                'alerts.*',
                'users.firstname',
                'users.lastname',
                'users.student_id',
                'users.barcode',
                'users.role',
                'users.department',
                'resolver.firstname as resolver_firstname',
                'resolver.lastname as resolver_lastname',
                'kiosk_sessions.status as session_status',
                'kiosk_sessions.session_number',
            ])
            ->whereNotNull('alerts.user_id')
            ->where('users.role', '!=', 'admin')
            ->orderByDesc('alerts.created_at')
            ->get();

        $healthRecords = HealthRecord::query()
            ->whereIn('kiosk_session_id', $records->pluck('kiosk_session_id')->filter()->unique())
            ->get()
            ->keyBy('kiosk_session_id');

        return response()->json([
            'data' => $records->map(function ($alert) use ($healthRecords) {
                $healthRecord = $healthRecords->get($alert->kiosk_session_id);

                return [
                    'id' => 'ALT-'.$alert->id,
                    'schoolId' => $alert->student_id ?: $alert->barcode ?: 'N/A',
                    'fullName' => trim(($alert->firstname ?: '').(' ').($alert->lastname ?: '')) ?: 'System',
                    'role' => $alert->role ?: 'system',
                    'alertType' => $alert->title ?: str($alert->type)->replace('_', ' ')->title()->toString(),
                    'measurementValue' => $this->measurementValue($alert, $healthRecord),
                    'severity' => $this->severity($alert->severity),
                    'status' => $alert->read_at ? 'Resolved' : 'Pending',
                    'sessionStatus' => $this->sessionStatus($alert->session_status),
                    'triggeredAt' => $alert->created_at ? date('M d, Y h:i A', strtotime($alert->created_at)) : 'N/A',
                    'reviewedBy' => $alert->read_at ? (trim(($alert->resolver_firstname ?: '').' '.($alert->resolver_lastname ?: '')) ?: 'Clinic Admin') : 'Unassigned',
                    'department' => $alert->department ?: 'N/A',
                    'heartRate' => $healthRecord?->heart_rate ? round((float) $healthRecord->heart_rate).' bpm' : 'N/A',
                    'spo2' => $healthRecord?->spo2 ? round((float) $healthRecord->spo2).'%' : 'N/A',
                    'bmi' => $healthRecord?->bmi ? number_format((float) $healthRecord->bmi, 1) : 'N/A',
                    'advice' => $healthRecord?->advice ?: ($alert->message ?: 'Clinic review recommended.'),
                    'newMeasurement' => Alert::displayableManualMeasurement($alert->new_measurement),
                    'resolutionNotes' => $alert->resolution_notes,
                ];
            })->values(),
        ]);
    }

    /**
     * Return pending (unacknowledged) alerts sorted by severity for the modal queue.
     * Only returns alerts where read_at IS NULL (unread/unacknowledged).
     */
    public function queue(): JsonResponse
    {
        $severityOrder = ['critical' => 0, 'high' => 1, 'moderate' => 2, 'low' => 3];

        $alerts = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->leftJoin('users as resolver', 'alerts.resolved_by', '=', 'resolver.id')
            ->leftJoin('kiosk_sessions', 'alerts.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->select([
                'alerts.id',
                'alerts.user_id',
                'alerts.kiosk_session_id',
                'alerts.type',
                'alerts.severity',
                'alerts.title',
                'alerts.message',
                'alerts.created_at',
                'alerts.new_measurement',
                'alerts.resolution_notes',
                'alerts.read_at',
                'users.firstname',
                'users.lastname',
                'users.student_id',
                'users.barcode',
                'users.role',
                'users.department',
                'users.grade_level',
                'users.strand',
                'users.year_level',
                'users.program',
                'resolver.firstname as resolver_firstname',
                'resolver.lastname as resolver_lastname',
                'kiosk_sessions.session_number',
            ])
            ->whereNull('alerts.read_at')
            ->whereNotNull('alerts.user_id')
            ->where('users.role', '!=', 'admin')
            ->orderByDesc('alerts.created_at')
            ->limit(50)
            ->get();

        // Load related health records and measurements in bulk
        $sessionIds = $alerts->pluck('kiosk_session_id')->filter()->unique()->values();

        $healthRecords = HealthRecord::query()
            ->whereIn('kiosk_session_id', $sessionIds)
            ->get()
            ->keyBy('kiosk_session_id');

        $measurements = DB::table('session_measurements')
            ->whereIn('kiosk_session_id', $sessionIds)
            ->whereNotIn('status', ['normal', 'ok'])
            ->orderByDesc('measured_at')
            ->get()
            ->groupBy('kiosk_session_id');

        $mapped = $alerts->map(function ($alert) use ($healthRecords, $measurements, $severityOrder) {
            $healthRecord = $healthRecords->get($alert->kiosk_session_id);
            $sessionMeasurements = $measurements->get($alert->kiosk_session_id, collect());
            $latestMeasurement = $sessionMeasurements->first();

            $fullName  = trim(($alert->firstname ?: '').' '.($alert->lastname ?: '')) ?: 'Unknown Student';
            $studentId = $alert->student_id ?: $alert->barcode ?: 'N/A';
            $severity  = strtolower($alert->severity ?: 'low');

            // Resolve measurement type and value from alert type or latest abnormal measurement
            $measurementType  = $this->resolveMeasurementType($alert->type, $latestMeasurement);
            $measurementValue = $this->resolveMeasurementValue($alert->type, $healthRecord, $latestMeasurement);
            $measurementUnit  = $latestMeasurement?->unit ?: $this->defaultUnit($alert->type);
            $emergency = $this->emergencyCopy($alert->type, $measurementValue, $fullName);

            return [
                'id'               => $alert->id,
                'fullName'         => $fullName,
                'studentId'        => $studentId,
                'role'             => ucfirst($alert->role ?: 'student'),
                'department'       => $alert->department ?: null,
                'gradeLevel'       => $alert->grade_level ?: null,
                'strand'           => $alert->strand ?: null,
                'yearLevel'        => $alert->year_level ?: null,
                'program'          => $alert->program ?: null,
                'severity'         => $severity,
                'severityOrder'    => $severityOrder[$severity] ?? 99,
                'title'            => $emergency['title'],
                'message'          => $emergency['message'],
                'emergencyAction'  => $emergency['action'],
                'alertCategory'    => $emergency['category'],
                'type'             => $alert->type,
                'measurementType'  => $measurementType,
                'measurementValue' => $measurementValue,
                'measurementUnit'  => $measurementUnit,
                'healthStatus'     => $healthRecord?->health_status ?: ucwords(str_replace('_', ' ', $alert->type)),
                'advice'           => $emergency['action'],
                'kioskSessionId'   => $alert->kiosk_session_id,
                'sessionNumber'    => $alert->session_number,
                'triggeredAt'      => $alert->created_at,
                'newMeasurement'   => Alert::displayableManualMeasurement($alert->new_measurement),
                'resolutionNotes'  => $alert->resolution_notes,
                'reviewedBy'       => $alert->read_at ? (trim(($alert->resolver_firstname ?: '').' '.($alert->resolver_lastname ?: '')) ?: 'Clinic Admin') : 'Unassigned',
            ];
        });

        // Sort by severity priority (critical first)
        $sorted = $mapped->sortBy('severityOrder')->values();

        return response()->json(['data' => $sorted]);
    }

    private function emergencyCopy(?string $type, string $value, string $name): array
    {
        return match ($type) {
            'temperature', 'high_temperature' => [
                'category' => 'High temperature',
                'title' => 'High temperature warning detected',
                'message' => "{$name} has a high body temperature reading ({$value}). Notify the clinic nurse and isolate/recheck the student immediately.",
                'action' => 'Inform the admin/clinic nurse now, call the student, repeat temperature measurement, and assist them to the clinic area.',
            ],
            'spo2', 'low_spo2' => [
                'category' => 'Low oxygen',
                'title' => 'Low oxygen level detected',
                'message' => "{$name} has a low SpO2 reading ({$value}). This may require urgent clinic review.",
                'action' => 'Ask the student to sit down, repeat SpO2 reading, and inform the clinic nurse immediately.',
            ],
            'heart_rate', 'high_heart_rate' => [
                'category' => 'Heart rate',
                'title' => 'High heart rate detected',
                'message' => "{$name} has an elevated heart rate ({$value}). The clinic should verify the reading and check symptoms.",
                'action' => 'Let the student rest, repeat pulse reading, check for dizziness or chest discomfort, and notify clinic staff.',
            ],
            'low_heart_rate' => [
                'category' => 'Heart rate',
                'title' => 'Low heart rate detected',
                'message' => "{$name} has a low heart rate reading ({$value}). Clinic verification is recommended.",
                'action' => 'Repeat the heart rate reading and call clinic staff if the student feels weak, dizzy, or unwell.',
            ],
            'bmi', 'high_bmi', 'low_bmi' => [
                'category' => 'BMI',
                'title' => 'BMI health risk detected',
                'message' => "{$name} has a BMI reading that needs clinic follow-up ({$value}).",
                'action' => 'Record the case for clinic counseling and advise proper follow-up with school health staff.',
            ],
            default => [
                'category' => 'Health alert',
                'title' => 'Health problem detected',
                'message' => "{$name} has an abnormal kiosk health reading ({$value}).",
                'action' => 'Call the student, repeat the reading, and notify clinic staff for verification.',
            ],
        };
    }

    /**
     * Get the count of unread/unacknowledged alerts.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = DB::table('alerts')->whereNull('read_at')->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Acknowledge an alert by setting read_at = now().
     * This permanently prevents the modal from showing it again.
     */
    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (! $alert) {
            return response()->json(['message' => 'Alert not found.'], 404);
        }

        if ($alert->read_at) {
            return response()->json(['message' => 'Alert already acknowledged.']);
        }

        $alert->update(['read_at' => now()]);

        return response()->json(['message' => 'Alert acknowledged.', 'read_at' => $alert->read_at]);
    }

    /**
     * Bulk-resolve every pending (unread) alert, optionally scoped to one severity.
     * Used by the "Resolve All" action on the Alerts page.
     */
    public function resolveAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'severity' => 'nullable|string|in:critical,high,moderate,low',
        ]);

        $query = DB::table('alerts')->whereNull('read_at');

        if (! empty($validated['severity'])) {
            $query->whereRaw('LOWER(severity) = ?', [strtolower($validated['severity'])]);
        }

        $resolvedCount = $query->update([
            'read_at' => now(),
            'resolved_by' => $request->user()->id,
            'resolution_notes' => DB::raw("COALESCE(resolution_notes, 'Bulk resolved by admin.')"),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => "{$resolvedCount} alert(s) resolved.",
            'resolvedCount' => $resolvedCount,
        ]);
    }

    /**
     * Resolve an alert with manual measurement and notes.
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (! $alert) {
            return response()->json(['message' => 'Alert not found.'], 404);
        }

        if ($alert->read_at) {
            return response()->json(['message' => 'Alert already resolved.']);
        }

        $validated = $request->validate([
            'new_measurement' => 'required|string|max:255',
            'resolution_notes' => 'required|string',
        ]);

        $alert->update([
            'new_measurement' => $validated['new_measurement'],
            'resolution_notes' => $validated['resolution_notes'],
            'resolved_by' => $request->user()->id,
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Alert resolved successfully.',
            'alert' => $alert,
        ]);
    }

    private function resolveMeasurementType(string $type, ?object $measurement): string
    {
        if ($measurement) {
            return ucwords(str_replace('_', ' ', $measurement->type));
        }

        return match ($type) {
            'temperature', 'high_temperature', 'low_temperature' => 'Temperature',
            'spo2', 'low_spo2'                                   => 'SpO2',
            'heart_rate', 'high_heart_rate', 'low_heart_rate'    => 'Heart Rate',
            'bmi', 'high_bmi', 'low_bmi'                         => 'BMI',
            default                                              => ucwords(str_replace('_', ' ', $type)),
        };
    }

    private function resolveMeasurementValue(string $type, ?HealthRecord $record, ?object $measurement): string
    {
        if ($measurement && $measurement->value !== null) {
            $val = number_format((float) $measurement->value, 1);
            $unit = $measurement->unit ? " {$measurement->unit}" : '';
            return "{$val}{$unit}";
        }

        return match ($type) {
            'temperature', 'high_temperature', 'low_temperature' => $record?->temperature ? number_format((float) $record->temperature, 1).' °C' : 'N/A',
            'spo2', 'low_spo2'                                   => $record?->spo2 ? round((float) $record->spo2).'%' : 'N/A',
            'heart_rate', 'high_heart_rate', 'low_heart_rate'    => $record?->heart_rate ? round((float) $record->heart_rate).' bpm' : 'N/A',
            'bmi', 'high_bmi', 'low_bmi'                         => $record?->bmi ? number_format((float) $record->bmi, 1) : 'N/A',
            default                                              => 'N/A',
        };
    }

    private function defaultUnit(string $type): string
    {
        return match ($type) {
            'temperature', 'high_temperature', 'low_temperature' => '°C',
            'spo2', 'low_spo2'                                   => '%',
            'heart_rate', 'high_heart_rate', 'low_heart_rate'    => 'bpm',
            default                                              => '',
        };
    }

    private function measurementValue($alert, ?HealthRecord $record): string
    {
        return match ($alert->type) {
            'temperature', 'high_temperature' => $record?->temperature ? number_format((float) $record->temperature, 1).' C' : 'N/A',
            'spo2', 'low_spo2'               => $record?->spo2 ? round((float) $record->spo2).'%' : 'N/A',
            'heart_rate', 'high_heart_rate'  => $record?->heart_rate ? round((float) $record->heart_rate).' bpm' : 'N/A',
            'bmi'                            => $record?->bmi ? number_format((float) $record->bmi, 1).' BMI' : 'N/A',
            default                          => 'N/A',
        };
    }

    private function severity(string $severity): string
    {
        return match (strtolower($severity)) {
            'critical'          => 'Critical',
            'high', 'error'     => 'High',
            'medium', 'warning' => 'Medium',
            default             => 'Low',
        };
    }

    private function sessionStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'completed'             => 'Completed',
            'active', 'in_progress' => 'Active',
            default                 => 'Incomplete',
        };
    }
}
