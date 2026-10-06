<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_measurements', function (Blueprint $table) {
            // 'smart'  — acquired from a connected kiosk sensor
            // 'manual' — typed in from an external medical device
            //
            // Every existing row predates Manual Mode, so the 'smart' default
            // backfills them correctly with no separate data migration.
            $table->string('input_source', 10)
                ->default('smart')
                ->after('status')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('session_measurements', function (Blueprint $table) {
            $table->dropIndex(['input_source']);
            $table->dropColumn('input_source');
        });
    }
};
