# my_daily_tasks

予定・タスク・メモを1つにまとめる個人向けアプリ。

## 状態

**設計フェーズ（M1完了）。アプリケーションコードはまだ存在しない。**
次のマイルストーン M2 でモノレポ雛形・DB・疎通確認を作る。進捗は [docs/roadmap.md](docs/roadmap.md)。

## 技術スタック

- フロント: React + TypeScript + Vite / React Router / TanStack Query / Tailwind CSS
- バック: Node.js + Express 5 + TypeScript
- DB / ORM: PostgreSQL（Docker Compose） / Prisma
- 共有: Zod スキーマを `packages/shared` に置きフロント・バックで共有
- テスト: Vitest（+ Supertest / Testing Library）

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 全体構成、レイヤの責務、技術選定の理由 |
| [docs/db-schema.md](docs/db-schema.md) | Prisma スキーマと設計判断 |
| [docs/roadmap.md](docs/roadmap.md) | マイルストーン |
| [CLAUDE.md](CLAUDE.md) | Claude Code 向けの指示書 |
| `.claude/rules/` | コーディング規約 / API設計規約 / Git運用 |

## 開発の始め方（M2以降）

<!-- 以下は M2 で雛形を作ってから有効になる -->

```bash
cp .env.example .env
docker compose up -d        # PostgreSQL 起動
npm install
npm run db:migrate -w apps/api
npm run dev                 # web (5173) と api (3000) を同時起動
```
