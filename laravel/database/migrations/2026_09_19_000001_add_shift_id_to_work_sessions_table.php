<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('work_sessions', 'shift_id')) {
            Schema::table('work_sessions', function (Blueprint $table) {
                $table->foreignId('shift_id')->nullable()->after('user_id')
                    ->constrained('work_sessions')->nullOnDelete();
            });
        }

        // SQLiteは外部キー制約の追加時にテーブルを再作成するため、
        // 部分ユニークインデックス(WHERE句)が条件なしのユニークインデックスに
        // 壊れてしまう。正しい条件で明示的に作り直す。
        DB::statement('drop index if exists work_sessions_one_active_per_user');
        DB::statement(
            'create unique index work_sessions_one_active_per_user
                on work_sessions (user_id)
                where actual_start_at is not null and actual_end_at is null'
        );
    }

    public function down(): void
    {
        Schema::table('work_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shift_id');
        });

        DB::statement('drop index if exists work_sessions_one_active_per_user');
        DB::statement(
            'create unique index work_sessions_one_active_per_user
                on work_sessions (user_id)
                where actual_start_at is not null and actual_end_at is null'
        );
    }
};
