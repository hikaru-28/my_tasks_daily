# アーキテクチャと技術選定

## 何を作るのか

予定（Event）・タスク（Task）・メモ（Note）を1つの画面系にまとめる個人向けアプリ。
「今日やること」を1画面で把握できることを最終ゴールとする。

**スコープ外（現時点）**: 複数ユーザー、共有・コラボ、通知、モバイルアプリ、外部カレンダー連携。

---

## 全体構成

```
ブラウザ
  │  HTTP / JSON
  ▼
apps/web  (React + Vite, :5173)
  │  fetch → /api/v1/*   ※ Vite の proxy 経由
  ▼
apps/api  (Express, :3000)
  │  Prisma Client
  ▼
PostgreSQL (Docker, :5432)

packages/shared … web と api の両方が import する Zod スキーマ / 型 / 定数
```

---

## バックエンドのレイヤ

| ディレクトリ | 責務 | やってはいけないこと |
|---|---|---|
| `routes/` | パスとハンドラの対応付け、`validate` の適用、ステータスコードの決定 | Prisma を呼ぶ、業務ロジックを書く、try/catch する |
| `services/` | 業務ロジック、Prisma によるデータアクセス、`AppError` の throw | `req` / `res` に触る、HTTPステータスを知る |
| `middlewares/` | 横断的関心事（検証・エラー変換・ログ・userId注入） | 特定リソースの知識を持つ |
| `lib/` | Prisma クライアント、環境変数の読み取りと検証 | 業務ロジックを持つ |
| `errors/` | `AppError` とサブクラス（`NotFoundError` など）の定義 | — |

### なぜ Repository 層を置かないのか

Prisma Client 自体が既にデータアクセスの抽象化であり、この規模で `TaskRepository` を挟んでも、
Prisma の呼び出しを1対1で転送するだけのファイルが増える。テストは Prisma をモックするか
テスト用DBを使えば書けるため、層を足す利益がない。

**導入を検討する条件**（どれかに当てはまったら再考する）:
- 同じ複雑なクエリが3箇所以上のサービスで重複した
- Prisma 以外のデータソース（外部API、Redis）が加わった
- 1つのサービス関数が100行を超えた

### なぜ `app.ts` と `index.ts` を分けるのか

`index.ts` が `app.listen()` を呼ぶと、テストから import した瞬間にポートを掴んでしまう。
`app.ts` が Express インスタンスを export するだけにしておけば、Supertest が
`request(app).get('/api/v1/tasks')` でサーバーを起動せずに叩ける。

---

## フロントエンドの構成

**機能単位（feature-based）で切る。** レイヤ単位（`components/` `hooks/` に全機能を混ぜる）にはしない。
タスク機能を触るときにタスク関連のファイルだけを見れば済むようにするため。

```
features/tasks/
  api.ts          apiClient を使った通信関数
  hooks.ts        useTasks / useCreateTask（TanStack Query）
  components/     TaskList.tsx, TaskItem.tsx, TaskForm.tsx
```

- 2つ以上の feature で使うものだけ `components/ui/` `lib/` に上げる。最初から共通化しない。
- サーバー由来のデータは TanStack Query が単一の情報源。`useState` に写し取るな。

---

## 技術選定の理由

| 選択 | 理由 | 見送った選択肢とその理由 |
|---|---|---|
| **Vite + React SPA** | 起動が速く設定が薄い。バックが Express である以上、フロントにサーバー機能は不要 | **Next.js**: サーバー機能が Express と役割が重複し、どちらに書くかの判断が毎回発生する |
| **Express 5** | ユーザー指定。async ハンドラの例外を自動で `next()` に流すため try/catch が不要になる | — |
| **npm workspaces モノレポ** | Zod スキーマ1つからフロント・バック双方の型が出る。API変更時の型の不整合がビルドで落ちる | **2リポジトリ分割**: 型を手でコピーすることになり、ズレが実行時まで発覚しない |
| **Zod** | バリデーションと型定義を1つの記述で兼ねられる。`packages/shared` に置く前提と噛み合う | **class-validator**: デコレータ前提でフロントと共有しづらい |
| **TanStack Query** | 一覧のキャッシュ・再取得・楽観的更新を自前で書かずに済む | **useEffect + useState**: 更新後の再取得やローディング管理を毎回手書きすることになる |
| **PostgreSQL (Docker)** | ユーザー指定。Prisma の機能（enum、`timestamptz`、部分インデックス）を制限なく使える | **SQLite**: enum 非対応で `String` 代用になり、後の移行時にスキーマ修正が必要 |
| **Tailwind CSS** | クラス名の設計を考えずに進められる。個人開発でCSS設計に時間を使わないため | **CSS Modules**: 命名規則の議論が発生する |
| **Vitest** | フロント・バックでランナーを統一でき、Vite の設定を流用できる | **Jest**: ESM + TypeScript の設定が重い |

---

## 認証を後付けする前提の設計

現時点で認証は実装しないが、後から足したときに書き換える範囲を最小にする。

1. 全テーブルに `userId` を最初から持たせる（マイグレーション不要）
2. サービス層の関数は必ず第1引数で `userId` を受け取り、クエリに `where: { userId }` を付ける
3. `req.userId` を注入するミドルウェアを1つ置く。現状は固定の開発用ユーザーIDを返すだけ

ログイン導入時に変更するのは **3のミドルウェアと、ログイン用のルート追加のみ**になる。

---

## 環境と起動

| 名前 | 値 | 備考 |
|---|---|---|
| API ポート | 3000 | |
| Web ポート | 5173 | Vite デフォルト |
| DB ポート | 5432 | Docker Compose |
| `DATABASE_URL` | `postgresql://app:app@localhost:5432/my_daily_tasks` | `.env` に置く。コミットするな |

CORS は設定しない。Vite の dev server proxy で `/api` を `localhost:3000` に転送し、
ブラウザから見て同一オリジンにする（本番も同一オリジン配信を前提とする）。
