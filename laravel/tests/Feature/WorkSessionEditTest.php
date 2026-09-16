<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WorkSessionEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_edit_a_work_session_and_salary_is_recalculated(): void
    {
        $user = User::factory()->create(['hourly_wage_default' => 1000]);
        $session = $user->workSessions()->create([
            'actual_start_at' => Carbon::parse('2026-09-14 09:00:00'),
            'actual_end_at' => Carbon::parse('2026-09-14 10:00:00'),
            'earned_amount' => 1000,
        ]);

        $this->actingAs($user)
            ->putJson("/api/work-sessions/{$session->id}", [
                'actual_start_at' => '2026-09-14T09:00',
                'actual_end_at' => '2026-09-14T11:00',
            ])
            ->assertOk()
            ->assertJsonPath('work_session.earned_amount', 2000);

        $this->assertSame(2000, $session->fresh()->earned_amount);
    }

    public function test_user_can_delete_a_work_session(): void
    {
        $user = User::factory()->create();
        $session = $user->workSessions()->create([
            'actual_start_at' => now()->subHour(),
            'actual_end_at' => now(),
            'earned_amount' => 1000,
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/work-sessions/{$session->id}")
            ->assertNoContent();

        $this->assertSame(0, $user->workSessions()->count());
    }

    public function test_user_cannot_edit_another_users_work_session(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $session = $owner->workSessions()->create([
            'actual_start_at' => now()->subHour(),
            'actual_end_at' => now(),
            'earned_amount' => 1000,
        ]);

        $this->actingAs($intruder)
            ->getJson("/api/work-sessions/{$session->id}")
            ->assertForbidden();

        $this->actingAs($intruder)
            ->deleteJson("/api/work-sessions/{$session->id}")
            ->assertForbidden();

        $this->assertSame(1, $owner->workSessions()->count());
    }
}
