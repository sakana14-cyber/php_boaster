<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();

        $activeSession = $user->workSessions()
            ->whereNull('actual_end_at')
            ->first();

        $todayEarnedAmount = (int) $user->workSessions()
            ->whereDate('actual_start_at', today())
            ->whereNotNull('earned_amount')
            ->sum('earned_amount');

        return view('dashboard', [
            'activeSession' => $activeSession,
            'todayEarnedAmount' => $todayEarnedAmount,
        ]);
    }
}
