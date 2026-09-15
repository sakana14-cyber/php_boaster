<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\SalaryCalculator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalaryCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private SalaryCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->calculator = new SalaryCalculator;
    }

    public function test_basic_hourly_wage_for_one_hour(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
        ]);

        // 2026-09-14 is a Monday (weekday).
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 09:00:00'),
            Carbon::parse('2026-09-14 10:00:00'),
        );

        $this->assertSame(1200, $salary);
    }

    public function test_half_hour_earns_half_the_hourly_wage(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
        ]);

        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 09:00:00'),
            Carbon::parse('2026-09-14 09:30:00'),
        );

        $this->assertSame(600, $salary);
    }

    public function test_fractional_yen_is_truncated(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1000,
        ]);

        // 40 minutes at 1000円/h = 666.66...円 -> 666円
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 09:00:00'),
            Carbon::parse('2026-09-14 09:40:00'),
        );

        $this->assertSame(666, $salary);
    }

    public function test_weekend_holiday_wage_is_applied_on_saturday(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1000,
            'hourly_wage_weekend_holiday' => 1500,
        ]);

        // 2026-09-19 is a Saturday.
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-19 09:00:00'),
            Carbon::parse('2026-09-19 10:00:00'),
        );

        $this->assertSame(1500, $salary);
    }

    public function test_special_wage_overrides_base_wage_for_overlapping_time(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1000,
        ]);
        $user->specialWages()->create([
            'title' => '深夜給',
            'start_time' => '22:00',
            'end_time' => '05:00',
            'hourly_wage' => 1500,
        ]);

        // 21:00-23:00: 21:00-22:00 は基本給(1000円/h)、22:00-23:00 は深夜給(1500円/h)。
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 21:00:00'),
            Carbon::parse('2026-09-14 23:00:00'),
        );

        $this->assertSame(2500, $salary);
    }

    public function test_shift_rounding_truncates_worked_time(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
            'rounding_unit_shift' => 15,
        ]);

        // 実働50分は15分単位で45分に切り捨てられる。
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 09:00:00'),
            Carbon::parse('2026-09-14 09:50:00'),
        );

        $this->assertSame(900, $salary);
    }

    public function test_edge_rounding_truncates_clock_in_and_out_times(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
            'rounding_unit_edge' => 15,
        ]);

        // 09:07 -> 09:00, 10:52 -> 10:45 に切り捨てられ、実働1時間45分となる。
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 09:07:00'),
            Carbon::parse('2026-09-14 10:52:00'),
        );

        $this->assertSame(2100, $salary);
    }

    public function test_shift_crossing_midnight_into_a_holiday_splits_by_day(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1000,
            'hourly_wage_weekend_holiday' => 1500,
        ]);

        // 2026-09-18(金) 23:00 から 2026-09-19(土) 01:00 まで勤務。
        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-18 23:00:00'),
            Carbon::parse('2026-09-19 01:00:00'),
        );

        $this->assertSame(2500, $salary);
    }

    public function test_end_before_start_returns_zero(): void
    {
        $user = User::factory()->create([
            'hourly_wage_default' => 1200,
        ]);

        $salary = $this->calculator->calculate(
            $user,
            Carbon::parse('2026-09-14 10:00:00'),
            Carbon::parse('2026-09-14 09:00:00'),
        );

        $this->assertSame(0, $salary);
    }
}
