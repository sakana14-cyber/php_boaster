<?php

namespace App\Actions\WorkSessions;

use App\Models\WorkSession;
use App\Services\SalaryCalculator;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ClockOut
{
    public function __construct(
        private readonly SalaryCalculator $salaryCalculator,
    ) {}

    /**
     * 対象の勤務セッションを退勤させ、確定給与を計算・保存する。
     *
     * @throws RuntimeException 既に退勤済みの場合
     */
    public function handle(WorkSession $workSession): WorkSession
    {
        return DB::transaction(function () use ($workSession) {
            $workSession = WorkSession::query()
                ->whereKey($workSession->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($workSession->actual_end_at !== null) {
                throw new RuntimeException('既に退勤済みです。');
            }

            $actualEndAt = now();

            $workSession->update([
                'actual_end_at' => $actualEndAt,
                'earned_amount' => $this->salaryCalculator->calculate(
                    $workSession->user,
                    $workSession->actual_start_at,
                    $actualEndAt,
                ),
            ]);

            return $workSession;
        });
    }
}
