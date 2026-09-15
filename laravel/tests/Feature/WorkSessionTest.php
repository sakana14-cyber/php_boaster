<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            ->post(route('work-sessions.store'))
            ->assertRedirect(route('dashboard'));

        $session = $user->fresh()->workSessions()->firstOrFail();
        $this->assertNotNull($session->actual_start_at);
        $this->assertNull($session->actual_end_at);

        $session->forceFill(['actual_start_at' => now()->subHour()])->save();

        $this->actingAs($user)
            ->patch(route('work-sessions.update', $session))
            ->assertRedirect(route('dashboard'));

        $session->refresh();
        $this->assertNotNull($session->actual_end_at);
        $this->assertSame(1200, $session->earned_amount);
    }

    public function test_user_cannot_clock_in_twice(): void
    {
        $user = User::factory()->create();
        $user->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($user)
            ->post(route('work-sessions.store'))
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('work_session');

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
            ->patch(route('work-sessions.update', $session))
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('work_session');
    }

    public function test_user_cannot_clock_out_another_users_session(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $session = $owner->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($intruder)
            ->patch(route('work-sessions.update', $session))
            ->assertForbidden();

        $this->assertNull($session->fresh()->actual_end_at);
    }

    public function test_dashboard_restores_active_session_state_after_reload(): void
    {
        $user = User::factory()->create();
        $session = $user->workSessions()->create(['actual_start_at' => now()]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertViewHas('activeSession', fn (WorkSession $active) => $active->is($session));
    }

    public function test_guest_cannot_clock_in(): void
    {
        $this->post(route('work-sessions.store'))
            ->assertRedirect(route('login'));
    }
}
