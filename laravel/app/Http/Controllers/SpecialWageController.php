<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpecialWageRequest;
use App\Http\Resources\SpecialWageResource;
use App\Models\SpecialWage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SpecialWageController extends Controller
{
    public function store(StoreSpecialWageRequest $request): JsonResponse
    {
        $specialWage = $request->user()->specialWages()->create($request->validated());

        return response()->json(['special_wage' => new SpecialWageResource($specialWage)], 201);
    }

    public function destroy(SpecialWage $specialWage): JsonResponse
    {
        Gate::authorize('delete', $specialWage);

        $specialWage->delete();

        return response()->json(null, 204);
    }
}
