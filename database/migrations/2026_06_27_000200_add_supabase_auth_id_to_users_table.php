<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'supabase_auth_id')) {
                $table->char('supabase_auth_id', 36)->nullable()->after('supabase_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'supabase_auth_id')) {
                $table->dropColumn('supabase_auth_id');
            }
        });
    }
};
