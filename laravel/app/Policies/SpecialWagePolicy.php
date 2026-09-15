<?php

namespace App\Policies;

use App\Models\SpecialWage;
use App\Models\User;

class SpecialWagePolicy
{
    /**
     * 自分自身の特別給のみ削除を許可する。
     */
    public function delete(User $user, SpecialWage $specialWage): bool
    {
        return $user->id === $specialWage->user_id;
    }
}
