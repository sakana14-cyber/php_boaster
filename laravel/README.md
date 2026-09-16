# 給与タイマー バックエンド（Laravel API）

給与タイマーアプリ（php_boaster）のバックエンドです。Laravel Sanctum の Cookie ベース認証による JSON API 専用アプリケーションで、画面描画は行いません。フロントエンドは `../frontend`（Next.js の SPA）です。

## 技術構成

- PHP 8.3 以上
- Laravel 13
- Laravel Sanctum（SPA 向け Cookie 認証・CSRF 保護）
- SQLite（開発時）
- PHPUnit 12

## セットアップ・開発サーバー・よく使うコマンド

リポジトリルートの [`../readme.md`](../readme.md) の「セットアップ」「よく使うコマンド」を参照してください。

## 開発ルール

ブランチ運用・コミットメッセージの書き方はリポジトリルートの [`../CONTRIBUTING.md`](../CONTRIBUTING.md) に従います。
