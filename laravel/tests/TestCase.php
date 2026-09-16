<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum の EnsureFrontendRequestsAreStateful は Referer/Origin が
        // sanctum.stateful に含まれるドメインでない限りセッションを開始しない。
        // フロントエンド(Next.js)からのCookie認証リクエストを再現するため、
        // テストではデフォルトでフロントのOriginを送信する。
        $this->withHeader('Referer', 'http://localhost:3000');
    }
}
