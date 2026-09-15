<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkSession;

class WorkSessionPolicy
{
    /**
     * 自分自身の勤務セッションのみ退勤・編集操作を許可する。
     */
    public function update(User $user, WorkSession $workSession): bool
    {
        return $user->id === $workSession->user_id;
    }

    /**
     * 自分自身の勤務セッションのみ削除を許可する。
     */
    public function delete(User $user, WorkSession $workSession): bool
    {
        return $user->id === $workSession->user_id;
    }
}
