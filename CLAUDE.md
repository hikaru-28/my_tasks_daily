# my_daily_tasks

予定・タスク・メモを1つにまとめる個人向けアプリ。単一ユーザー前提（認証は未実装）。

## 技術スタック

| 層 | 採用技術 |
|---|---|
| フロント | React + TypeScript + Vite / React Router / TanStack Query / Tailwind CSS |
| バック | Node.js + Express 5 + TypeScript |
| バリデーション | Zod（`packages/shared` に置きフロント・バックで共有） |
| ORM / DB | Prisma / PostgreSQL（Docker Compose） |
| テスト | Vitest（+ Supertest / Testing Library） |
| 品質 | ESLint（flat config） + Prettier |

## ディレクトリ構造

```
apps/api/src/
  index.ts        listen するだけ
  app.ts          Expressアプリ組み立て（テストから import する）
  routes/         HTTPの入出力のみ
  services/       ビジネスロジック + Prisma 呼び出し
  middlewares/    errorHandler / validate / requestLogger
  lib/            prisma.ts / env.ts
  errors/         AppError 階層
apps/web/src/
  features/{tasks,events,notes}/   機能ごとに api.ts / hooks.ts / components/
  components/ui/                   汎用UI
  lib/                             apiClient.ts / queryClient.ts
  routes/                          画面
packages/shared/src/               Zodスキーマ・DTO型・共通定数
```

## 絶対ルール

1. **Prisma Client を呼んでよいのは `services/` のみ**。`routes/` から直接呼ぶな。
2. **`routes/` で try/catch を書くな**。`AppError` を throw し、`errorHandler` に処理させよ。
3. **API の型とバリデーションは `packages/shared` の Zod スキーマを単一の情報源とせよ**。フロント・バックで型を二重定義するな。
4. **日時は UTC で保存・送受信せよ**。JST への変換は表示直前のみ行え。
5. **`any` を使うな**。`unknown` + 絞り込みで対応せよ。
6. **`app.ts` と `index.ts` を分離したまま保て**。Supertest がアプリを直接 import するために必要。
7. **DBスキーマを変更したら `docs/db-schema.md` の設計判断も更新せよ**。

## コマンド

<!-- M2 で雛形を作るまでこれらは未実装。実装したらこの注記を消すこと -->

| 用途 | コマンド |
|---|---|
| DB起動 | `docker compose up -d` |
| 開発サーバー（全体） | `npm run dev` |
| マイグレーション | `npm run db:migrate -w apps/api` |
| DB GUI | `npm run db:studio -w apps/api` |
| テスト | `npm test` |
| Lint / 型チェック | `npm run lint` / `npm run typecheck` |

## 詳細ルールの参照先

- コーディング規約 → `.claude/rules/coding-style.md`
- API設計規約 → `.claude/rules/api-design.md`
- Git運用 → `.claude/rules/git-workflow.md`
- アーキテクチャと技術選定の理由 → `docs/architecture.md`
- DBスキーマと設計判断 → `docs/db-schema.md`
- 開発ロードマップ → `docs/roadmap.md`

## 現在の進捗

**M1（設計・規約の確定）完了。アプリのコードはまだ1行も存在しない。**
次は M2（モノレポ雛形 + Docker Postgres + Prisma migrate + ヘルスチェック疎通）。
詳細は `docs/roadmap.md` を読め。
