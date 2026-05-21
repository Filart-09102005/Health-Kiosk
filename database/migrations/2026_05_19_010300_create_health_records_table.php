<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kiosk_session_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('heart_rate', 8, 2)->nullable();
            $table->decimal('spo2', 8, 2)->nullable();
            $table->decimal('temperature', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('bmi', 8, 2)->nullable();
            $table->string('bmi_category')->nullable();
            $table->string('health_status')->default('Incomplete')->index();
            $table->json('missing_measurements')->nullable();
            $table->text('advice')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'health_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
