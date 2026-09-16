<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkSessionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeSession = $user->workSessions()
            ->whereNotNull('actual_start_at')
            ->whereNull('actual_end_at')
            ->first();

        $todaysShift = $user->workSessions()
            ->whereNull('actual_start_at')
            ->whereDate('scheduled_start_at', today())
            ->orderBy('scheduled_start_at')
            ->first();

        $todayEarnedAmount = (int) $user->workSessions()
            ->whereDate('actual_start_at', today())
            ->whereNotNull('earned_amount')
            ->sum('earned_amount');

        return response()->json([
            'active_session' => $activeSession ? new WorkSessionResource($activeSession) : null,
            'todays_shift' => $todaysShift ? new WorkSessionResource($todaysShift) : null,
            'today_earned_amount' => $todayEarnedAmount,
        ]);
    }
}
