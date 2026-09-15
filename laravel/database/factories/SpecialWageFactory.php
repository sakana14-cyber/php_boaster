<?php

namespace Database\Factories;

use App\Models\SpecialWage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SpecialWage>
 */
class SpecialWageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => '深夜給',
            'start_time' => '22:00',
            'end_time' => '05:00',
            'hourly_wage' => 1500,
        ];
    }
}
