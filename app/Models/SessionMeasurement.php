<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionMeasurement extends Model
{
    protected $fillable = [
        'kiosk_session_id',
        'user_id',
        'type',
        'value',
        'secondary_value',
        'unit',
        'attempt',
        'status',
        'input_source',
        'metadata',
        'measured_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'secondary_value' => 'decimal:2',
            'metadata' => 'array',
            'measured_at' => 'datetime',
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
