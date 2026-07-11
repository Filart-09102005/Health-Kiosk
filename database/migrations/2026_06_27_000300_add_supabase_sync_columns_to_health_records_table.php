<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('health_records', function (Blueprint $table) {
            if (! Schema::hasColumn('health_records', 'supabase_id')) {
                $table->char('supabase_id', 36)->nullable()->after('id');
            }

            if (! Schema::hasColumn('health_records', 'sync_status')) {
                $table->unsignedTinyInteger('sync_status')->default(0)->after('supabase_id');
            }

            if (! Schema::hasColumn('health_records', 'synced_at')) {
                $table->timestamp('synced_at')->nullable()->after('sync_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('health_records', function (Blueprint $table) {
            $columns = collect(['supabase_id', 'sync_status', 'synced_at'])
                ->filter(fn ($column) => Schema::hasColumn('health_records', $column))
                ->values()
                ->all();

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
