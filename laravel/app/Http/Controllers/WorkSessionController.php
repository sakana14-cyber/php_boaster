<?php

namespace App\Http\Controllers;

use App\Actions\WorkSessions\ClockIn;
use App\Actions\WorkSessions\ClockOut;
use App\Http\Resources\WorkSessionResource;
use App\Models\WorkSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class WorkSessionController extends Controller
{
    public function store(ClockIn $clockIn): JsonResponse
    {
        try {
            $workSession = $clockIn->handle(request()->user());
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['work_session' => $e->getMessage()]);
        }

        return response()->json(['work_session' => new WorkSessionResource($workSession)], 201);
    }

    public function update(WorkSession $workSession, ClockOut $clockOut): JsonResponse
    {
        Gate::authorize('update', $workSession);

        try {
            $workSession = $clockOut->handle($workSession);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['work_session' => $e->getMessage()]);
        }

        return response()->json(['work_session' => new WorkSessionResource($workSession)]);
    }
}
