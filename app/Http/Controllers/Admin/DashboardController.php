<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $today = now()->startOfDay();

        $counts = [
            'total_users' => User::count(),
            'students' => User::where('role', 'student')->count(),
            'teachers' => User::where('role', 'teacher')->count(),
            'health_records' => HealthRecord::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->count(),
            'sessions_today' => KioskSession::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->whereDate('started_at', $today)->count(),
            'completed_sessions' => KioskSession::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->where('status', 'completed')->count(),
            'incomplete_sessions' => KioskSession::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->where('status', '!=', 'completed')->count(),
            'active_alerts' => DB::table('alerts')->whereNull('read_at')->count(),
        ];

        $period = $request->query('period', 'weekly');
        $healthChecksQuery = KioskSession::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->where('status', 'completed');

        $dailyHealthChecks = $this->getDailyHealthChecks($healthChecksQuery, $period);

        $recentSessions = KioskSession::query()
            ->with('user:id,firstname,lastname,student_id,barcode')
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->latest('started_at')
            ->get()
            ->map(fn (KioskSession $session) => [
                'id' => $session->id,
                'schoolId' => $session->user?->student_id ?: $session->user?->barcode ?: 'N/A',
                'user' => $session->user?->full_name ?: 'Unknown user',
                'duration' => $this->formatSessionDuration($session),
                'started' => $session->started_at?->diffForHumans() ?: 'Not started',
                'status' => ucfirst(str_replace('_', ' ', $session->status ?: 'pending')),
            ]);

        ActivityLog::record('admin_dashboard_viewed', $request->user(), $request, 'Admin viewed dashboard.');

        return response()->json([
            'counts' => $counts,
            'stats' => [
                [
                    'key' => 'students',
                    'label' => 'Students',
                    'value' => $counts['students'],
                    'change' => 0,
                    'trend' => 'neutral',
                    'icon' => 'students',
                    'description' => 'Registered student accounts',
                ],
                [
                    'key' => 'teachers',
                    'label' => 'Teachers',
                    'value' => $counts['teachers'],
                    'change' => 0,
                    'trend' => 'neutral',
                    'icon' => 'teachers',
                    'description' => 'Registered teacher accounts',
                ],
                [
                    'key' => 'health-records',
                    'label' => 'Health Records',
                    'value' => $counts['health_records'],
                    'change' => 0,
                    'trend' => 'neutral',
                    'icon' => 'checks',
                    'description' => 'Kiosk health records saved',
                ],
                [
                    'key' => 'active-alerts',
                    'label' => 'Unread Alerts',
                    'value' => $counts['active_alerts'],
                    'change' => 0,
                    'trend' => 'neutral',
                    'icon' => 'alerts',
                    'description' => 'Alerts waiting for review',
                ],
            ],
            'daily_health_checks' => $dailyHealthChecks,
            'recent_sessions' => $recentSessions,
        ]);
    }

    private function formatSessionDuration(KioskSession $session): string
    {
        if (! $session->started_at || ! $session->ended_at) {
            return 'In progress';
        }

        $minutes = max(1, $session->started_at->diffInMinutes($session->ended_at));

        return "{$minutes} min";
    }

    private function getDailyHealthChecks($healthChecksQuery, string $period)
    {
        if ($period === 'yearly') {
            $start = now()->startOfYear();
            $end = now()->endOfYear();
            
            $checks = (clone $healthChecksQuery)
                ->selectRaw('YEAR(COALESCE(ended_at, started_at)) as y, MONTH(COALESCE(ended_at, started_at)) as m, COUNT(*) as checks')
                ->whereBetween(DB::raw('COALESCE(ended_at, started_at)'), [$start, $end])
                ->groupBy('y', 'm')
                ->get()
                ->keyBy(fn ($row) => $row->y . '-' . sprintf('%02d', $row->m));
                
            return collect(CarbonPeriod::create($start, '1 month', $end))
                ->map(fn ($date) => [
                    'day' => $date->format('M'),
                    'checks' => (int) ($checks[$date->format('Y-m')]->checks ?? 0),
                ])
                ->values();
        } 
        
        if ($period === 'monthly') {
            $start = now()->startOfMonth();
            $end = now()->endOfMonth();
            
            $checks = (clone $healthChecksQuery)
                ->selectRaw('DATE(COALESCE(ended_at, started_at)) as record_date, COUNT(*) as checks')
                ->whereBetween(DB::raw('COALESCE(ended_at, started_at)'), [$start, $end])
                ->groupBy('record_date')
                ->pluck('checks', 'record_date');
                
            return collect(CarbonPeriod::create($start, '1 day', $end))
                ->map(fn ($date) => [
                    'day' => $date->format('j'),
                    'checks' => (int) ($checks[$date->toDateString()] ?? 0),
                ])
                ->values();
        } 
        
        $start = now()->startOfWeek(1)->startOfDay(); // 1 = Monday
        $end = now()->endOfWeek(7)->startOfDay(); // 7 = Sunday
        
        $checks = (clone $healthChecksQuery)
            ->selectRaw('DATE(COALESCE(ended_at, started_at)) as record_date, COUNT(*) as checks')
            ->whereBetween(DB::raw('COALESCE(ended_at, started_at)'), [$start, $end->copy()->endOfDay()])
            ->groupBy('record_date')
            ->pluck('checks', 'record_date');
            
        return collect(CarbonPeriod::create($start, '1 day', $end))
            ->map(fn ($date) => [
                'day' => $date->format('D'),
                'checks' => (int) ($checks[$date->toDateString()] ?? 0),
            ])
            ->values();
    }
}
