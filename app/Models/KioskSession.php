<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class KioskSession extends Model
{
    protected $fillable = [
        'user_id',
        'session_number',
        'status',
        'started_at',
        'ended_at',
        'login_method',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(SessionMeasurement::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(SessionActivity::class);
    }

    public function healthRecord(): HasOne
    {
        return $this->hasOne(HealthRecord::class);
    }
}
