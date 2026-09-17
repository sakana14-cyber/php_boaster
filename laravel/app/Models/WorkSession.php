<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'shift_id',
    'scheduled_start_at',
    'scheduled_end_at',
    'actual_start_at',
    'actual_end_at',
    'earned_amount',
])]
class WorkSession extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_start_at' => 'datetime',
            'scheduled_end_at' => 'datetime',
            'actual_start_at' => 'datetime',
            'actual_end_at' => 'datetime',
            'earned_amount' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * この出勤実績が紐づく予定(シフト)。予定自身の行では null。
     *
     * @return BelongsTo<WorkSession, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(WorkSession::class, 'shift_id');
    }
}
