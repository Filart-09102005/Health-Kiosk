<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Student-facing notifications.
 *
 * These used to be derived in the browser from whatever the dashboard happened
 * to be showing, with the read flag kept in sessionStorage. That made them
 * disposable: signing out threw the whole list away, and the unread badge
 * could not agree with itself between the bell and the notifications page.
 *
 * Storing them makes a notification a fact about a reading rather than a
 * redraw of the current screen — it survives a logout, and `read_at` is the
 * single answer to "has this been opened".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('health_record_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('kiosk_session_id')->nullable()->constrained()->nullOnDelete();

            // Which check produced it ("temp-high", "spo2-low", ...). Unique per
            // record, so re-saving the same reading updates the row instead of
            // stacking duplicates.
            $table->string('key', 40);
            $table->string('type', 30);
            $table->string('severity', 20)->default('alert');
            $table->string('title');
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'health_record_id', 'key'], 'user_notifications_record_key_unique');
            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
