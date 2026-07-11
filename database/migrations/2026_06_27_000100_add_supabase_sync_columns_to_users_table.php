<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'supabase_id')) {
                $table->char('supabase_id', 36)->nullable()->after('is_active');
            }

            if (! Schema::hasColumn('users', 'sync_status')) {
                $table->unsignedTinyInteger('sync_status')->default(0)->after('supabase_id');
            }

            if (! Schema::hasColumn('users', 'synced_at')) {
                $table->timestamp('synced_at')->nullable()->after('sync_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = collect(['supabase_id', 'sync_status', 'synced_at'])
                ->filter(fn ($column) => Schema::hasColumn('users', $column))
                ->values()
                ->all();

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
