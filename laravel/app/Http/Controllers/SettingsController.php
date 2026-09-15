<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class SettingsController extends Controller
{
    /**
     * Display the user's wage and rounding settings form.
     */
    public function edit(Request $request): View
    {
        return view('settings.edit', [
            'user' => $request->user(),
            'specialWages' => $request->user()->specialWages,
        ]);
    }

    /**
     * Update the user's wage and rounding settings.
     */
    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return Redirect::route('settings.edit')->with('status', 'settings-updated');
    }
}
