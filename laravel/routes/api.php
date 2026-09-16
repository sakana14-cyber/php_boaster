<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\SpecialWageController;
use App\Http\Controllers\WorkSessionController;
use App\Http\Controllers\WorkSessionEditController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [HomeController::class, 'index']);

    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::post('/work-sessions', [WorkSessionController::class, 'store']);
    Route::patch('/work-sessions/{workSession}', [WorkSessionController::class, 'update']);

    Route::get('/work-sessions/{workSession}', [WorkSessionEditController::class, 'show']);
    Route::put('/work-sessions/{workSession}', [WorkSessionEditController::class, 'update']);
    Route::delete('/work-sessions/{workSession}', [WorkSessionEditController::class, 'destroy']);

    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::patch('/shifts/{workSession}', [ShiftController::class, 'update']);

    Route::get('/settings', [SettingsController::class, 'edit']);
    Route::patch('/settings', [SettingsController::class, 'update']);

    Route::post('/special-wages', [SpecialWageController::class, 'store']);
    Route::delete('/special-wages/{specialWage}', [SpecialWageController::class, 'destroy']);

    Route::get('/calendar', [CalendarController::class, 'index']);
    Route::get('/calendar/{date}', [CalendarController::class, 'show'])
        ->where('date', '\d{4}-\d{2}-\d{2}');
});
