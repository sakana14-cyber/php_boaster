<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ShiftTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_shift(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/shifts', [
            'scheduled_start_at' => '2026-09-20T09:00',
            'scheduled_end_at' => '2026-09-20T17:00',
        ]);

        $response->assertCreated();
        $this->assertSame(1, $user->workSessions()->count());
    }

    public function test_clocking_in_attaches_to_todays_pending_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 08:50:00'));

        $user = User::factory()->create();
        $shift = $user->workSessions()->create([
            'scheduled_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'scheduled_end_at' => Carbon::parse('2026-09-20 17:00:00'),
        ]);

        $this->actingAs($user)->postJson('/api/work-sessions')->assertCreated();

        $this->assertSame(1, $user->workSessions()->count());
        $this->assertNotNull($shift->fresh()->actual_start_at);

        Carbon::setTestNow();
    }

    public function test_dashboard_returns_todays_pending_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 08:00:00'));

        $user = User::factory()->create();
        $shift = $user->workSessions()->create([
            'scheduled_start_at' => Carbon::parse('2026-09-20 09:00:00'),
            'scheduled_end_at' => Carbon::parse('2026-09-20 17:00:00'),
        ]);

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('todays_shift.id', $shift->id)
            ->assertJsonPath('active_session', null);

        Carbon::setTestNow();
    }

    public function test_recent_shifts_returns_unique_time_pairs_in_recency_order(): void
    {
        $user = User::factory()->create();

        $user->workSessions()->create([
            'scheduled_start_at' => '2026-09-01 09:00:00',
            'scheduled_end_at' => '2026-09-01 17:00:00',
        ]);
        $user->workSessions()->create([
            'scheduled_start_at' => '2026-09-05 09:00:00',
            'scheduled_end_at' => '2026-09-05 17:00:00',
        ]);
        $user->workSessions()->create([
            'scheduled_start_at' => '2026-09-10 18:00:00',
            'scheduled_end_at' => '2026-09-10 22:00:00',
        ]);

        $response = $this->actingAs($user)->getJson('/api/shifts/recent');

        $response->assertOk();
        $response->assertJsonCount(2, 'shifts');
        $response->assertJsonPath('shifts.0', ['start_time' => '18:00', 'end_time' => '22:00']);
        $response->assertJsonPath('shifts.1', ['start_time' => '09:00', 'end_time' => '17:00']);
    }

    public function test_user_cannot_update_another_users_shift(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $shift = $owner->workSessions()->create([
            'scheduled_start_at' => '2026-09-20 09:00:00',
            'scheduled_end_at' => '2026-09-20 17:00:00',
        ]);

        $this->actingAs($intruder)
            ->patchJson("/api/shifts/{$shift->id}", [
                'scheduled_start_at' => '2026-09-20T10:00',
                'scheduled_end_at' => '2026-09-20T18:00',
            ])
            ->assertForbidden();
    }
}
