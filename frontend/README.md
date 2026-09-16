# 給与タイマー フロントエンド

Next.js 16(App Router)/ React 19 / TypeScript / Tailwind CSS v4 で実装した、バイト出勤記録アプリのフロントエンドです。バックエンドは `../laravel`(Laravel + Sanctum のJSON API)。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` の `NEXT_PUBLIC_API_URL` はLaravel APIサーバーのURL(デフォルト `http://localhost:8000`)。

## 開発サーバー

```bash
npm run dev
```

`http://localhost:3000` を開いてください(`http://127.0.0.1:3000` ではなく `localhost` でアクセスすること。LaravelのCORS/Sanctumのstateful domain設定が `localhost:3000` を前提にしているため)。

同時にLaravel側も起動しておく必要があります([../laravel/README.md](../laravel/README.md) 参照)。

## ディレクトリ構成

```text
app/
├── login/, register/          # 未認証時の画面
├── (app)/                     # 認証必須画面(下部タブナビゲーション付き)
│   ├── dashboard/             # ホーム(出退勤・リアルタイム予測給与)
│   ├── calendar/[date]?/      # カレンダー・日別明細
│   ├── settings/              # 時給・特別給・丸め設定
│   └── work-sessions/[id]/edit/  # 勤務記録の編集
context/AuthContext.tsx        # ログイン状態の管理(/api/me を参照)
lib/api.ts                     # Sanctum CSRF Cookie対応のfetchラッパー
lib/salary.ts                  # 予測給与のクライアント側計算ロジック
```

## ビルド

```bash
npm run build
npm run lint
```
