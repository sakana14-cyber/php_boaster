<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SpecialWageController;
use App\Http\Controllers\WorkSessionController;
use App\Http\Controllers\WorkSessionEditController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', [HomeController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/work-sessions', [WorkSessionController::class, 'store'])->name('work-sessions.store');
    Route::patch('/work-sessions/{workSession}', [WorkSessionController::class, 'update'])->name('work-sessions.update');

    Route::get('/work-sessions/{workSession}/edit', [WorkSessionEditController::class, 'edit'])->name('work-sessions.edit');
    Route::put('/work-sessions/{workSession}', [WorkSessionEditController::class, 'update'])->name('work-sessions.edit.update');
    Route::delete('/work-sessions/{workSession}', [WorkSessionEditController::class, 'destroy'])->name('work-sessions.destroy');

    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::patch('/settings', [SettingsController::class, 'update'])->name('settings.update');

    Route::post('/special-wages', [SpecialWageController::class, 'store'])->name('special-wages.store');
    Route::delete('/special-wages/{specialWage}', [SpecialWageController::class, 'destroy'])->name('special-wages.destroy');

    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/calendar/{date}', [CalendarController::class, 'show'])
        ->where('date', '\d{4}-\d{2}-\d{2}')
        ->name('calendar.show');
});

require __DIR__.'/auth.php';
