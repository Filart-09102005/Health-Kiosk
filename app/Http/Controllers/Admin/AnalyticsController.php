<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\KioskSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'session_analytics' => $this->sessionAnalytics(),
            'peak_usage_hours' => $this->peakUsageHours(),
            'common_alerts' => $this->commonAlerts(),
            'heatmap' => $this->heatmap(),
        ]);
    }

    private function sessionAnalytics(): array
    {
        $completed = KioskSession::where('status', 'completed')->count();
        $active = KioskSession::where('status', 'active')->count();
        $incompleteRecords = HealthRecord::where('health_status', 'Incomplete')->count();

        return [
            ['name' => 'Completed', 'value' => $completed],
            ['name' => 'Incomplete', 'value' => $active + $incompleteRecords],
        ];
    }

    private function peakUsageHours(): array
    {
        return KioskSession::query()
            ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderByDesc('count')
            ->orderBy('hour')
            ->limit(5)
            ->get()
            ->sortBy('hour')
            ->values()
            ->map(fn ($row) => [
                'hour' => $this->formatHour((int) $row->hour),
                'count' => (int) $row->count,
            ])
            ->all();
    }

    private function commonAlerts(): array
    {
        $statusAlerts = HealthRecord::query()
            ->select('health_status', DB::raw('COUNT(*) as count'))
            ->whereNotIn('health_status', ['Normal', 'Incomplete'])
            ->groupBy('health_status')
            ->get()
            ->map(fn ($row) => [
                'alert' => $row->health_status,
                'count' => (int) $row->count,
            ]);

        $missingAlerts = HealthRecord::query()
            ->where('health_status', 'Incomplete')
            ->get()
            ->flatMap(fn (HealthRecord $record) => $record->missing_measurements ?: ['Incomplete Session'])
            ->countBy()
            ->map(fn ($count, $measurement) => [
                'alert' => 'Missing '.$this->labelMeasurement((string) $measurement),
                'count' => (int) $count,
            ])
            ->values();

        return $statusAlerts
            ->concat($missingAlerts)
            ->sortByDesc('count')
            ->take(5)
            ->values()
            ->all();
    }

    private function heatmap(): array
    {
        $dayLabels = [1 => 'Sun', 2 => 'Mon', 3 => 'Tue', 4 => 'Wed', 5 => 'Thu', 6 => 'Fri', 7 => 'Sat'];
        $hours = [7, 9, 11, 13, 15, 17, 19];
        $counts = KioskSession::query()
            ->selectRaw('DAYOFWEEK(created_at) as day, HOUR(created_at) as hour, COUNT(*) as count')
            ->whereIn(DB::raw('HOUR(created_at)'), $hours)
            ->groupBy('day', 'hour')
            ->get()
            ->mapWithKeys(fn ($row) => ["{$row->day}-{$row->hour}" => (int) $row->count]);

        return collect([2, 3, 4, 5, 6, 7, 1])
            ->map(fn ($day) => [
                'day' => $dayLabels[$day],
                'hours' => collect($hours)
                    ->map(fn ($hour) => $counts->get("{$day}-{$hour}", 0))
                    ->all(),
            ])
            ->all();
    }

    private function formatHour(int $hour): string
    {
        $suffix = $hour >= 12 ? 'PM' : 'AM';
        $displayHour = $hour % 12 ?: 12;

        return $displayHour.$suffix;
    }

    private function labelMeasurement(string $measurement): string
    {
        return str($measurement)->replace('_', ' ')->title()->toString();
    }
}
