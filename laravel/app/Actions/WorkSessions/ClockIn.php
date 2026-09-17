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
     * 予定(シフト)行自体には決して actual_* を書き込まず、出勤の度に
     * 新しい実績行を作成して shift_id で予定に紐付ける。これにより
     * 「予定は常に1行、出勤実績は複数行」という関係を保つ。
     *
     * @throws RuntimeException 既に未退勤の勤務セッションがある場合
     */
    public function handle(User $user): WorkSession
    {
        return DB::transaction(function () use ($user) {
            $hasActiveSession = $user->workSessions()
                ->whereNotNull('actual_start_at')
                ->whereNull('actual_end_at')
                ->lockForUpdate()
                ->exists();

            if ($hasActiveSession) {
                throw new RuntimeException('既に出勤中です。');
            }

            // 1. 今日の予定のうち、まだ一度も出勤実績がないものを優先して紐付ける
            //   (予定時刻の前後にずれて出勤しても紐付く)
            $shift = $user->workSessions()
                ->whereNull('shift_id')
                ->whereNotNull('scheduled_start_at')
                ->whereDate('scheduled_start_at', today())
                ->whereDoesntHave('attendances')
                ->orderBy('scheduled_start_at')
                ->lockForUpdate()
                ->first();

            // 2. なければ、現在時刻が予定時間内に重なる予定を探す(2回目以降の出勤)
            $shift ??= $user->workSessions()
                ->whereNull('shift_id')
                ->whereNotNull('scheduled_start_at')
                ->whereNotNull('scheduled_end_at')
                ->where('scheduled_start_at', '<=', now())
                ->where('scheduled_end_at', '>', now())
                ->orderBy('scheduled_start_at')
                ->lockForUpdate()
                ->first();

            return $user->workSessions()->create([
                'actual_start_at' => now(),
                'shift_id' => $shift?->id,
            ]);
        });
    }
}
