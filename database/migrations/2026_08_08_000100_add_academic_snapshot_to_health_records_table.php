<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Snapshots the student's academic level onto the record itself.
 *
 * Without this the level shown against a record comes from the account's
 * *current* level, so a Grade 7 check-up would relabel itself every year and
 * read "4th Year College" by the time they graduate. Stamping it at save time
 * keeps a record saying what it said on the day it was taken.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('health_records', function (Blueprint $table) {
            $table->string('academic_level')->nullable()->after('user_id');
            $table->string('school_year')->nullable()->after('academic_level');
        });
    }

    public function down(): void
    {
        Schema::table('health_records', function (Blueprint $table) {
            $table->dropColumn(['academic_level', 'school_year']);
        });
    }
};
