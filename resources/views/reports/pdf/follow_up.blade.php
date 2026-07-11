@extends('reports.pdf.layout')

@section('title', 'Students Requiring Follow-up')

@section('content')

    <div style="margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Follow-up Required</h3>
        <p>This report contains all active students who currently have unresolved (pending) health alerts requiring clinic intervention.</p>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Alert Date / Time</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Student</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Department</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Alert Type</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Message</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $alert)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($alert->created_at)->format('M d, Y h:i A') }}</td>
                    <td>{{ $alert->full_name }}<br><small style="color:#64748b;">{{ $alert->student_id ?? 'N/A' }}</small></td>
                    <td>{{ $alert->department === 'COLLEGE' ? 'COLLEGE (Students)' : ($alert->department === 'BED' ? 'BED (Students)' : ($alert->department ?? 'N/A')) }}<br><small style="color:#64748b;">{{ $alert->program ?? $alert->grade_level ?? '' }}</small></td>
                    <td>
                        <span style="background-color: #ef4444; color: #ffffff; padding: 3px 6px; font-weight: bold; border-radius: 4px; font-size: 10px; text-transform: uppercase;">{{ ucfirst(str_replace('_', ' ', $alert->type)) }}</span>
                    </td>
                    <td>{{ $alert->message }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

@endsection
