@extends('reports.pdf.layout')

@section('title', 'Recently Resolved Alerts')

@section('content')

    <div style="margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Resolved Cases Summary</h3>
        <p>This report contains all recently resolved health alerts, including the new measurements and resolution notes recorded by the clinic staff.</p>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Resolution Date</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Student</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Alert Type</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Original Measurement</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">New Measurement</th>
                <th style="background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; border: 1px solid #cbd5e1; padding: 8px;">Resolution Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $alert)
                @php
                    $original = 'N/A';
                    $type = strtolower($alert->type);
                    if (str_contains($type, 'temp')) {
                        $original = $alert->temperature ? round($alert->temperature, 1) . ' °C' : 'N/A';
                    } elseif (str_contains($type, 'spo2') || str_contains($type, 'oxygen')) {
                        $original = $alert->spo2 ? round($alert->spo2) . '%' : 'N/A';
                    } elseif (str_contains($type, 'heart') || str_contains($type, 'bpm')) {
                        $original = $alert->heart_rate ? round($alert->heart_rate) . ' bpm' : 'N/A';
                    } elseif (str_contains($type, 'bmi') || str_contains($type, 'weight')) {
                        $original = $alert->bmi ? number_format($alert->bmi, 1) : 'N/A';
                    }
                @endphp
                <tr>
                    <td style="width: 15%;">{{ \Carbon\Carbon::parse($alert->read_at)->format('M d, Y h:i A') }}</td>
                    <td style="width: 20%;">{{ $alert->full_name }}<br><small style="color:#64748b;">{{ $alert->student_id ?? 'N/A' }}</small></td>
                    <td style="width: 15%;">{{ ucfirst(str_replace('_', ' ', $alert->type)) }}</td>
                    <td style="width: 15%;">{{ $original }}</td>
                    <td style="width: 15%;">{{ $alert->new_measurement ?: 'N/A' }}</td>
                    <td style="width: 20%;">{{ $alert->resolution_notes ?: 'N/A' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

@endsection
