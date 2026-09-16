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
            ->whereNull('actual_end_at')
            ->first();

        $todayEarnedAmount = (int) $user->workSessions()
            ->whereDate('actual_start_at', today())
            ->whereNotNull('earned_amount')
            ->sum('earned_amount');

        return response()->json([
            'active_session' => $activeSession ? new WorkSessionResource($activeSession) : null,
            'today_earned_amount' => $todayEarnedAmount,
        ]);
    }
}
