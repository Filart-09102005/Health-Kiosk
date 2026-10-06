<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    protected $fillable = [
        'user_id',
        'kiosk_session_id',
        'type',
        'severity',
        'title',
        'message',
        'read_at',
        'new_measurement',
        'resolution_notes',
        'resolved_by',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kioskSession(): BelongsTo
    {
        return $this->belongsTo(KioskSession::class);
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * `new_measurement` is the admin's own free-text follow-up reading,
     * entered when resolving an alert - it used to also be stamped with the
     * boolean `true` when an alert was (re)created, which MySQL stores as
     * the literal string "1". Rows written before that was fixed display
     * that "1" here as if it were a real measurement value ("New
     * Measurement Value: 1"), which reads as meaningless/confusing to an
     * admin. This is presentation-only - the stored row is never touched.
     */
    public static function displayableManualMeasurement(?string $value): ?string
    {
        return in_array($value, ['1', 'true'], true) ? null : $value;
    }
}
