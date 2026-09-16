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
        // シフト(予定のみでactual_start_at/actual_end_atが共にNULL)を複数登録できるように、
        // 「未退勤」の判定を actual_start_at が入っている行だけに限定する。
        DB::statement('drop index if exists work_sessions_one_active_per_user');

        DB::statement(
            'create unique index work_sessions_one_active_per_user
                on work_sessions (user_id)
                where actual_start_at is not null and actual_end_at is null'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('drop index if exists work_sessions_one_active_per_user');

        DB::statement(
            'create unique index work_sessions_one_active_per_user
                on work_sessions (user_id)
                where actual_end_at is null'
        );
    }
};
