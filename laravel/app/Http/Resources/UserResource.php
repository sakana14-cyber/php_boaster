<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'hourly_wage_default' => $this->hourly_wage_default,
            'hourly_wage_weekend_holiday' => $this->hourly_wage_weekend_holiday,
            'rounding_unit_shift' => $this->rounding_unit_shift,
            'rounding_unit_edge' => $this->rounding_unit_edge,
        ];
    }
}
