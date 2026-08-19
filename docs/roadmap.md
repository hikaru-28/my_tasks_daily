# ロードマップ

「動くものを縦に1本通してから横に広げる」方針。
最初に全機能のスキーマとAPIをまとめて作らず、タスク機能だけを DB → API → UI まで貫通させ、
土台と規約が正しいことを確かめてから予定・メモに展開する。

| # | 内容 | 完了条件 | 状態 |
|---|---|---|---|
| **M1** | 設計・規約の確定 | `CLAUDE.md` / `.claude/rules/` / `docs/` 一式がコミットされている | **完了** |
| **M2** | 土台の構築 | `GET /api/v1/health` が 200 を返し、Prisma Studio で全テーブルが見える | **完了** |
| **M3** | タスクの縦切り | ブラウザからタスクの追加・完了・削除ができる | **完了** |
| **M4** | 予定 | 日/週ビューで予定を作成・編集できる | 次 |
| **M5** | メモとタグ横断 | Markdownメモが書け、タグで3種を横断検索できる | |
| **M6** | ダッシュボード | 「今日の予定 + 今日のタスク」が1画面で見える | |

---

## M2: 土台の構築

- npm workspaces ルート（`apps/api`, `apps/web`, `packages/shared`）
- `docker-compose.yml`（postgres のみ）と `.env.example`
- `apps/api`: Express + `app.ts`/`index.ts` 分離、`errorHandler`、`GET /api/v1/health`
- `apps/api/prisma/schema.prisma`（`docs/db-schema.md` の内容）+ 初回マイグレーション + seed
- `apps/web`: Vite + React + Tailwind + React Router、`/api` の proxy 設定
- `packages/shared`: 空のエントリと `tsconfig`
- ESLint / Prettier / Vitest の設定、`npm run dev`（web と api を同時起動）

**この時点でUIは「Hello」相当でよい。疎通と型の通りを確認することが目的。**

---

## M3: タスクの縦切り

- `packages/shared`: `taskCreateSchema` / `taskUpdateSchema` / `taskQuerySchema`（Zod）
- `apps/api`: `services/task-service.ts` + `routes/tasks.ts`（一覧・作成・更新・削除）
- `apps/api`: `validate` ミドルウェア、`req.userId` 注入ミドルウェア、`AppError` 階層
- テスト: task-service のユニットテスト + Supertest による結合テスト
- `apps/web`: `features/tasks`（TanStack Query の hooks、一覧・追加フォーム・完了トグル・削除）

**ここで規約（レイヤ分離・エラー形式・Zod共有）が実際に機能するかを検証する。
違和感があればこの時点で `.claude/rules/` を直す。**

---

## M4: 予定

- Event の CRUD（API + UI）
- 日ビュー / 週ビュー。カレンダーライブラリは M4 開始時に選定する
- `endAt >= startAt` の業務検証（`BAD_REQUEST`）
- タスクを予定に紐付けるUI（`Task.eventId`）

---

## M5: メモとタグ横断

- Note の CRUD、Markdown プレビュー
- アーカイブ機能（`archivedAt`）
- Tag の CRUD と、Task / Event / Note へのタグ付けUI
- タグ絞り込みによる横断検索

---

## M6: ダッシュボード

- 今日の予定 + 今日期限のタスクを1画面に集約
- ピン留めメモの表示
- トップページをダッシュボードにする

---

## 運用ルール

- 各マイルストーン完了時に `CLAUDE.md` の「現在の進捗」を更新せよ。
- 実装中に規約の不足や誤りが見つかったら、その場で `.claude/rules/` に追記せよ（学習メモ12章「エラーの副産物としてのドキュメント化」）。
- 同時に、不要になった記述を削れ。`CLAUDE.md` は100行未満を維持せよ。
