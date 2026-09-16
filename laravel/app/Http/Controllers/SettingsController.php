<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Resources\SpecialWageResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * ログインユーザーの時給・丸め設定と特別給一覧を返す。
     */
    public function edit(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
            'special_wages' => SpecialWageResource::collection($request->user()->specialWages),
        ]);
    }

    /**
     * ログインユーザーの時給・丸め設定を更新する。
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return response()->json(['user' => new UserResource($request->user())]);
    }
}
