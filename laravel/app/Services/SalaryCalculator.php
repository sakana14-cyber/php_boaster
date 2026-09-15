<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * 勤務区間の給与を計算する。
 *
 * 端数処理と、基本給・土日祝給・特別給の優先判定はこのクラスに集約し、
 * 勤務中の「予測給与」と退勤時の「確定給与」の両方から同じロジックを再利用する。
 */
class SalaryCalculator
{
    /**
     * 打刻時刻の丸めと日をまたぐ分割を経た上で、勤務区間の給与（円）を計算する。
     */
    public function calculate(User $user, CarbonInterface $startedAt, CarbonInterface $endedAt): int
    {
        $start = $this->roundToUnit(CarbonImmutable::parse($startedAt), $user->rounding_unit_edge);
        $end = $this->roundToUnit(CarbonImmutable::parse($endedAt), $user->rounding_unit_edge);

        if (! $end->greaterThan($start)) {
            return 0;
        }

        $end = $this->applyShiftRounding($start, $end, $user->rounding_unit_shift);

        $total = 0;

        foreach ($this->splitByDay($start, $end) as [$dayStart, $dayEnd]) {
            $total += $this->calculateForSingleDay($user, $dayStart, $dayEnd);
        }

        return $total;
    }

    /**
     * 日付をまたがないよう、勤務区間を日ごとの区間に分割する。
     *
     * @return list<array{0: CarbonImmutable, 1: CarbonImmutable}>
     */
    private function splitByDay(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $segments = [];
        $cursor = $start;

        while ($cursor->lessThan($end)) {
            $nextMidnight = $cursor->startOfDay()->addDay();
            $segmentEnd = $nextMidnight->lessThan($end) ? $nextMidnight : $end;

            $segments[] = [$cursor, $segmentEnd];
            $cursor = $segmentEnd;
        }

        return $segments;
    }

    /**
     * 同一日内の勤務区間について、特別給・土日祝給・基本給の優先順位で区間を分割し、給与を積算する。
     */
    private function calculateForSingleDay(User $user, CarbonImmutable $start, CarbonImmutable $end): int
    {
        $boundaries = $this->collectBoundaries($user, $start, $end);

        $total = 0;

        for ($i = 0; $i < count($boundaries) - 1; $i++) {
            $segmentStart = $boundaries[$i];
            $segmentEnd = $boundaries[$i + 1];

            if ($segmentEnd->lessThanOrEqualTo($segmentStart)) {
                continue;
            }

            $hourlyWage = $this->resolveHourlyWage($user, $start, $segmentStart, $segmentEnd);
            $seconds = $segmentEnd->diffInSeconds($segmentStart, true);

            $total += (int) floor($hourlyWage * $seconds / 3600);
        }

        return $total;
    }

    /**
     * 区間内にある特別給の開始・終了時刻を集め、勤務区間を分割するための境界時刻一覧を返す。
     *
     * @return list<CarbonImmutable>
     */
    private function collectBoundaries(User $user, CarbonImmutable $dayStart, CarbonImmutable $end): array
    {
        $boundaries = [$dayStart, $end];

        foreach ($user->specialWages as $specialWage) {
            $wageStart = $dayStart->setTimeFrom(Carbon::parse($specialWage->start_time));
            $wageEnd = $dayStart->setTimeFrom(Carbon::parse($specialWage->end_time));

            if ($wageEnd->lessThanOrEqualTo($wageStart)) {
                $wageEnd = $wageEnd->addDay();
            }

            foreach ([$wageStart, $wageEnd] as $boundary) {
                if ($boundary->greaterThan($dayStart) && $boundary->lessThan($end)) {
                    $boundaries[] = $boundary;
                }
            }
        }

        sort($boundaries);

        return array_values(array_unique($boundaries, SORT_REGULAR));
    }

    /**
     * 区間中央の時刻を基準に、特別給 > 土日祝給 > 基本給の優先順位で適用時給を決定する。
     */
    private function resolveHourlyWage(
        User $user,
        CarbonImmutable $dayStart,
        CarbonImmutable $segmentStart,
        CarbonImmutable $segmentEnd,
    ): int {
        $midpoint = $segmentStart->addSeconds((int) ($segmentEnd->diffInSeconds($segmentStart, true) / 2));

        foreach ($user->specialWages as $specialWage) {
            $wageStart = $dayStart->setTimeFrom(Carbon::parse($specialWage->start_time));
            $wageEnd = $dayStart->setTimeFrom(Carbon::parse($specialWage->end_time));

            if ($wageEnd->lessThanOrEqualTo($wageStart)) {
                $wageEnd = $wageEnd->addDay();
            }

            if ($midpoint->greaterThanOrEqualTo($wageStart) && $midpoint->lessThan($wageEnd)) {
                return $specialWage->hourly_wage;
            }
        }

        if ($this->isWeekendOrHoliday($midpoint)) {
            return $user->hourly_wage_weekend_holiday;
        }

        return $user->hourly_wage_default;
    }

    /**
     * 土曜・日曜を土日祝として扱う（祝日判定は将来の拡張候補）。
     */
    private function isWeekendOrHoliday(CarbonImmutable $date): bool
    {
        return $date->isWeekend();
    }

    /**
     * 打刻時刻を指定の分単位に切り捨てる。
     */
    private function roundToUnit(CarbonImmutable $time, int $unitMinutes): CarbonImmutable
    {
        if ($unitMinutes <= 1) {
            return $time->startOfMinute();
        }

        $totalMinutes = $time->diffInMinutes($time->startOfDay(), true);
        $roundedMinutes = intdiv($totalMinutes, $unitMinutes) * $unitMinutes;

        return $time->startOfDay()->addMinutes($roundedMinutes);
    }

    /**
     * 実働時間を勤務中の丸め単位で切り捨て、終了時刻を調整する。
     */
    private function applyShiftRounding(CarbonImmutable $start, CarbonImmutable $end, int $unitMinutes): CarbonImmutable
    {
        if ($unitMinutes <= 1) {
            return $end;
        }

        $workedMinutes = $end->diffInMinutes($start, true);
        $roundedMinutes = intdiv($workedMinutes, $unitMinutes) * $unitMinutes;

        return $start->addMinutes($roundedMinutes);
    }
}
