<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $from = trim(($request->date_from ?: now()->startOfDay()->toDateString()).' '.($request->time_from ?: '00:00'));
        $to = trim(($request->date_to ?: now()->toDateString()).' '.($request->time_to ?: '23:59'));

        $records = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->whereBetween('created_at', [$from, $to]);

        $sessions = KioskSession::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->whereBetween('created_at', [$from, $to]);

        $alerts = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->where(function ($query) {
                $query->whereNull('users.role')->orWhere('users.role', '!=', 'admin');
            })
            ->whereBetween('alerts.created_at', [$from, $to]);

        return response()->json([
            'data' => [[
                'id' => 'RPT-'.now()->format('ymdHis'),
                'name' => 'Health Records Report',
                'dateRange' => "{$from} - {$to}",
                'generatedBy' => $request->user()?->full_name ?: 'Clinic Admin',
                'roleFilter' => 'Students and teachers',
                'measurementType' => 'Health records',
                'totalRecords' => (clone $records)->count(),
                'completedSessions' => (clone $sessions)->where('status', 'completed')->count(),
                'incompleteSessions' => (clone $sessions)->where('status', '!=', 'completed')->count(),
                'alertCases' => (clone $alerts)->count(),
                'format' => 'PDF / Excel / Print',
                'generatedAt' => now()->format('M d, Y h:i A'),
                'status' => 'Ready',
            ]],
        ]);
    }
}
