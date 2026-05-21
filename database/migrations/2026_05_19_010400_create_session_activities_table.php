<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kiosk_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['kiosk_session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_activities');
    }
};
