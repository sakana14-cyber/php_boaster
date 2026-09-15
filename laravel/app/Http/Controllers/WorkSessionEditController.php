<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateWorkSessionRequest;
use App\Models\WorkSession;
use App\Services\SalaryCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class WorkSessionEditController extends Controller
{
    public function __construct(
        private readonly SalaryCalculator $salaryCalculator,
    ) {}

    public function edit(WorkSession $workSession): View
    {
        Gate::authorize('update', $workSession);

        return view('work-sessions.edit', [
            'workSession' => $workSession,
        ]);
    }

    public function update(UpdateWorkSessionRequest $request, WorkSession $workSession): RedirectResponse
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

        return Redirect::route('calendar.show', $workSession->actual_start_at->toDateString())
            ->with('status', 'work-session-updated');
    }

    public function destroy(WorkSession $workSession): RedirectResponse
    {
        Gate::authorize('delete', $workSession);

        $date = $workSession->actual_start_at?->toDateString() ?? now()->toDateString();

        $workSession->delete();

        return Redirect::route('calendar.show', $date)->with('status', 'work-session-deleted');
    }
}
