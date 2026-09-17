<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkSessionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CalendarController extends Controller
{
    /**
     * 指定月(デフォルト今月)の日別給与一覧・シフト予定日・月間集計を返す。
     */
    public function index(Request $request): JsonResponse
    {
        $month = Carbon::createFromDate(
            (int) $request->integer('year', now()->year),
            (int) $request->integer('month', now()->month),
            1,
        )->startOfMonth();
        $monthStart = $month->copy()->startOfDay();
        $monthEnd = $month->copy()->endOfMonth()->endOfDay();

        $sessions = $request->user()->workSessions()
            ->whereBetween('actual_start_at', [$monthStart, $monthEnd])
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

        $scheduledDays = $request->user()->workSessions()
            ->whereNotNull('scheduled_start_at')
            ->whereBetween('scheduled_start_at', [$monthStart, $monthEnd])
            ->pluck('scheduled_start_at')
            ->map(fn ($datetime) => $datetime->toDateString());

        $shiftDays = $scheduledDays->merge($sessionsByDate->keys())
            ->unique()
            ->values();

        return response()->json([
            'year' => $month->year,
            'month' => $month->month,
            'daily_totals' => $dailyTotals,
            'shift_days' => $shiftDays,
            'monthly_earned_amount' => (int) $sessions->sum('earned_amount'),
            'monthly_worked_seconds' => (int) collect($dailyTotals)->sum('worked_seconds'),
            'monthly_worked_days' => $sessionsByDate->count(),
        ]);
    }

    /**
     * 指定日の勤務明細(予定シフト・実績・給与)を返す。
     */
    public function show(Request $request, string $date): JsonResponse
    {
        $day = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        $sessions = $request->user()->workSessions()
            ->where(function ($query) use ($day) {
                $query->whereBetween('actual_start_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                    ->orWhere(function ($query) use ($day) {
                        $query->whereNull('actual_start_at')
                            ->whereBetween('scheduled_start_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()]);
                    });
            })
            ->orderByRaw('COALESCE(actual_start_at, scheduled_start_at)')
            ->get();

        return response()->json([
            'date' => $day->toDateString(),
            'sessions' => WorkSessionResource::collection($sessions),
        ]);
    }
}
