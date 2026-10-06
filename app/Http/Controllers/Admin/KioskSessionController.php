<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\KioskSessionResource;
use App\Models\KioskSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class KioskSessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = KioskSession::query()
            ->with(['user:id,firstname,lastname,student_id,barcode,role,department', 'healthRecord', 'activities'])
            ->whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
            ->latest();

        if ($search = $request->string('search')->trim()->value()) {
            $query->whereHas('user', function ($userQuery) use ($search) {
                $userQuery
                    ->where('firstname', 'like', "%{$search}%")
                    ->orWhere('lastname', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('status', $status);
        }

        $today = now()->startOfDay();

        $metrics = [
            'total_today' => KioskSession::whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
                ->whereDate('started_at', $today)->count(),
            'completed_today' => KioskSession::whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
                ->whereDate('started_at', $today)->where('status', 'completed')->count(),
            'incomplete_today' => KioskSession::whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
                ->whereDate('started_at', $today)->where('status', '!=', 'completed')->count(),
        ];

        $completedSessionsToday = KioskSession::whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
            ->whereDate('started_at', $today)
            ->where('status', 'completed')
            ->whereNotNull('ended_at')
            ->get();

        $totalMinutes = $completedSessionsToday->sum(fn ($session) => $session->started_at->diffInMinutes($session->ended_at));
        $metrics['avg_duration_today'] = $completedSessionsToday->count() > 0 
            ? round($totalMinutes / $completedSessionsToday->count()) . ' min'
            : '0 min';

        return KioskSessionResource::collection($query->paginate(min($request->integer('per_page', 15), 100)))
            ->additional(['metrics' => $metrics]);
    }
}
