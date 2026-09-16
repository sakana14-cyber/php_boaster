<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftRequest;
use App\Http\Resources\WorkSessionResource;
use App\Models\WorkSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ShiftController extends Controller
{
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
