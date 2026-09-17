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
                ->whereNotNull('actual_start_at')
                ->whereNull('actual_end_at')
                ->lockForUpdate()
                ->exists();

            if ($hasActiveSession) {
                throw new RuntimeException('既に出勤中です。');
            }

            $todaysShift = $user->workSessions()
                ->whereNull('actual_start_at')
                ->whereDate('scheduled_start_at', today())
                ->orderBy('scheduled_start_at')
                ->lockForUpdate()
                ->first();

            if ($todaysShift) {
                $todaysShift->update(['actual_start_at' => now()]);

                return $todaysShift;
            }

            // 2回目以降の出勤。現在時刻が予定時間内に重なる予定(シフト)があれば、
            // その予定を shift_id で参照させ、実績側で予定時刻を引き継げるようにする。
            $overlappingShift = $user->workSessions()
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
                'shift_id' => $overlappingShift?->id,
            ]);
        });
    }
}
