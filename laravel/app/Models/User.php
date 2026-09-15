<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'hourly_wage_default',
    'hourly_wage_weekend_holiday',
    'rounding_unit_shift',
    'rounding_unit_edge',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'hourly_wage_default' => 'integer',
            'hourly_wage_weekend_holiday' => 'integer',
            'rounding_unit_shift' => 'integer',
            'rounding_unit_edge' => 'integer',
        ];
    }

    /**
     * @return HasMany<SpecialWage, $this>
     */
    public function specialWages(): HasMany
    {
        return $this->hasMany(SpecialWage::class);
    }

    /**
     * @return HasMany<WorkSession, $this>
     */
    public function workSessions(): HasMany
    {
        return $this->hasMany(WorkSession::class);
    }
}
