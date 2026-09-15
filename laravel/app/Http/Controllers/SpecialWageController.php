<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpecialWageRequest;
use App\Models\SpecialWage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;

class SpecialWageController extends Controller
{
    public function store(StoreSpecialWageRequest $request): RedirectResponse
    {
        $request->user()->specialWages()->create($request->validated());

        return Redirect::route('settings.edit')->with('status', 'special-wage-created');
    }

    public function destroy(SpecialWage $specialWage): RedirectResponse
    {
        Gate::authorize('delete', $specialWage);

        $specialWage->delete();

        return Redirect::route('settings.edit')->with('status', 'special-wage-deleted');
    }
}
