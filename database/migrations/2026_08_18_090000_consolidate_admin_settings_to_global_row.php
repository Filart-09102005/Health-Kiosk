<?php

use App\Support\AdminSettings;
use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

/**
 * Admin thresholds were stored per administrator but read globally, so which
 * row took effect depended on database ordering. Collapse them into one global
 * row (user_id null) — the most recently updated wins, since that is the set an
 * admin last intended to be in force.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rows = Setting::query()
            ->where('key', AdminSettings::KEY)
            ->orderByDesc('updated_at')
            ->get();

        if ($rows->isEmpty()) {
            return;
        }

        $winner = $rows->first();
        $value = is_array($winner->value) ? $winner->value : [];

        if ($winner->user_id !== null) {
            $value['updated_by'] = $winner->user_id;
        }

        Setting::query()
            ->where('key', AdminSettings::KEY)
            ->whereNotNull('user_id')
            ->delete();

        Setting::updateOrCreate(
            ['user_id' => null, 'key' => AdminSettings::KEY],
            ['value' => $value],
        );
    }

    public function down(): void
    {
        // The per-admin rows cannot be reconstructed — they were merged away.
    }
};
