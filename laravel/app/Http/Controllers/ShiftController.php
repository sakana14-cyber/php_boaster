<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftRequest;
use App\Http\Resources\WorkSessionResource;
use App\Models\WorkSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ShiftController extends Controller
{
    /**
     * 「履歴から追加」用に、直近使った時間帯(開始・終了時刻の組)を重複なく返す。
     */
    public function recent(Request $request): JsonResponse
    {
        $recent = $request->user()->workSessions()
            ->whereNotNull('scheduled_start_at')
            ->whereNotNull('scheduled_end_at')
            ->latest('scheduled_start_at')
            ->limit(20)
            ->get()
            ->unique(fn ($session) => $session->scheduled_start_at->format('H:i').'-'.$session->scheduled_end_at->format('H:i'))
            ->take(5)
            ->values()
            ->map(fn ($session) => [
                'start_time' => $session->scheduled_start_at->format('H:i'),
                'end_time' => $session->scheduled_end_at->format('H:i'),
            ]);

        return response()->json(['shifts' => $recent]);
    }

    /**
     * カレンダーから事前にシフト(予定出退勤時刻)を登録する。
     */
    public function store(StoreShiftRequest $request): JsonResponse
    {
        $shift = $request->user()->workSessions()->create($request->validated());

        return response()->json(['work_session' => new WorkSessionResource($shift)], 201);
    }

    /**
     * シフトの予定時刻を編集する。
     */
    public function update(StoreShiftRequest $request, WorkSession $workSession): JsonResponse
    {
        Gate::authorize('update', $workSession);

        $workSession->update($request->validated());

        return response()->json(['work_session' => new WorkSessionResource($workSession)]);
    }
}
