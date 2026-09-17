<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WorkSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_clock_in_and_clock_out(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
        ]);

        $this->actingAs($user)
            ->postJson('/api/work-sessions')
            ->assertCreated();

        $session = $user->fresh()->workSessions()->firstOrFail();
        $this->assertNotNull($session->actual_start_at);
        $this->assertNull($session->actual_end_at);

        $session->forceFill(['actual_start_at' => now()->subHour()])->save();

        $this->actingAs($user)
            ->patchJson("/api/work-sessions/{$session->id}")
            ->assertOk();

        $session->refresh();
        $this->assertNotNull($session->actual_end_at);
        $this->assertSame(1200, $session->earned_amount);
    }

    public function test_user_cannot_clock_in_twice(): void
    {
        $user = User::factory()->create();
        $user->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($user)
            ->postJson('/api/work-sessions')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('work_session');

        $this->assertSame(1, $user->workSessions()->count());
    }

    public function test_user_cannot_clock_out_an_already_completed_session(): void
    {
        $user = User::factory()->create();
        $session = $user->workSessions()->create([
            'actual_start_at' => now()->subHour(),
            'actual_end_at' => now(),
            'earned_amount' => 1000,
        ]);

        $this->actingAs($user)
            ->patchJson("/api/work-sessions/{$session->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('work_session');
    }

    public function test_user_cannot_clock_out_another_users_session(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $session = $owner->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($intruder)
            ->patchJson("/api/work-sessions/{$session->id}")
            ->assertForbidden();

        $this->assertNull($session->fresh()->actual_end_at);
    }

    public function test_dashboard_returns_active_session_state(): void
    {
        $user = User::factory()->create();
        $session = $user->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('active_session.id', $session->id);
    }

    public function test_guest_cannot_clock_in(): void
    {
        $this->postJson('/api/work-sessions')->assertUnauthorized();
    }

    public function test_second_clock_in_within_shift_window_links_to_the_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 10:10:00'));

        $user = User::factory()->create();
        $shift = $user->workSessions()->create([
            'scheduled_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'scheduled_end_at' => Carbon::parse('2026-09-20 12:00:00'),
        ]);
        $user->workSessions()->create([
            'shift_id' => $shift->id,
            'actual_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'actual_end_at' => Carbon::parse('2026-09-20 09:05:00'),
            'earned_amount' => 100,
        ]);

        $this->actingAs($user)
            ->postJson('/api/work-sessions')
            ->assertCreated()
            ->assertJsonPath('work_session.scheduled_start_at', $shift->scheduled_start_at->toIso8601String())
            ->assertJsonPath('work_session.scheduled_end_at', $shift->scheduled_end_at->toIso8601String());

        $newSession = $user->workSessions()->whereNotNull('actual_start_at')->whereNull('actual_end_at')->firstOrFail();
        $this->assertSame($shift->id, $newSession->shift_id);
        $this->assertNull($newSession->scheduled_start_at);

        Carbon::setTestNow();
    }

    public function test_second_clock_in_outside_shift_window_does_not_link_to_a_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 15:00:00'));

        $user = User::factory()->create();
        $shift = $user->workSessions()->create([
            'scheduled_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'scheduled_end_at' => Carbon::parse('2026-09-20 12:00:00'),
        ]);
        $user->workSessions()->create([
            'shift_id' => $shift->id,
            'actual_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'actual_end_at' => Carbon::parse('2026-09-20 09:05:00'),
            'earned_amount' => 100,
        ]);

        $this->actingAs($user)
            ->postJson('/api/work-sessions')
            ->assertCreated()
            ->assertJsonPath('work_session.scheduled_start_at', null)
            ->assertJsonPath('work_session.scheduled_end_at', null);

        $newSession = $user->workSessions()->whereNotNull('actual_start_at')->whereNull('actual_end_at')->firstOrFail();
        $this->assertNull($newSession->shift_id);

        Carbon::setTestNow();
    }

    public function test_editing_the_shift_updates_the_linked_attendances_response(): void
    {
        $user = User::factory()->create();
        $shift = $user->workSessions()->create([
            'scheduled_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'scheduled_end_at' => Carbon::parse('2026-09-20 12:00:00'),
        ]);
        $attendance = $user->workSessions()->create([
            'shift_id' => $shift->id,
            'actual_start_at' => Carbon::parse('2026-09-20 10:00:00'),
            'actual_end_at' => Carbon::parse('2026-09-20 10:30:00'),
            'earned_amount' => 500,
        ]);

        $shift->update(['scheduled_end_at' => Carbon::parse('2026-09-20 13:00:00')]);

        $this->actingAs($user)
            ->getJson('/api/calendar/2026-09-20')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $attendance->id,
                'scheduled_end_at' => Carbon::parse('2026-09-20 13:00:00')->toIso8601String(),
            ]);
    }
}
