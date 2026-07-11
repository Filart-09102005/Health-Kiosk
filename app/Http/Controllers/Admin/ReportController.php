<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\HealthReportExport;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Return available report templates for the frontend
        return response()->json([
            'data' => [
                [
                    'id' => 'measurement_analytics',
                    'name' => 'Measurement Analytics Report',
                    'description' => 'Comprehensive summary of all health records, distributions, and vital trends.',
                ],
                [
                    'id' => 'alert_analytics',
                    'name' => 'Alert Analytics Report',
                    'description' => 'Breakdown of generated health alerts, resolution rates, and pending cases.',
                ],
                [
                    'id' => 'follow_up',
                    'name' => 'Students Requiring Follow-up',
                    'description' => 'List of active students with unresolved health alerts needing clinic intervention.',
                ],
                [
                    'id' => 'recently_resolved',
                    'name' => 'Recently Resolved Alerts',
                    'description' => 'Log of recently resolved alerts, showing original and new measurements with notes.',
                ],
            ]
        ]);
    }

    public function filterOptions(): JsonResponse
    {
        $base = clone DB::table('users')->where('role', '!=', 'admin');

        return response()->json([
            'departments' => $this->distinctValues($base, 'department'),
            'programs' => $this->distinctValues($base, 'program'),
            'strands' => $this->distinctValues($base, 'strand'),
            'year_levels' => $this->distinctValues($base, 'year_level'),
            'grade_levels' => $this->distinctValues($base, 'grade_level'),
            'genders' => array_values(array_unique(array_merge(
                ['male', 'female', 'other', 'prefer_not_to_say'],
                $this->distinctValues(clone $base, 'gender'),
            ))),
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $type = $request->input('type');
        $filters = $this->extractFilters($request);
        $adminName = $request->user()?->full_name ?: 'Clinic Admin';

        // Load data based on type
        $data = $this->getReportData($type, $filters);

        $pdf = Pdf::loadView("reports.pdf.{$type}", [
            'data' => $data,
            'filters' => $filters,
            'adminName' => $adminName,
            'dateGenerated' => now()->format('F j, Y h:i A'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download("{$type}_report_" . now()->format('Ymd_His') . ".pdf");
    }

    public function downloadExcel(Request $request)
    {
        $type = $request->input('type');
        $filters = $this->extractFilters($request);
        $adminName = $request->user()?->full_name ?: 'Clinic Admin';
        $dateGenerated = now()->format('F j, Y h:i A');

        $data = $this->getReportData($type, $filters);
        
        return Excel::download(
            new HealthReportExport($type, $data, $filters, $adminName, $dateGenerated), 
            "{$type}_report_" . now()->format('Ymd_His') . ".xlsx"
        );
    }

    private function getReportData(string $type, array $filters)
    {
        // Apply filters to get the base user IDs that match
        $userIds = $this->getFilteredUserIds($filters);
        
        switch ($type) {
            case 'measurement_analytics':
                return HealthRecord::with('user')
                    ->whereIn('user_id', $userIds)
                    ->when($filters['date_from'], fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                    ->when($filters['date_to'], fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                    ->get();
            case 'alert_analytics':
                return DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->select('alerts.*', DB::raw("TRIM(CONCAT(users.firstname, ' ', users.lastname)) as full_name"), 'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand')
                    ->whereIn('alerts.user_id', $userIds)
                    ->when($filters['date_from'], fn($q) => $q->whereDate('alerts.created_at', '>=', $filters['date_from']))
                    ->when($filters['date_to'], fn($q) => $q->whereDate('alerts.created_at', '<=', $filters['date_to']))
                    ->get();
            case 'follow_up':
                // Students with at least one pending alert and abnormal health record in timeframe
                return DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->select('alerts.*', DB::raw("TRIM(CONCAT(users.firstname, ' ', users.lastname)) as full_name"), 'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand')
                    ->whereIn('alerts.user_id', $userIds)
                    ->whereNull('alerts.read_at') // Pending
                    ->get();
            case 'recently_resolved':
                return DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->leftJoin('health_records', 'alerts.kiosk_session_id', '=', 'health_records.kiosk_session_id')
                    ->select(
                        'alerts.*', 
                        DB::raw("TRIM(CONCAT(users.firstname, ' ', users.lastname)) as full_name"), 
                        'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand',
                        'health_records.temperature', 'health_records.spo2', 'health_records.heart_rate', 'health_records.bmi'
                    )
                    ->whereIn('alerts.user_id', $userIds)
                    ->whereNotNull('alerts.read_at') // Resolved
                    ->orderByDesc('alerts.read_at')
                    ->get();
            default:
                return [];
        }
    }

    private function getFilteredUserIds(array $filters): array
    {
        $query = DB::table('users')->where('role', '!=', 'admin');

        if ($filters['department']) $query->where('department', $filters['department']);
        if ($filters['gender']) $query->where('gender', $filters['gender']);
        if (!empty($filters['program'])) $query->whereIn('program', $filters['program']);
        if (!empty($filters['strand'])) $query->whereIn('strand', $filters['strand']);
        if (!empty($filters['year_level'])) $query->whereIn('year_level', $filters['year_level']);
        if (!empty($filters['grade_level'])) $query->whereIn('grade_level', $filters['grade_level']);

        return $query->pluck('id')->toArray();
    }

    private function extractFilters(Request $request): array
    {
        return [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'department' => $request->input('department'),
            'program' => $this->normalizeMultiValue($request->input('program', [])),
            'strand' => $this->normalizeMultiValue($request->input('strand', [])),
            'year_level' => $this->normalizeMultiValue($request->input('year_level', [])),
            'grade_level' => $this->normalizeMultiValue($request->input('grade_level', [])),
            'gender' => $request->input('gender'),
        ];
    }

    private function distinctValues($base, string $column): array
    {
        return $base
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->values()
            ->all();
    }

    private function normalizeMultiValue(mixed $value): array
    {
        if (is_array($value)) return array_values(array_filter($value, fn ($item) => filled($item)));
        return array_values(array_filter(explode(',', (string) $value), fn ($item) => filled($item)));
    }
}
