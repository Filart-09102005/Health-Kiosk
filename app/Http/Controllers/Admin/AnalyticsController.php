<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $records = $this->filteredRecords($request);
        $period = in_array($request->string('period')->toString(), ['weekly', 'monthly', 'yearly'], true)
            ? $request->string('period')->toString()
            : 'monthly';

        return response()->json([
            'filters' => $this->filterOptions(),
            'summary' => $this->summary($records),
            'bmi_distribution' => $this->bmiDistribution($records),
            'heart_rate_distribution' => $this->heartRateDistribution($records),
            'spo2_distribution' => $this->spo2Distribution($records),
            'temperature_distribution' => $this->temperatureDistribution($records),
            'academic_comparisons' => $this->academicComparisons($records),
            'academic_risk_breakdown' => $this->academicRiskBreakdown($records),
            'panel_insights' => $this->panelInsights($records),
            'health_status_summary' => $this->healthStatusSummary($records),
            'health_trends' => $this->healthTrends($records, $period),
            'follow_up_students' => $this->followUpStudents($request),
            'alert_analytics' => $this->alertAnalytics($request),
        ]);
    }

    private function filteredRecords(Request $request): Collection
    {
        return HealthRecord::query()
            ->with('user:id,firstname,lastname,student_id,role,department,grade_level,strand,year_level,program,gender')
            ->whereHas('user', function (Builder $query) use ($request) {
                $query->where('role', '!=', 'admin');

                $this->applyUserFilter($query, 'department', $request->input('academic_level'));
                $this->applyUserFilter($query, 'grade_level', $request->input('grade_level'));
                $this->applyUserFilter($query, 'strand', $request->input('strand'));
                $this->applyUserFilter($query, 'year_level', $request->input('year_level'));
                $this->applyUserFilter($query, 'program', $request->input('program'));
                $this->applyUserFilter($query, 'gender', $request->input('gender'));
            })
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('created_at', '<=', $request->date('date_to')))
            ->latest()
            ->get();
    }

    private function applyUserFilter(Builder $query, string $column, mixed $value): void
    {
        if (! filled($value)) {
            return;
        }

        if (is_array($value)) {
            $values = collect($value)->filter()->values();

            if ($values->isNotEmpty()) {
                $query->whereIn($column, $values);
            }

            return;
        }

        $query->where($column, $value);
    }

    private function filterOptions(): array
    {
        $base = User::query()->where('role', '!=', 'admin');

        return [
            'academic_levels' => $this->distinctValues($base, 'department'),
            'grade_levels' => $this->distinctValues($base, 'grade_level'),
            'strands' => $this->distinctValues($base, 'strand'),
            'year_levels' => $this->distinctValues($base, 'year_level'),
            'programs' => $this->distinctValues($base, 'program'),
            'genders' => $this->distinctValues($base, 'gender'),
            'sections' => Schema::hasColumn('users', 'section') ? $this->distinctValues($base, 'section') : [],
        ];
    }

    private function distinctValues(Builder $query, string $column): array
    {
        return (clone $query)
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->values()
            ->all();
    }

    private function summary(Collection $records): array
    {
        return [
            'total_students_measured' => $records->pluck('user_id')->unique()->count(),
            'average_bmi' => $this->average($records, 'bmi', 1),
            'average_heart_rate' => $this->average($records, 'heart_rate', 0),
            'average_spo2' => $this->average($records, 'spo2', 1),
            'average_temperature' => $this->average($records, 'temperature', 1),
        ];
    }

    private function bmiDistribution(Collection $records): array
    {
        return collect([
            ['name' => 'Underweight', 'records' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Underweight')],
            ['name' => 'Normal', 'records' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Normal')],
            ['name' => 'Overweight', 'records' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Overweight')],
            ['name' => 'Obese', 'records' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Obese')],
        ])->map(fn ($row) => $this->distributionRow($row['name'], $row['records'], $records->count(), 'bmi'))->all();
    }

    private function heartRateDistribution(Collection $records): array
    {
        return collect([
            ['name' => 'Low', 'records' => $records->filter(fn ($record) => filled($record->heart_rate) && (float) $record->heart_rate < 60)],
            ['name' => 'Normal', 'records' => $records->filter(fn ($record) => filled($record->heart_rate) && (float) $record->heart_rate >= 60 && (float) $record->heart_rate <= 100)],
            ['name' => 'High', 'records' => $records->filter(fn ($record) => filled($record->heart_rate) && (float) $record->heart_rate > 100)],
        ])->map(fn ($row) => $this->distributionRow($row['name'], $row['records'], $records->count(), 'heart_rate'))->all();
    }

    private function spo2Distribution(Collection $records): array
    {
        return collect([
            ['name' => 'Low SpO2', 'records' => $records->filter(fn ($record) => filled($record->spo2) && (float) $record->spo2 < 95)],
            ['name' => 'Normal', 'records' => $records->filter(fn ($record) => filled($record->spo2) && (float) $record->spo2 >= 95 && (float) $record->spo2 <= 100)],
            ['name' => 'High SpO2', 'records' => $records->filter(fn ($record) => filled($record->spo2) && (float) $record->spo2 > 100)],
        ])->map(fn ($row) => $this->distributionRow($row['name'], $row['records'], $records->count(), 'spo2'))->all();
    }

    private function temperatureDistribution(Collection $records): array
    {
        return collect([
            ['name' => 'Low Temperature', 'records' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature < 36)],
            ['name' => 'Normal', 'records' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature >= 36 && (float) $record->temperature < 37.3)],
            ['name' => 'Elevated', 'records' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature >= 37.3 && (float) $record->temperature < 38)],
            ['name' => 'High Temperature', 'records' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature >= 38)],
        ])->map(fn ($row) => $this->distributionRow($row['name'], $row['records'], $records->count(), 'temperature'))->all();
    }

    private function distributionRow(string $name, Collection $records, int $total, string $averageColumn): array
    {
        return [
            'name' => $name,
            'count' => $records->count(),
            'percentage' => $total > 0 ? round(($records->count() / $total) * 100, 1) : 0,
            'average' => $this->average($records, $averageColumn, $averageColumn === 'heart_rate' ? 0 : 1),
            'highest' => $this->maxValue($records, $averageColumn),
            'lowest' => $this->minValue($records, $averageColumn),
        ];
    }

    private function academicComparisons(Collection $records): array
    {
        return [
            'departments' => collect($this->compareByUserColumn($records, 'department'))
                ->reject(fn ($group) => in_array($group['label'], ['College Students', 'BED Students']))
                ->values()->all(),
            'grade_levels' => $this->compareByGradeAndStrand($records),
            'programs' => $this->compareByUserColumn($records, 'program'),
        ];
    }

    private function compareByGradeAndStrand(Collection $records): array
    {
        return $records
            ->filter(fn ($record) => filled($record->user?->grade_level))
            ->groupBy(function ($record) {
                $grade = $record->user->grade_level;
                $strand = $record->user->strand;
                if (in_array($grade, ['Grade 11', 'Grade 12'])) {
                    $year = str_replace('Grade ', '', $grade);
                    return filled($strand) ? "{$strand} {$year}" : $grade;
                }
                return $grade;
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'students' => $group->pluck('user_id')->unique()->count(),
                'average_bmi' => $this->average($group, 'bmi', 1),
                'average_heart_rate' => $this->average($group, 'heart_rate', 0),
                'average_spo2' => $this->average($group, 'spo2', 1),
                'average_temperature' => $this->average($group, 'temperature', 1),
            ])
            ->sortBy('label')
            ->values()
            ->all();
    }

    private function compareByUserColumn(Collection $records, string $column): array
    {
        return $records
            ->filter(fn ($record) => filled($record->user?->{$column}))
            ->groupBy(fn ($record) => $record->user->{$column})
            ->map(fn (Collection $group, string $label) => [
                'label' => $label === 'COLLEGE' ? 'College Students' : ($label === 'BED' ? 'BED Students' : $label),
                'students' => $group->pluck('user_id')->unique()->count(),
                'average_bmi' => $this->average($group, 'bmi', 1),
                'average_heart_rate' => $this->average($group, 'heart_rate', 0),
                'average_spo2' => $this->average($group, 'spo2', 1),
                'average_temperature' => $this->average($group, 'temperature', 1),
            ])
            ->sortBy('label')
            ->values()
            ->all();
    }

    private function academicRiskBreakdown(Collection $records): array
    {
        return [
            'departments' => collect($this->riskBreakdownByUserColumn($records, 'department'))
                ->reject(fn ($group) => in_array($group['label'], ['COLLEGE', 'BED']))
                ->values()->all(),
            'grade_levels' => $this->riskBreakdownByGradeAndStrand($records),
            'programs' => $this->riskBreakdownByUserColumn($records, 'program'),
        ];
    }

    private function riskBreakdownByGradeAndStrand(Collection $records): array
    {
        return $records
            ->filter(fn ($record) => filled($record->user?->grade_level))
            ->groupBy(function ($record) {
                $grade = $record->user->grade_level;
                $strand = $record->user->strand;
                if (in_array($grade, ['Grade 11', 'Grade 12'])) {
                    $year = str_replace('Grade ', '', $grade);
                    return filled($strand) ? "{$strand} {$year}" : $grade;
                }
                return $grade;
            })
            ->map(function (Collection $group, string $label) {
                return [
                    'label' => $label,
                    'total_students' => $group->pluck('user_id')->unique()->count(),
                    'total_records' => $group->count(),
                    'underweight' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Underweight')->count(),
                    'overweight' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Overweight')->count(),
                    'obese' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Obese')->count(),
                    'low_heart_rate' => $group->filter(fn ($record) => $this->heartRateStatus($record) === 'Low')->count(),
                    'high_heart_rate' => $group->filter(fn ($record) => $this->heartRateStatus($record) === 'High')->count(),
                    'low_spo2' => $group->filter(fn ($record) => $this->spo2Status($record) === 'Low Oxygen')->count(),
                    'high_spo2' => $group->filter(fn ($record) => $this->spo2Status($record) === 'High SpO2')->count(),
                    'low_temperature' => $group->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature < 36)->count(),
                    'elevated_temperature' => $group->filter(fn ($record) => $this->temperatureStatus($record) === 'Elevated')->count(),
                    'high_temperature' => $group->filter(fn ($record) => $this->temperatureStatus($record) === 'High Temperature')->count(),
                ];
            })
            ->sortBy('label')
            ->values()
            ->all();
    }

    private function panelInsights(Collection $records): array
    {
        $groups = [
            'Department' => collect($this->riskBreakdownByUserColumn($records, 'department'))
                ->reject(fn ($group) => in_array($group['label'], ['COLLEGE', 'BED']))
                ->values()->all(),
            'Program' => $this->riskBreakdownByUserColumn($records, 'program'),
            'Grade Level' => $this->riskBreakdownByGradeAndStrand($records),
        ];

        return collect([
            $this->topRiskInsight($groups, 'high_temperature', 'Most high temperature cases', 'high temperature readings'),
            $this->topRiskInsight($groups, 'obese', 'Most obesity cases', 'BMI obesity classifications'),
            $this->topRiskInsight($groups, 'low_spo2', 'Most low oxygen cases', 'SpO2 readings below normal'),
            $this->topRiskInsight($groups, 'high_spo2', 'Most high SpO2 cases', 'SpO2 readings above valid range'),
            $this->topRiskInsight($groups, 'high_heart_rate', 'Most high heart-rate cases', 'pulse readings above normal'),
            $this->topRiskInsight($groups, 'low_temperature', 'Most low temperature cases', 'low temperature readings'),
            $this->topRiskInsight($groups, 'elevated_temperature', 'Most elevated temperature cases', 'body temperature watch readings'),
            $this->topRiskInsight($groups, 'underweight', 'Most underweight cases', 'BMI underweight classifications'),
        ])
            ->filter()
            ->values()
            ->all();
    }

    private function topRiskInsight(array $groups, string $key, string $title, string $description): ?array
    {
        $rankings = collect($groups)
            ->flatMap(fn (array $rows, string $groupType) => collect($rows)->map(fn (array $row) => [
                'group_type' => $groupType,
                'label' => $row['label'],
                'count' => (int) ($row[$key] ?? 0),
                'students' => (int) ($row['total_students'] ?? 0),
                'records' => (int) ($row['total_records'] ?? 0),
            ]))
            ->filter(fn (array $row) => $row['count'] > 0)
            ->sortByDesc('count')
            ->values();

        $top = $rankings->first();

        if (! $top) {
            return null;
        }

        return [
            'key' => $key,
            'title' => $title,
            'group_type' => $top['group_type'],
            'label' => $top['label'],
            'count' => $top['count'],
            'students' => $top['students'],
            'detail' => "{$top['group_type']} {$top['label']} has {$top['count']} {$description} in the selected records.",
            'rankings' => $rankings->take(8)->all(),
        ];
    }

    private function riskBreakdownByUserColumn(Collection $records, string $column): array
    {
        return $records
            ->filter(fn ($record) => filled($record->user?->{$column}))
            ->groupBy(fn ($record) => $record->user->{$column})
            ->map(function (Collection $group, string $label) {
                return [
                    'label' => $label,
                    'total_students' => $group->pluck('user_id')->unique()->count(),
                    'total_records' => $group->count(),
                    'underweight' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Underweight')->count(),
                    'overweight' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Overweight')->count(),
                    'obese' => $group->filter(fn ($record) => $this->bmiStatus($record) === 'Obese')->count(),
                    'low_heart_rate' => $group->filter(fn ($record) => $this->heartRateStatus($record) === 'Low')->count(),
                    'high_heart_rate' => $group->filter(fn ($record) => $this->heartRateStatus($record) === 'High')->count(),
                    'low_spo2' => $group->filter(fn ($record) => $this->spo2Status($record) === 'Low Oxygen')->count(),
                    'high_spo2' => $group->filter(fn ($record) => $this->spo2Status($record) === 'High SpO2')->count(),
                    'low_temperature' => $group->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature < 36)->count(),
                    'elevated_temperature' => $group->filter(fn ($record) => $this->temperatureStatus($record) === 'Elevated')->count(),
                    'high_temperature' => $group->filter(fn ($record) => $this->temperatureStatus($record) === 'High Temperature')->count(),
                ];
            })
            ->sortBy('label')
            ->values()
            ->all();
    }

    private function healthStatusSummary(Collection $records): array
    {
        return [
            ['key' => 'underweight', 'label' => 'Underweight Cases', 'count' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Underweight')->count()],
            ['key' => 'overweight', 'label' => 'Overweight Cases', 'count' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Overweight')->count()],
            ['key' => 'obese', 'label' => 'Obese Cases', 'count' => $records->filter(fn ($record) => $this->bmiStatus($record) === 'Obese')->count()],
            ['key' => 'low_heart_rate', 'label' => 'Low Heart Rate Cases', 'count' => $records->filter(fn ($record) => filled($record->heart_rate) && (float) $record->heart_rate < 60)->count()],
            ['key' => 'high_heart_rate', 'label' => 'High Heart Rate Cases', 'count' => $records->filter(fn ($record) => filled($record->heart_rate) && (float) $record->heart_rate > 100)->count()],
            ['key' => 'low_spo2', 'label' => 'Low SpO2 Cases', 'count' => $records->filter(fn ($record) => filled($record->spo2) && (float) $record->spo2 < 95)->count()],
            ['key' => 'high_spo2', 'label' => 'High SpO2 Cases', 'count' => $records->filter(fn ($record) => filled($record->spo2) && (float) $record->spo2 > 100)->count()],
            ['key' => 'low_temperature', 'label' => 'Low Temperature Cases', 'count' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature < 36)->count()],
            ['key' => 'high_temperature', 'label' => 'High Temperature Cases', 'count' => $records->filter(fn ($record) => filled($record->temperature) && (float) $record->temperature >= 38)->count()],
        ];
    }

    private function healthTrends(Collection $records, string $period): array
    {
        if ($period === 'weekly') {
            return $records
                ->groupBy(fn ($record) => $record->created_at->format('N'))
                ->sortKeys()
                ->map(fn (Collection $group, string $dayNumber) => [
                    'label' => $this->weekdayLabel((int) $dayNumber),
                    'date_key' => $dayNumber,
                    'average_bmi' => $this->average($group, 'bmi', 1),
                    'average_heart_rate' => $this->average($group, 'heart_rate', 0),
                    'average_spo2' => $this->average($group, 'spo2', 1),
                    'average_temperature' => $this->average($group, 'temperature', 1),
                ])
                ->values()
                ->all();
        }

        $format = match ($period) {
            'yearly' => 'Y-m',
            default => 'Y-m-d',
        };

        return $records
            ->groupBy(fn ($record) => $record->created_at->format($format))
            ->sortKeys()
            ->map(fn (Collection $group, string $key) => [
                'label' => $this->trendLabel($group->first()->created_at, $period),
                'date_key' => $key,
                'average_bmi' => $this->average($group, 'bmi', 1),
                'average_heart_rate' => $this->average($group, 'heart_rate', 0),
                'average_spo2' => $this->average($group, 'spo2', 1),
                'average_temperature' => $this->average($group, 'temperature', 1),
            ])
            ->values()
            ->all();
    }

    private function trendLabel($date, string $period): string
    {
        return match ($period) {
            'yearly' => $date->format('M'),
            default => $date->format('M j'),
        };
    }

    private function weekdayLabel(int $dayNumber): string
    {
        return [
            1 => 'Mon',
            2 => 'Tue',
            3 => 'Wed',
            4 => 'Thu',
            5 => 'Fri',
            6 => 'Sat',
            7 => 'Sun',
        ][$dayNumber] ?? 'N/A';
    }

    private function followUpStudents(Request $request): array
    {
        $pendingAlerts = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->leftJoin('kiosk_sessions', 'alerts.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->leftJoin('health_records', 'health_records.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->whereNull('alerts.read_at')
            ->whereNotNull('alerts.user_id')
            ->where('users.role', '!=', 'admin')
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('alerts.created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('alerts.created_at', '<=', $request->date('date_to')))
            ->when($request->filled('academic_level'), fn ($q) => $q->where('users.department', $request->input('academic_level')))
            ->when($request->filled('grade_level'), fn ($q) => $q->where('users.grade_level', $request->input('grade_level')))
            ->when($request->filled('strand'), fn ($q) => $q->where('users.strand', $request->input('strand')))
            ->when($request->filled('year_level'), fn ($q) => $q->where('users.year_level', $request->input('year_level')))
            ->when($request->filled('program'), fn ($q) => $q->where('users.program', $request->input('program')))
            ->when($request->filled('gender'), fn ($q) => $q->where('users.gender', $request->input('gender')))
            ->select([
                'alerts.type as alert_type',
                'alerts.created_at as alert_created_at',
                'users.id as user_id',
                'users.student_id',
                'users.firstname',
                'users.lastname',
                'users.department',
                'users.grade_level',
                'users.strand',
                'users.year_level',
                'users.program',
                'health_records.bmi',
                'health_records.heart_rate',
                'health_records.spo2',
                'health_records.temperature',
            ])
            ->orderBy('alerts.created_at', 'desc')
            ->get();

        $grouped = $pendingAlerts->groupBy('user_id');

        return $grouped->map(function (Collection $alerts) {
            $user = $alerts->first();

            $bmiStatus = '—';
            $heartRateStatus = '—';
            $spo2Status = '—';
            $temperatureStatus = '—';

            foreach ($alerts as $alert) {
                $category = $this->categorizeAlertType($alert->alert_type);
                
                $tempRecord = new HealthRecord();
                $tempRecord->bmi = $alert->bmi;
                $tempRecord->heart_rate = $alert->heart_rate;
                $tempRecord->spo2 = $alert->spo2;
                $tempRecord->temperature = $alert->temperature;

                if ($category === 'bmi' && $bmiStatus === '—') {
                    $bmiStatus = $this->bmiStatus($tempRecord);
                } elseif ($category === 'heart_rate' && $heartRateStatus === '—') {
                    $heartRateStatus = $this->heartRateStatus($tempRecord);
                } elseif ($category === 'spo2' && $spo2Status === '—') {
                    $spo2Status = $this->spo2Status($tempRecord);
                } elseif ($category === 'temperature' && $temperatureStatus === '—') {
                    $temperatureStatus = $this->temperatureStatus($tempRecord);
                }
            }

            $userModel = new User([
                'department' => $user->department,
                'grade_level' => $user->grade_level,
                'strand' => $user->strand,
                'year_level' => $user->year_level,
                'program' => $user->program,
            ]);

            return [
                'student_id'           => $user->student_id,
                'name'                 => trim(($user->firstname ?: '') . ' ' . ($user->lastname ?: '')),
                'academic_information' => $this->academicInformation($userModel),
                'bmi_status'           => $bmiStatus === '—' ? 'Normal' : $bmiStatus,
                'heart_rate_status'    => $heartRateStatus === '—' ? 'Normal' : $heartRateStatus,
                'spo2_status'          => $spo2Status === '—' ? 'Normal' : $spo2Status,
                'temperature_status'   => $temperatureStatus === '—' ? 'Normal' : $temperatureStatus,
                'date_measured'        => \Carbon\Carbon::parse($user->alert_created_at)->format('M d, Y h:i A'),
            ];
        })->take(25)->values()->all();
    }

    private function categorizeAlertType(string $type): string
    {
        return match (true) {
            str_contains($type, 'temperature') => 'temperature',
            str_contains($type, 'heart_rate') => 'heart_rate',
            str_contains($type, 'spo2') => 'spo2',
            str_contains($type, 'bmi') => 'bmi',
            default => 'other',
        };
    }

    private function academicInformation(?User $user): string
    {
        if (! $user) {
            return 'Not available';
        }

        return collect([$user->department, $user->grade_level, $user->strand, $user->year_level, $user->program])
            ->filter()
            ->join(' · ') ?: 'Not specified';
    }

    private function bmiStatus(HealthRecord $record): string
    {
        if (! filled($record->bmi)) {
            return 'No Data';
        }

        $bmi = (float) $record->bmi;

        return match (true) {
            $bmi < 18.5 => 'Underweight',
            $bmi < 25 => 'Normal',
            $bmi < 30 => 'Overweight',
            default => 'Obese',
        };
    }

    private function heartRateStatus(HealthRecord $record): string
    {
        if (! filled($record->heart_rate)) {
            return 'No Data';
        }

        $heartRate = (float) $record->heart_rate;

        return match (true) {
            $heartRate < 60 => 'Low',
            $heartRate > 100 => 'High',
            default => 'Normal',
        };
    }

    private function spo2Status(HealthRecord $record): string
    {
        if (! filled($record->spo2)) {
            return 'No Data';
        }

        $spo2 = (float) $record->spo2;

        return match (true) {
            $spo2 < 95 => 'Low Oxygen',
            $spo2 > 100 => 'High SpO2',
            default => 'Normal',
        };
    }

    private function temperatureStatus(HealthRecord $record): string
    {
        if (! filled($record->temperature)) {
            return 'No Data';
        }

        $temperature = (float) $record->temperature;

        return match (true) {
            $temperature >= 38 => 'High Temperature',
            $temperature >= 37.3 => 'Elevated',
            $temperature < 36 => 'Low Temperature',
            default => 'Normal',
        };
    }

    private function average(Collection $records, string $column, int $precision = 1): float
    {
        $values = $records->pluck($column)->filter(fn ($value) => filled($value));

        return $values->isEmpty() ? 0 : round((float) $values->avg(), $precision);
    }

    private function maxValue(Collection $records, string $column): float
    {
        $values = $records->pluck($column)->filter(fn ($value) => filled($value));

        return $values->isEmpty() ? 0 : round((float) $values->max(), 1);
    }

    private function minValue(Collection $records, string $column): float
    {
        $values = $records->pluck($column)->filter(fn ($value) => filled($value));

        return $values->isEmpty() ? 0 : round((float) $values->min(), 1);
    }

    private function alertAnalytics(Request $request): array
    {
        $alerts = DB::table('alerts')
            ->leftJoin('users', 'alerts.user_id', '=', 'users.id')
            ->leftJoin('users as resolver', 'alerts.resolved_by', '=', 'resolver.id')
            ->leftJoin('kiosk_sessions', 'alerts.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->leftJoin('health_records', 'health_records.kiosk_session_id', '=', 'kiosk_sessions.id')
            ->select([
                'alerts.id',
                'alerts.type',
                'alerts.severity',
                'alerts.title',
                'alerts.message',
                'alerts.read_at',
                'alerts.new_measurement',
                'alerts.resolution_notes',
                'alerts.created_at',
                'users.firstname',
                'users.lastname',
                'users.student_id',
                'users.barcode',
                'users.role',
                'users.department',
                'users.grade_level',
                'users.strand',
                'users.year_level',
                'users.program',
                'users.gender',
                'resolver.firstname as resolver_firstname',
                'resolver.lastname as resolver_lastname',
                'kiosk_sessions.status as session_status',
                'health_records.temperature',
                'health_records.heart_rate',
                'health_records.spo2',
                'health_records.bmi',
            ])
            ->whereNotNull('alerts.user_id')
            ->where('users.role', '!=', 'admin')
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('alerts.created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('alerts.created_at', '<=', $request->date('date_to')))
            ->when($request->filled('academic_level'), fn ($q) => $q->where('users.department', $request->input('academic_level')))
            ->when($request->filled('grade_level'), fn ($q) => $q->where('users.grade_level', $request->input('grade_level')))
            ->when($request->filled('strand'), fn ($q) => $q->where('users.strand', $request->input('strand')))
            ->when($request->filled('year_level'), fn ($q) => $q->where('users.year_level', $request->input('year_level')))
            ->when($request->filled('program'), fn ($q) => $q->where('users.program', $request->input('program')))
            ->when($request->filled('gender'), fn ($q) => $q->where('users.gender', $request->input('gender')))
            ->orderByDesc('alerts.created_at')
            ->get();

        $total    = $alerts->count();
        $resolved = $alerts->filter(fn ($a) => ! is_null($a->read_at))->count();
        $pending  = $total - $resolved;
        $rate     = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;

        $typeGroups = [
            'temperature' => ['label' => 'Temperature', 'types' => ['temperature', 'high_temperature', 'low_temperature']],
            'heart_rate'  => ['label' => 'Heart Rate',  'types' => ['heart_rate', 'high_heart_rate', 'low_heart_rate']],
            'spo2'        => ['label' => 'SpO2',        'types' => ['spo2', 'low_spo2', 'high_spo2']],
            'bmi'         => ['label' => 'BMI',         'types' => ['bmi', 'high_bmi', 'low_bmi']],
        ];

        $distribution = [];
        $drillDown    = [];

        foreach ($typeGroups as $key => $config) {
            $group         = $alerts->filter(fn ($a) => in_array($a->type, $config['types']));
            $groupTotal    = $group->count();
            $groupResolved = $group->filter(fn ($a) => ! is_null($a->read_at))->count();
            $groupPending  = $groupTotal - $groupResolved;
            $recoveryRate  = $groupTotal > 0 ? round(($groupResolved / $groupTotal) * 100, 1) : 0;

            $distribution[] = [
                'key'           => $key,
                'label'         => $config['label'],
                'total'         => $groupTotal,
                'resolved'      => $groupResolved,
                'pending'       => $groupPending,
                'recovery_rate' => $recoveryRate,
            ];

            $drillDown[$key] = $group
                ->map(fn ($alert) => $this->formatAlertForAnalytics($alert))
                ->values()
                ->all();
        }

        $recentResolved = $alerts
            ->filter(fn ($a) => ! is_null($a->read_at))
            ->take(20)
            ->map(fn ($alert) => $this->formatAlertForAnalytics($alert))
            ->values()
            ->all();

        return [
            'overview'        => ['total' => $total, 'resolved' => $resolved, 'pending' => $pending, 'resolution_rate' => $rate],
            'distribution'    => $distribution,
            'drill_down'      => $drillDown,
            'recent_resolved' => $recentResolved,
        ];
    }

    private function formatAlertForAnalytics(object $alert): array
    {
        return [
            'id'              => 'ALT-'.$alert->id,
            'schoolId'        => $alert->student_id ?: $alert->barcode ?: 'N/A',
            'fullName'        => trim(($alert->firstname ?: '').' '.($alert->lastname ?: '')) ?: 'Unknown',
            'role'            => ucfirst($alert->role ?: 'student'),
            'alertType'       => $alert->title ?: ucwords(str_replace('_', ' ', $alert->type)),
            'measurementValue' => $this->originalMeasurementFromRecord($alert),
            'severity'        => ucfirst($alert->severity ?: 'low'),
            'status'          => $alert->read_at ? 'Resolved' : 'Pending',
            'sessionStatus'   => ucfirst($alert->session_status ?: 'completed'),
            'triggeredAt'     => $alert->created_at ? date('M d, Y h:i A', strtotime($alert->created_at)) : 'N/A',
            'reviewedBy'      => $alert->read_at
                ? (trim(($alert->resolver_firstname ?: '').' '.($alert->resolver_lastname ?: '')) ?: 'Clinic Admin')
                : 'Unassigned',
            'department'      => $alert->department === 'COLLEGE' ? 'COLLEGE (Students)' : ($alert->department === 'BED' ? 'BED (Students)' : ($alert->department ?: 'N/A')),
            'heartRate'       => $alert->heart_rate ? round((float) $alert->heart_rate).' bpm' : 'N/A',
            'spo2'            => $alert->spo2 ? round((float) $alert->spo2).'%' : 'N/A',
            'bmi'             => $alert->bmi ? number_format((float) $alert->bmi, 1) : 'N/A',
            'advice'          => $alert->message ?: 'Clinic review recommended.',
            'newMeasurement'  => $alert->new_measurement,
            'resolutionNotes' => $alert->resolution_notes,
            'type'            => $alert->type,
        ];
    }

    private function originalMeasurementFromRecord(object $alert): string
    {
        return match ($alert->type) {
            'temperature', 'high_temperature', 'low_temperature' => $alert->temperature ? number_format((float) $alert->temperature, 1).' °C' : 'N/A',
            'spo2', 'low_spo2', 'high_spo2'                      => $alert->spo2 ? round((float) $alert->spo2).'%' : 'N/A',
            'heart_rate', 'high_heart_rate', 'low_heart_rate'    => $alert->heart_rate ? round((float) $alert->heart_rate).' bpm' : 'N/A',
            'bmi', 'high_bmi', 'low_bmi'                         => $alert->bmi ? number_format((float) $alert->bmi, 1) : 'N/A',
            default                                               => 'N/A',
        };
    }
}
