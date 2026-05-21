<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kiosk_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index();
            $table->decimal('value', 8, 2)->nullable();
            $table->decimal('secondary_value', 8, 2)->nullable();
            $table->string('unit', 20)->nullable();
            $table->unsignedInteger('attempt')->default(1);
            $table->string('status')->default('successful')->index();
            $table->json('metadata')->nullable();
            $table->timestamp('measured_at')->useCurrent()->index();
            $table->timestamps();

            $table->index(['kiosk_session_id', 'type', 'created_at']);
            $table->index(['user_id', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_measurements');
    }
};
