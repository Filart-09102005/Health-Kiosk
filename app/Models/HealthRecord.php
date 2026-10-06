<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthRecord extends Model
{
    protected $fillable = [
        'supabase_id',
        'sync_status',
        'synced_at',
        'kiosk_session_id',
        'user_id',
        // Stamped at save time so a record keeps the level it was taken at.
        'academic_level',
        'school_year',
        // Was missing, so MeasurementService::store() passed it to
        // updateOrCreate() and mass-assignment protection dropped it silently —
        // every record on file has an empty skipped list as a result.
        'skipped_measurements',
        'heart_rate',
        'spo2',
        'temperature',
        'height',
        'weight',
        'bmi',
        'bmi_category',
        'health_status',
        'missing_measurements',
        'advice',
    ];

    protected function casts(): array
    {
        return [
            'heart_rate' => 'decimal:2',
            'spo2' => 'decimal:2',
            'temperature' => 'decimal:2',
            'height' => 'decimal:2',
            'weight' => 'decimal:2',
            'bmi' => 'decimal:2',
            'missing_measurements' => 'array',
            'skipped_measurements' => 'array',
            'sync_status' => 'integer',
            'synced_at' => 'datetime',
        ];
    }

    public function kioskSession(): BelongsTo
    {
        return $this->belongsTo(KioskSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
