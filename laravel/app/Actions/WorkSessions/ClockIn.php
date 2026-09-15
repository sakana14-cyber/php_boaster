<?php

namespace App\Actions\WorkSessions;

use App\Models\User;
use App\Models\WorkSession;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ClockIn
{
    /**
     * ユーザーを出勤させ、勤務中の WorkSession を作成する。
     *
     * @throws RuntimeException 既に未退勤の勤務セッションがある場合
     */
    public function handle(User $user): WorkSession
    {
        return DB::transaction(function () use ($user) {
            $hasActiveSession = $user->workSessions()
                ->whereNull('actual_end_at')
                ->lockForUpdate()
                ->exists();

            if ($hasActiveSession) {
                throw new RuntimeException('既に出勤中です。');
            }

            return $user->workSessions()->create([
                'actual_start_at' => now(),
            ]);
        });
    }
}
