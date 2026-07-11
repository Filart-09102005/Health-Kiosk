@extends('reports.pdf.layout')

@section('title', 'Alert Analytics Report')

@section('content')

    <div style="margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Alert Summary</h3>
        <p>This report contains all health alerts (both pending and resolved) generated within the specified filters.</p>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Date / Time</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Student</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Department</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Alert Type</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Severity</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Status</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Resolution Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $alert)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($alert->created_at)->format('M d, Y h:i A') }}</td>
                    <td>{{ $alert->full_name }}<br><small style="color:#64748b;">{{ $alert->student_id ?? 'N/A' }}</small></td>
                    <td>{{ $alert->department === 'COLLEGE' ? 'COLLEGE (Students)' : ($alert->department === 'BED' ? 'BED (Students)' : ($alert->department ?? 'N/A')) }}<br><small style="color:#64748b;">{{ $alert->program ?? $alert->grade_level ?? '' }}</small></td>
                    <td>{{ ucfirst(str_replace('_', ' ', $alert->type)) }}</td>
                    <td>
                        <span style="background-color: {{ $alert->severity === 'high' ? '#ef4444' : '#f59e0b' }}; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                            {{ ucfirst($alert->severity) }}
                        </span>
                    </td>
                    <td>
                        @if($alert->read_at)
                            <span style="background-color: #10b981; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">Resolved</span>
                        @else
                            <span style="background-color: #f59e0b; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">Pending</span>
                        @endif
                    </td>
                    <td>
                        @if($alert->read_at)
                            {{ \Carbon\Carbon::parse($alert->read_at)->format('M d, Y h:i A') }}
                        @else
                            <span style="color:#94a3b8;">N/A</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

@endsection
