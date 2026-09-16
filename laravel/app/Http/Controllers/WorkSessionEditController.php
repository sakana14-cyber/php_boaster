<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateWorkSessionRequest;
use App\Http\Resources\WorkSessionResource;
use App\Models\WorkSession;
use App\Services\SalaryCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class WorkSessionEditController extends Controller
{
    public function __construct(
        private readonly SalaryCalculator $salaryCalculator,
    ) {}

    public function show(WorkSession $workSession): JsonResponse
    {
        Gate::authorize('update', $workSession);

        return response()->json(['work_session' => new WorkSessionResource($workSession)]);
    }

    public function update(UpdateWorkSessionRequest $request, WorkSession $workSession): JsonResponse
    {
        Gate::authorize('update', $workSession);

        $data = $request->validated();
        $actualStartAt = Carbon::parse($data['actual_start_at']);
        $actualEndAt = Carbon::parse($data['actual_end_at']);

        $workSession->update([
            'actual_start_at' => $actualStartAt,
            'actual_end_at' => $actualEndAt,
            'earned_amount' => $this->salaryCalculator->calculate(
                $workSession->user,
                $actualStartAt,
                $actualEndAt,
            ),
        ]);

        return response()->json(['work_session' => new WorkSessionResource($workSession)]);
    }

    public function destroy(WorkSession $workSession): JsonResponse
    {
        Gate::authorize('delete', $workSession);

        $workSession->delete();

        return response()->json(null, 204);
    }
}
