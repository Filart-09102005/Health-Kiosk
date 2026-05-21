<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $counts = Cache::remember('admin.dashboard.counts', now()->addMinutes(5), function () {
            return [
                'total_users' => User::count(),
                'students' => User::where('role', 'student')->count(),
                'teachers' => User::where('role', 'teacher')->count(),
                'health_records' => 0,
            ];
        });

        ActivityLog::record('admin_dashboard_viewed', $request->user(), $request, 'Admin viewed dashboard.');

        return response()->json([
            'counts' => $counts,
        ]);
    }
}
