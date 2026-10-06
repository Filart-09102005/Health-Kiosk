@extends('reports.pdf.layout')

@section('title', 'Measurement Analytics Report')

@section('content')

    <div style="margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Measurement Summary</h3>
        <p>This report contains all health records submitted within the specified filters.</p>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Date / Time</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Student</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Department</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Temperature</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Heart Rate</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">SpO2</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">BMI</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $record)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($record->created_at)->format('M d, Y h:i A') }}</td>
                    <td>{{ $record->user->full_name ?? 'Unknown' }}<br><small style="color:#64748b;">{{ $record->user->student_id ?? 'N/A' }}</small></td>
                    <td>{{ $record->user->department === 'COLLEGE' ? 'COLLEGE (Students)' : ($record->user->department === 'BED' ? 'BED (Students)' : ($record->user->department ?? 'N/A')) }}<br><small style="color:#64748b;">{{ $record->user->program ?? $record->user->grade_level ?? '' }}</small></td>
                    <td>
                        <span style="background-color: {{ $record->temperature >= 37.8 || $record->temperature < 36.0 ? '#ef4444' : '#10b981' }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ $record->temperature }} &deg;C
                        </span>
                    </td>
                    <td>
                        <span style="background-color: {{ $record->heart_rate > 100 || $record->heart_rate < 60 ? '#ef4444' : '#10b981' }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ $record->heart_rate }} bpm
                        </span>
                    </td>
                    <td>
                        <span style="background-color: {{ $record->spo2 < 95 ? '#ef4444' : '#10b981' }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ $record->spo2 }} %
                        </span>
                    </td>
                    <td>
                        <span style="background-color: {{ in_array($record->bmi_category, ['Underweight', 'Overweight', 'Obese']) ? '#f59e0b' : '#10b981' }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ $record->bmi }}
                        </span>
                    </td>
                    <td>
                        <span style="background-color: {{ $record->health_status === 'Consult Clinic' ? '#ef4444' : ($record->health_status === 'Watch' ? '#f59e0b' : '#10b981') }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ $record->health_status }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

@endsection
