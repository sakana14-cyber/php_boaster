<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_only_includes_sessions_within_the_requested_month(): void
    {
        $user = User::factory()->create();

        $inMonth = Carbon::create(2026, 9, 10, 9, 0);
        $outOfMonth = Carbon::create(2026, 10, 1, 9, 0);

        $user->workSessions()->create([
            'actual_start_at' => $inMonth,
            'actual_end_at' => $inMonth->copy()->addHour(),
            'earned_amount' => 1000,
        ]);
        $user->workSessions()->create([
            'actual_start_at' => $outOfMonth,
            'actual_end_at' => $outOfMonth->copy()->addHour(),
            'earned_amount' => 2000,
        ]);

        $response = $this->actingAs($user)->get(route('calendar.index', ['year' => 2026, 'month' => 9]));

        $response->assertOk();
        $response->assertViewHas('monthlyEarnedAmount', 1000);
        $response->assertViewHas('monthlyWorkedDays', 1);
    }

    public function test_calendar_sums_multiple_sessions_on_the_same_day(): void
    {
        $user = User::factory()->create();
        $morning = Carbon::create(2026, 9, 10, 9, 0);
        $evening = Carbon::create(2026, 9, 10, 18, 0);

        $user->workSessions()->create([
            'actual_start_at' => $morning,
            'actual_end_at' => $morning->copy()->addHours(2),
            'earned_amount' => 1000,
        ]);
        $user->workSessions()->create([
            'actual_start_at' => $evening,
            'actual_end_at' => $evening->copy()->addHours(3),
            'earned_amount' => 1500,
        ]);

        $response = $this->actingAs($user)->get(route('calendar.index', ['year' => 2026, 'month' => 9]));

        $response->assertViewHas('monthlyEarnedAmount', 2500);
        $response->assertViewHas('monthlyWorkedDays', 1);
    }

    public function test_calendar_day_detail_shows_only_that_users_sessions(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $day = Carbon::create(2026, 9, 10, 9, 0);

        $owner->workSessions()->create([
            'actual_start_at' => $day,
            'actual_end_at' => $day->copy()->addHour(),
            'earned_amount' => 1000,
        ]);
        $intruder->workSessions()->create([
            'actual_start_at' => $day,
            'actual_end_at' => $day->copy()->addHour(),
            'earned_amount' => 999,
        ]);

        $response = $this->actingAs($owner)->get(route('calendar.show', '2026-09-10'));

        $response->assertOk();
        $sessions = $response->viewData('sessions');
        $this->assertCount(1, $sessions);
        $this->assertSame(1000, $sessions->first()->earned_amount);
    }
}
