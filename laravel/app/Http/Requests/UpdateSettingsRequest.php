<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hourly_wage_default' => ['required', 'integer', 'min:1'],
            'hourly_wage_weekend_holiday' => ['nullable', 'integer', 'min:1'],
            'rounding_unit_shift' => ['required', 'integer', 'min:1'],
            'rounding_unit_edge' => ['required', 'integer', 'min:1'],
        ];
    }
}
