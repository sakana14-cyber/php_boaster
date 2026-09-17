<?php

namespace App\Http\Resources;

use App\Models\WorkSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WorkSession */
class WorkSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'scheduled_start_at' => ($this->scheduled_start_at ?? $this->shift?->scheduled_start_at)?->toIso8601String(),
            'scheduled_end_at' => ($this->scheduled_end_at ?? $this->shift?->scheduled_end_at)?->toIso8601String(),
            'actual_start_at' => $this->actual_start_at?->toIso8601String(),
            'actual_end_at' => $this->actual_end_at?->toIso8601String(),
            'earned_amount' => $this->earned_amount,
        ];
    }
}
