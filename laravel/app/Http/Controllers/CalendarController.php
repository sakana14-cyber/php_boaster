<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkSessionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CalendarController extends Controller
{
    /**
     * 指定月(デフォルト今月)の日別給与一覧と月間集計を返す。
     */
    public function index(Request $request): JsonResponse
    {
        $month = Carbon::createFromDate(
            (int) $request->integer('year', now()->year),
            (int) $request->integer('month', now()->month),
            1,
        )->startOfMonth();

        $sessions = $request->user()->workSessions()
            ->whereBetween('actual_start_at', [$month->copy()->startOfDay(), $month->copy()->endOfMonth()->endOfDay()])
            ->whereNotNull('actual_start_at')
            ->orderBy('actual_start_at')
            ->get();

        $sessionsByDate = $sessions->groupBy(fn ($session) => $session->actual_start_at->toDateString());

        $dailyTotals = $sessionsByDate->map(fn ($daySessions) => [
            'earned_amount' => (int) $daySessions->sum('earned_amount'),
            'worked_seconds' => $daySessions->sum(
                fn ($session) => $session->actual_end_at
                    ? $session->actual_end_at->diffInSeconds($session->actual_start_at, true)
                    : 0
            ),
        ])->all();

        return response()->json([
            'year' => $month->year,
            'month' => $month->month,
            'daily_totals' => $dailyTotals,
            'monthly_earned_amount' => (int) $sessions->sum('earned_amount'),
            'monthly_worked_seconds' => (int) collect($dailyTotals)->sum('worked_seconds'),
            'monthly_worked_days' => $sessionsByDate->count(),
        ]);
    }

    /**
     * 指定日の勤務明細(打刻時刻・給与)を返す。
     */
    public function show(Request $request, string $date): JsonResponse
    {
        $day = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        $sessions = $request->user()->workSessions()
            ->whereBetween('actual_start_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
            ->orderBy('actual_start_at')
            ->get();

        return response()->json([
            'date' => $day->toDateString(),
            'sessions' => WorkSessionResource::collection($sessions),
        ]);
    }
}
