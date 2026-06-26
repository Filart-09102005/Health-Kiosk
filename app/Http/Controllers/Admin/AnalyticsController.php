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
            'temperature_trend' => $this->vitalTrend('temperature', 1),
            'heart_rate_trend' => $this->vitalTrend('heart_rate', 0),
            'spo2_trend' => $this->vitalTrend('spo2', 1),
            'bmi_distribution' => $this->bmiDistribution(),
            'vital_trend_analytics' => [
                'weekly' => $this->vitalPeriodTrend('weekly'),
                'monthly' => $this->vitalPeriodTrend('monthly'),
                'yearly' => $this->vitalPeriodTrend('yearly'),
            ],
            'session_trend_analytics' => [
                'weekly' => $this->sessionPeriodTrend('weekly'),
                'monthly' => $this->sessionPeriodTrend('monthly'),
                'yearly' => $this->sessionPeriodTrend('yearly'),
            ],
            'peak_usage_hours' => $this->peakUsageHours(),
            'common_alerts' => $this->commonAlerts(),
            'heatmap' => $this->heatmap(),
        ]);
    }

    private function sessionAnalytics(): array
    {
        $completed = KioskSession::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->where('status', 'completed')->count();
        $incomplete = KioskSession::whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))->where('status', '!=', 'completed')->count();

        return [
            ['name' => 'Completed', 'value' => $completed],
            ['name' => 'Incomplete', 'value' => $incomplete],
        ];
    }

    private function vitalTrend(string $column, int $precision): array
    {
        $rows = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->whereNotNull($column)
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(created_at) as record_date, AVG('.$column.') as average_value')
            ->groupBy('record_date')
            ->pluck('average_value', 'record_date');

        return collect(range(6, 0))
            ->map(function ($daysAgo) use ($rows, $precision) {
                $date = now()->subDays($daysAgo);

                return [
                    'label' => $date->format('D'),
                    'value' => round((float) ($rows[$date->toDateString()] ?? 0), $precision),
                ];
            })
            ->values()
            ->all();
    }

    private function bmiDistribution(): array
    {
        $records = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->whereNotNull('bmi')
            ->get(['bmi']);

        return collect([
            'Underweight' => $records->filter(fn ($record) => (float) $record->bmi < 18.5)->count(),
            'Normal' => $records->filter(fn ($record) => (float) $record->bmi >= 18.5 && (float) $record->bmi < 25)->count(),
            'Overweight' => $records->filter(fn ($record) => (float) $record->bmi >= 25 && (float) $record->bmi < 30)->count(),
            'Obese' => $records->filter(fn ($record) => (float) $record->bmi >= 30)->count(),
        ])
            ->map(fn ($count, $range) => ['range' => $range, 'count' => $count])
            ->values()
            ->all();
    }

    private function vitalPeriodTrend(string $period): array
    {
        $days = $period === 'weekly' ? 6 : ($period === 'monthly' ? 29 : 364);
        $format = $period === 'yearly' ? '%Y-%m' : '%Y-%m-%d';
        $labelFormat = $period === 'yearly' ? 'M' : ($period === 'monthly' ? 'M d' : 'D');

        $rows = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->selectRaw("DATE_FORMAT(created_at, '{$format}') as bucket, AVG(heart_rate) as heartRate, AVG(spo2) as spo2, AVG(temperature) as temperature")
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $points = $period === 'yearly'
            ? collect(range(11, 0))->map(fn ($monthsAgo) => now()->subMonths($monthsAgo)->startOfMonth())
            : collect(range($days, 0))->map(fn ($daysAgo) => now()->subDays($daysAgo));

        return $points
            ->map(function ($date) use ($rows, $period, $labelFormat) {
                $bucket = $period === 'yearly' ? $date->format('Y-m') : $date->toDateString();
                $row = $rows->get($bucket);

                return [
                    'label' => $date->format($labelFormat),
                    'heartRate' => (int) round((float) ($row?->heartRate ?? 0)),
                    'spo2' => round((float) ($row?->spo2 ?? 0), 1),
                    'temperature' => round((float) ($row?->temperature ?? 0), 1),
                ];
            })
            ->values()
            ->all();
    }

    private function sessionPeriodTrend(string $period): array
    {
        $days = $period === 'weekly' ? 6 : ($period === 'monthly' ? 29 : 364);
        $format = $period === 'yearly' ? '%Y-%m' : '%Y-%m-%d';
        $labelFormat = $period === 'yearly' ? 'M' : ($period === 'monthly' ? 'M d' : 'D');

        $sessions = KioskSession::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->selectRaw("DATE_FORMAT(created_at, '{$format}') as bucket")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status <> 'completed' THEN 1 ELSE 0 END) as incomplete")
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $alerts = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->whereNotIn('health_status', ['Normal'])
            ->selectRaw("DATE_FORMAT(created_at, '{$format}') as bucket, COUNT(*) as alerts")
            ->groupBy('bucket')
            ->pluck('alerts', 'bucket');

        $points = $period === 'yearly'
            ? collect(range(11, 0))->map(fn ($monthsAgo) => now()->subMonths($monthsAgo)->startOfMonth())
            : collect(range($days, 0))->map(fn ($daysAgo) => now()->subDays($daysAgo));

        return $points
            ->map(function ($date) use ($sessions, $alerts, $period, $labelFormat) {
                $bucket = $period === 'yearly' ? $date->format('Y-m') : $date->toDateString();
                $row = $sessions->get($bucket);

                return [
                    'label' => $date->format($labelFormat),
                    'completed' => (int) ($row?->completed ?? 0),
                    'incomplete' => (int) ($row?->incomplete ?? 0),
                    'alerts' => (int) ($alerts[$bucket] ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function peakUsageHours(): array
    {
        return KioskSession::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
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
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->whereNotIn('health_status', ['Normal', 'Incomplete'])
            ->groupBy('health_status')
            ->get()
            ->map(fn ($row) => [
                'alert' => $row->health_status,
                'count' => (int) $row->count,
            ]);

        $missingAlerts = HealthRecord::query()
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
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
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
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
