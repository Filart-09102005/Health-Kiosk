<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('grade_level')->nullable()->after('department');
            $table->string('strand')->nullable()->after('grade_level');
            $table->string('year_level')->nullable()->after('strand');
            $table->string('program')->nullable()->after('year_level');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'grade_level',
                'strand',
                'year_level',
                'program',
            ]);
        });
    }
};
