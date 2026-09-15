<?php

namespace App\Http\Controllers;

use App\Actions\WorkSessions\ClockIn;
use App\Actions\WorkSessions\ClockOut;
use App\Models\WorkSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use RuntimeException;

class WorkSessionController extends Controller
{
    public function store(ClockIn $clockIn): RedirectResponse
    {
        try {
            $clockIn->handle(request()->user());
        } catch (RuntimeException $e) {
            return Redirect::route('dashboard')->withErrors(['work_session' => $e->getMessage()]);
        }

        return Redirect::route('dashboard');
    }

    public function update(WorkSession $workSession, ClockOut $clockOut): RedirectResponse
    {
        Gate::authorize('update', $workSession);

        try {
            $clockOut->handle($workSession);
        } catch (RuntimeException $e) {
            return Redirect::route('dashboard')->withErrors(['work_session' => $e->getMessage()]);
        }

        return Redirect::route('dashboard');
    }
}
