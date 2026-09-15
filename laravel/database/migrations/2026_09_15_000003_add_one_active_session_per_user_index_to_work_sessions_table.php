<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite の部分一意インデックス。ユーザーごとに未退勤(actual_end_at が NULL)の
        // work_sessions を同時に1件しか持てないようにし、DB層で二重出勤を防ぐ。
        DB::statement(
            'create unique index work_sessions_one_active_per_user
                on work_sessions (user_id)
                where actual_end_at is null'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('drop index if exists work_sessions_one_active_per_user');
    }
};
