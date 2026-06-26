<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\HealthRecordResource;
use App\Models\HealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    private const MEASUREMENT_KEYS = ['heart_rate', 'spo2', 'temperature', 'height', 'weight', 'bmi'];

    public function index(Request $request): JsonResponse|AnonymousResourceCollection
    {
        if ($request->boolean('dashboard_ready')) {
            return response()->json($this->dashboardReadyRecords());
        }

        $query = HealthRecord::query()
            ->with(['user:id,firstname,lastname,barcode,role,department', 'kioskSession:id,session_number,status,started_at'])
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
            $query->where('health_status', $status);
        }

        return HealthRecordResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    private function dashboardReadyRecords(): array
    {
        $records = HealthRecord::query()
            ->with([
                'user:id,firstname,lastname,student_id,barcode,role,department',
                'kioskSession.activities:id,kiosk_session_id,action,description,created_at',
            ])
            ->whereHas('user', fn ($query) => $query->where('role', '!=', 'admin'))
            ->latest()
            ->get();

        $recordsByUser = $records->groupBy('user_id');

        $historyByUser = $recordsByUser
            ->map(fn ($userRecords) => $userRecords->map(fn (HealthRecord $record) => $this->formatRecord($record, false))->values());

        $formattedRecords = $recordsByUser
            ->map(function ($userRecords) use ($historyByUser) {
                $record = $userRecords->first();
                $formatted = $this->formatRecord($record);
                $formatted['recordCount'] = $userRecords->count();
                $formatted['latestRecordedAt'] = $record->created_at?->timestamp ?? 0;
                $formatted['sessionHistory'] = $historyByUser->get($record->user_id, collect())
                    ->reject(fn ($session) => $session['id'] === $formatted['id'])
                    ->values();

                return $formatted;
            })
            ->sortByDesc('latestRecordedAt')
            ->map(function (array $record) {
                unset($record['latestRecordedAt']);

                return $record;
            })
            ->values();

        return [
            'records' => $formattedRecords,
            'stats' => $this->buildStats($records),
            'analytics' => $this->buildAnalytics($records),
        ];
    }

    private function formatRecord(HealthRecord $record, bool $withHistory = true): array
    {
        $session = $record->kioskSession;
        $missingMeasurements = $this->missingMeasurements($record);
        $measurementsTotal = count(self::MEASUREMENT_KEYS);
        $measurementsCompleted = max(0, $measurementsTotal - $missingMeasurements->count());
        $healthStatus = $this->formatHealthStatus($record->health_status);
        $sessionStatus = $this->formatSessionStatus($session?->status);

        $data = [
            'id' => $record->id,
            'schoolId' => $record->user?->student_id ?: $record->user?->barcode ?: 'N/A',
            'fullName' => $record->user?->full_name ?: 'Unknown user',
            'role' => ucfirst($record->user?->role ?: 'User'),
            'temperature' => $this->formatNumber($record->temperature),
            'heartRate' => $this->formatNumber($record->heart_rate, 0),
            'spo2' => $this->formatNumber($record->spo2, 0),
            'height' => $this->formatNumber($record->height, 0),
            'weight' => $this->formatNumber($record->weight, 0),
            'bmi' => $this->formatNumber($record->bmi),
            'healthStatus' => $healthStatus,
            'sessionStatus' => $sessionStatus,
            'recordedAt' => $record->created_at?->format('Y-m-d h:i A') ?: 'N/A',
            'department' => $record->user?->department ?: 'N/A',
            'sessionId' => $session?->session_number ? "SES-{$session->session_number}" : "REC-{$record->id}",
            'kiosk' => 'Health Kiosk',
            'measurementsCompleted' => $measurementsCompleted,
            'measurementsTotal' => $measurementsTotal,
            'missingMeasurements' => $missingMeasurements->values()->all(),
            'advice' => $record->advice ?: 'No advice recorded.',
            'timeline' => $this->formatTimeline($record),
        ];

        if ($withHistory) {
            $data['sessionHistory'] = [];
        }

        return $data;
    }

    private function buildStats($records): array
    {
        $total = $records->count();
        $completed = $records->filter(fn (HealthRecord $record) => $this->formatSessionStatus($record->kioskSession?->status) === 'Completed')->count();
        $incomplete = $records->filter(fn (HealthRecord $record) => $this->formatSessionStatus($record->kioskSession?->status) === 'Incomplete')->count();
        $alerts = $records->filter(fn (HealthRecord $record) => $this->formatHealthStatus($record->health_status) === 'Alert')->count();

        return [
            ['key' => 'total', 'label' => 'Total Records', 'value' => $total, 'change' => 0, 'trend' => 'neutral', 'icon' => 'records'],
            ['key' => 'completed', 'label' => 'Completed Records', 'value' => $completed, 'change' => 0, 'trend' => 'neutral', 'icon' => 'completed'],
            ['key' => 'incomplete', 'label' => 'Incomplete Records', 'value' => $incomplete, 'change' => 0, 'trend' => 'neutral', 'icon' => 'incomplete'],
            ['key' => 'alerts', 'label' => 'Alert Records', 'value' => $alerts, 'change' => 0, 'trend' => 'neutral', 'icon' => 'alerts'],
        ];
    }

    private function buildAnalytics($records): array
    {
        $healthStatus = collect(['Normal', 'Watch', 'Alert'])
            ->map(fn ($status) => [
                'name' => $status,
                'value' => $records->filter(fn (HealthRecord $record) => $this->formatHealthStatus($record->health_status) === $status)->count(),
            ])
            ->values();

        $totalMeasurements = max(1, $records->count() * count(self::MEASUREMENT_KEYS));
        $completedMeasurements = $records->sum(fn (HealthRecord $record) => count(self::MEASUREMENT_KEYS) - $this->missingMeasurements($record)->count());

        $incompleteMeasurements = collect(self::MEASUREMENT_KEYS)
            ->map(fn ($measurement) => [
                'label' => str($measurement)->replace('_', ' ')->title()->toString(),
                'count' => $records->filter(fn (HealthRecord $record) => $this->missingMeasurements($record)->contains($measurement))->count(),
            ])
            ->filter(fn ($item) => $item['count'] > 0)
            ->sortByDesc('count')
            ->take(3)
            ->values();

        return [
            'healthStatus' => $healthStatus,
            'measurementCompletion' => (int) round(($completedMeasurements / $totalMeasurements) * 100),
            'topAlerts' => $this->buildTopAlerts($records),
            'incompleteMeasurements' => $incompleteMeasurements,
        ];
    }

    private function buildTopAlerts($records)
    {
        return collect([
            'Elevated Temperature' => $records->filter(fn (HealthRecord $record) => (float) $record->temperature >= 37.5)->count(),
            'Low SpO2' => $records->filter(fn (HealthRecord $record) => (float) $record->spo2 > 0 && (float) $record->spo2 < 95)->count(),
            'High Heart Rate' => $records->filter(fn (HealthRecord $record) => (float) $record->heart_rate >= 100)->count(),
        ])
            ->map(fn ($count, $label) => ['label' => $label, 'count' => $count])
            ->filter(fn ($item) => $item['count'] > 0)
            ->sortByDesc('count')
            ->take(3)
            ->values();
    }

    private function formatTimeline(HealthRecord $record): array
    {
        $activities = $record->kioskSession?->activities ?? collect();

        if ($activities->isNotEmpty()) {
            return $activities
                ->sortBy('created_at')
                ->map(fn ($activity) => [
                    'time' => $activity->created_at?->format('h:i A') ?: '',
                    'label' => str($activity->action)->replace('_', ' ')->title()->toString(),
                    'detail' => $activity->description ?: 'Session activity recorded',
                ])
                ->values()
                ->all();
        }

        return [
            [
                'time' => $record->created_at?->format('h:i A') ?: '',
                'label' => 'Health Record Saved',
                'detail' => 'Kiosk screening data was saved to health records.',
            ],
        ];
    }

    private function formatHealthStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'normal' => 'Normal',
            'watch', 'needs review', 'needs_review' => 'Watch',
            'alert', 'high risk', 'high_risk' => 'Alert',
            default => 'Watch',
        };
    }

    private function missingMeasurements(HealthRecord $record)
    {
        return collect(self::MEASUREMENT_KEYS)
            ->filter(fn (string $key) => $record->{$key} === null || $record->{$key} === '')
            ->values();
    }

    private function formatSessionStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'completed' => 'Completed',
            'incomplete', 'cancelled', 'failed' => 'Incomplete',
            'active', 'in_progress', 'in progress', 'started' => 'In Progress',
            default => 'Incomplete',
        };
    }

    private function formatNumber($value, int $precision = 1): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        $number = (float) $value;

        return $precision === 0
            ? (string) (int) round($number)
            : number_format($number, $precision, '.', '');
    }
}
