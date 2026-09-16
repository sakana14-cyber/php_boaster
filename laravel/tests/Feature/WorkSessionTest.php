<?php

namespace Tests\Feature;

use App\Models\User;
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
}
