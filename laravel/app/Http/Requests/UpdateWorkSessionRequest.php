<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkSessionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'actual_start_at' => ['required', 'date', 'before_or_equal:now'],
            'actual_end_at' => ['required', 'date', 'after:actual_start_at', 'before_or_equal:now'],
        ];
    }
}
