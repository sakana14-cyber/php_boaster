<?php

namespace Tests\Feature;

use App\Models\SpecialWage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_wage_and_rounding_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('settings.update'), [
                'hourly_wage_default' => 1300,
                'hourly_wage_weekend_holiday' => 1600,
                'rounding_unit_shift' => 15,
                'rounding_unit_edge' => 5,
            ])
            ->assertRedirect(route('settings.edit'));

        $user->refresh();
        $this->assertSame(1300, $user->hourly_wage_default);
        $this->assertSame(1600, $user->hourly_wage_weekend_holiday);
        $this->assertSame(15, $user->rounding_unit_shift);
        $this->assertSame(5, $user->rounding_unit_edge);
    }

    public function test_settings_rejects_zero_or_negative_wage(): void
    {
        $user = User::factory()->create(['hourly_wage_default' => 1200]);

        $this->actingAs($user)
            ->patch(route('settings.update'), [
                'hourly_wage_default' => 0,
                'hourly_wage_weekend_holiday' => 1200,
                'rounding_unit_shift' => 1,
                'rounding_unit_edge' => 1,
            ])
            ->assertSessionHasErrors('hourly_wage_default');

        $this->assertSame(1200, $user->fresh()->hourly_wage_default);
    }

    public function test_settings_rejects_non_integer_wage(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('settings.update'), [
                'hourly_wage_default' => 1200.5,
                'hourly_wage_weekend_holiday' => 1200,
                'rounding_unit_shift' => 1,
                'rounding_unit_edge' => 1,
            ])
            ->assertSessionHasErrors('hourly_wage_default');
    }

    public function test_user_can_create_and_delete_a_special_wage(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('special-wages.store'), [
                'title' => '深夜給',
                'start_time' => '22:00',
                'end_time' => '05:00',
                'hourly_wage' => 1500,
            ])
            ->assertRedirect(route('settings.edit'));

        $specialWage = $user->specialWages()->firstOrFail();
        $this->assertSame('深夜給', $specialWage->title);

        $this->actingAs($user)
            ->delete(route('special-wages.destroy', $specialWage))
            ->assertRedirect(route('settings.edit'));

        $this->assertSame(0, $user->specialWages()->count());
    }

    public function test_user_cannot_delete_another_users_special_wage(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $specialWage = SpecialWage::factory()->for($owner)->create();

        $this->actingAs($intruder)
            ->delete(route('special-wages.destroy', $specialWage))
            ->assertForbidden();

        $this->assertSame(1, $owner->specialWages()->count());
    }
}
