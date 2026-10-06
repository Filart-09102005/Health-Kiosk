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
        $filters = $this->extractFilters($request);
        $userIds = $this->getFilteredUserIds($filters);

        $measurementCount = HealthRecord::whereIn('user_id', $userIds)
            ->when($filters['date_from'], fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'], fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->count();

        $alertCount = DB::table('alerts')
            ->whereIn('user_id', $userIds)
            ->when($filters['date_from'], fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'], fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->count();

        $followUpCount = DB::table('alerts')
            ->whereIn('user_id', $userIds)
            ->whereNull('read_at')
            ->count();

        $resolvedCount = DB::table('alerts')
            ->whereIn('user_id', $userIds)
            ->whereNotNull('read_at')
            ->count();

        return response()->json([
            'data' => [
                [
                    'id' => 'measurement_analytics',
                    'name' => 'Measurement Analytics Report',
                    'description' => 'Comprehensive summary of all health records, distributions, and vital trends.',
                    'records_count' => $measurementCount,
                ],
                [
                    'id' => 'alert_analytics',
                    'name' => 'Alert Analytics Report',
                    'description' => 'Breakdown of generated health alerts, resolution rates, and pending cases.',
                    'records_count' => $alertCount,
                ],
                [
                    'id' => 'follow_up',
                    'name' => 'Students Requiring Follow-up',
                    'description' => 'List of active students with unresolved health alerts needing clinic intervention.',
                    'records_count' => $followUpCount,
                ],
                [
                    'id' => 'recently_resolved',
                    'name' => 'Recently Resolved Alerts',
                    'description' => 'Log of recently resolved alerts, showing original and new measurements with notes.',
                    'records_count' => $resolvedCount,
                ],
            ]
        ]);
    }

    public function filterOptions(Request $request): JsonResponse
    {
        $base = DB::table('users')->where('role', '!=', 'admin');

        $baseForAcademicLevel = clone $base;

        $applyFilter = function ($query, $column, $value) {
            if (!filled($value)) return;
            if (is_array($value)) {
                $values = array_values(array_filter($value, fn($v) => filled($v)));
                if (!empty($values)) $query->whereIn($column, $values);
                return;
            }
            $query->where($column, $value);
        };

        $baseForGender = clone $base;
        $applyFilter($baseForGender, 'department', $request->input('department'));
        $applyFilter($baseForGender, 'grade_level', $request->input('grade_level'));
        $applyFilter($baseForGender, 'strand', $request->input('strand'));
        $applyFilter($baseForGender, 'year_level', $request->input('year_level'));
        $applyFilter($baseForGender, 'program', $request->input('program'));

        $baseForGradeLevel = clone $base;
        $applyFilter($baseForGradeLevel, 'department', $request->input('department'));

        $baseForStrand = clone $base;
        $applyFilter($baseForStrand, 'department', $request->input('department'));
        $applyFilter($baseForStrand, 'grade_level', $request->input('grade_level'));

        $baseForYearLevel = clone $base;
        $applyFilter($baseForYearLevel, 'department', $request->input('department'));
        $applyFilter($baseForYearLevel, 'program', $request->input('program'));

        $baseForProgram = clone $base;
        $applyFilter($baseForProgram, 'department', $request->input('department'));

        return response()->json([
            'departments' => $this->distinctValues($baseForAcademicLevel, 'department'),
            'programs' => $this->distinctValues($baseForProgram, 'program'),
            'strands' => $this->distinctValues($baseForStrand, 'strand'),
            'year_levels' => $this->distinctValues($baseForYearLevel, 'year_level'),
            'grade_levels' => $this->distinctValues($baseForGradeLevel, 'grade_level'),
            'genders' => $this->distinctValues($baseForGender, 'gender'),
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $type = $this->reportType($request);
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

        return $pdf->stream("{$type}_report_" . now()->format('Ymd_His') . ".pdf");
    }

    public function getData(Request $request): JsonResponse
    {
        $type = $this->reportType($request);
        $filters = $this->extractFilters($request);
        
        $data = $this->getReportData($type, $filters);
        
        return response()->json([
            'data' => $data,
            'type' => $type
        ]);
    }

    public function downloadExcel(Request $request)
    {
        $type = $this->reportType($request);
        $filters = $this->extractFilters($request);
        $adminName = $request->user()?->full_name ?: 'Clinic Admin';
        $dateGenerated = now()->format('F j, Y h:i A');

        $data = $this->getReportData($type, $filters);
        
        return Excel::download(
            new HealthReportExport($type, $data, $filters, $adminName, $dateGenerated), 
            "{$type}_report_" . now()->format('Ymd_His') . ".xlsx"
        );
    }

    /** The reports this controller knows how to build. */
    private const TYPES = ['measurement_analytics', 'alert_analytics', 'follow_up', 'recently_resolved'];

    /**
     * Compose `full_name` after the query rather than in it.
     *
     * This was `TRIM(CONCAT(...))`, which only exists on MySQL — the same
     * request raised a driver error anywhere else, and the export surfaced it
     * to the admin as a bare "an error occurred".
     */
    private function withFullName($rows)
    {
        return $rows->map(function ($row) {
            $row->full_name = trim(($row->firstname ?? '') . ' ' . ($row->lastname ?? ''));

            return $row;
        });
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
                return $this->withFullName(DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->select('alerts.*', 'users.firstname', 'users.lastname', 'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand')
                    ->whereIn('alerts.user_id', $userIds)
                    ->when($filters['date_from'], fn($q) => $q->whereDate('alerts.created_at', '>=', $filters['date_from']))
                    ->when($filters['date_to'], fn($q) => $q->whereDate('alerts.created_at', '<=', $filters['date_to']))
                    ->get());
            case 'follow_up':
                // Students with at least one pending alert and abnormal health record in timeframe
                return $this->withFullName(DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->select('alerts.*', 'users.firstname', 'users.lastname', 'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand')
                    ->whereIn('alerts.user_id', $userIds)
                    ->whereNull('alerts.read_at') // Pending
                    ->get());
            case 'recently_resolved':
                return $this->withFullName(DB::table('alerts')
                    ->join('users', 'alerts.user_id', '=', 'users.id')
                    ->leftJoin('health_records', 'alerts.kiosk_session_id', '=', 'health_records.kiosk_session_id')
                    ->select(
                        'alerts.*', 
                        'users.firstname', 'users.lastname', 
                        'users.student_id', 'users.department', 'users.program', 'users.year_level', 'users.grade_level', 'users.strand',
                        'health_records.temperature', 'health_records.spo2', 'health_records.heart_rate', 'health_records.bmi'
                    )
                    ->whereIn('alerts.user_id', $userIds)
                    ->whereNotNull('alerts.read_at') // Resolved
                    ->orderByDesc('alerts.read_at')
                    ->get());
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
        if (!empty($filters['section'])) $query->whereIn('section', $filters['section']);

        return $query->pluck('id')->toArray();
    }

    /**
     * The requested report, or a 422.
     *
     * An unknown type used to reach Pdf::loadView() and fail with "View
     * [reports.pdf.whatever] not found" as a 500.
     */
    private function reportType(Request $request): string
    {
        return $request->validate([
            'type' => ['required', 'string', 'in:' . implode(',', self::TYPES)],
        ])['type'];
    }

    private function extractFilters(Request $request): array
    {
        return [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'department' => $request->input('department') ?? $request->input('academic_level'),
            'program' => $this->normalizeMultiValue($request->input('program', [])),
            'strand' => $this->normalizeMultiValue($request->input('strand', [])),
            'year_level' => $this->normalizeMultiValue($request->input('year_level', [])),
            'grade_level' => $this->normalizeMultiValue($request->input('grade_level', [])),
            'section' => $this->normalizeMultiValue($request->input('section', [])),
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
