<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AlertController extends Controller
{
    public function index(): JsonResponse
    {
        $records = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->leftJoin('kiosk_sessions', 'alerts.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->select([
                'alerts.*',
                'users.firstname',
                'users.lastname',
                'users.student_id',
                'users.barcode',
                'users.role',
                'users.department',
                'kiosk_sessions.status as session_status',
                'kiosk_sessions.session_number',
            ])
            ->whereNotNull('alerts.user_id')
            ->where('users.role', '!=', 'admin')
            ->orderByDesc('alerts.created_at')
            ->limit(100)
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
                    'fullName' => trim(($alert->firstname ?: '').' '.($alert->lastname ?: '')) ?: 'System',
                    'role' => $alert->role ?: 'system',
                    'alertType' => $alert->title ?: str($alert->type)->replace('_', ' ')->title()->toString(),
                    'measurementValue' => $this->measurementValue($alert, $healthRecord),
                    'severity' => $this->severity($alert->severity),
                    'status' => $alert->read_at ? 'Resolved' : 'Pending',
                    'sessionStatus' => $this->sessionStatus($alert->session_status),
                    'triggeredAt' => $alert->created_at ? date('M d, Y h:i A', strtotime($alert->created_at)) : 'N/A',
                    'reviewedBy' => $alert->read_at ? 'Clinic Admin' : 'Unassigned',
                    'department' => $alert->department ?: 'N/A',
                    'heartRate' => $healthRecord?->heart_rate ? round((float) $healthRecord->heart_rate).' bpm' : 'N/A',
                    'spo2' => $healthRecord?->spo2 ? round((float) $healthRecord->spo2).'%' : 'N/A',
                    'bmi' => $healthRecord?->bmi ? number_format((float) $healthRecord->bmi, 1) : 'N/A',
                    'advice' => $healthRecord?->advice ?: ($alert->message ?: 'Clinic review recommended.'),
                ];
            })->values(),
        ]);
    }

    private function measurementValue($alert, ?HealthRecord $record): string
    {
        return match ($alert->type) {
            'temperature', 'high_temperature' => $record?->temperature ? number_format((float) $record->temperature, 1).' C' : 'N/A',
            'spo2', 'low_spo2' => $record?->spo2 ? round((float) $record->spo2).'%' : 'N/A',
            'heart_rate', 'high_heart_rate' => $record?->heart_rate ? round((float) $record->heart_rate).' bpm' : 'N/A',
            'bmi' => $record?->bmi ? number_format((float) $record->bmi, 1).' BMI' : 'N/A',
            default => 'N/A',
        };
    }

    private function severity(string $severity): string
    {
        return match (strtolower($severity)) {
            'critical' => 'Critical',
            'high', 'error' => 'High',
            'medium', 'warning' => 'Medium',
            default => 'Low',
        };
    }

    private function sessionStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'completed' => 'Completed',
            'active', 'in_progress' => 'Active',
            default => 'Incomplete',
        };
    }
}
