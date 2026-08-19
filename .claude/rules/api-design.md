# API設計規約

## 基本

- ベースパスは `/api/v1`。バージョンを省略するな。
- リソースは複数形：`/tasks` `/events` `/notes` `/tags`。
- 部分更新は `PATCH` を使え。`PUT` による全置換は使うな。
- ネストは1段までにせよ（`/events/:id/tasks` は可、それ以上は掘るな）。

## エンドポイント（M3以降で順次実装）

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/v1/health` | 死活監視。DB接続も確認する |
| GET | `/api/v1/tasks` | 一覧。`status` `dueBefore` `tagId` `q` で絞り込み |
| POST | `/api/v1/tasks` | 作成 |
| GET/PATCH/DELETE | `/api/v1/tasks/:id` | 取得・更新・削除 |
| GET | `/api/v1/events` | 一覧。`from` `to`（ISO 8601、必須）で期間指定 |
| POST | `/api/v1/events` | 作成 |
| GET/PATCH/DELETE | `/api/v1/events/:id` | 取得・更新・削除 |
| GET | `/api/v1/notes` | 一覧。`q` `tagId` `archived` で絞り込み |
| POST | `/api/v1/notes` | 作成 |
| GET/PATCH/DELETE | `/api/v1/notes/:id` | 取得・更新・削除 |
| GET/POST | `/api/v1/tags` | 一覧・作成 |
| PATCH/DELETE | `/api/v1/tags/:id` | 更新・削除 |

## レスポンス

- 単一リソースはラップせずそのまま返せ。`{ "data": ... }` で包むな。
- 一覧は `{ "items": T[], "total": number }` を返せ。`total` は絞り込み後の総件数（ページング前）。
- 作成成功は `201`、削除成功は `204`（本文なし）。
- 日時は必ず ISO 8601 の UTC 文字列で返せ（例 `"2026-08-19T01:30:00.000Z"`）。

## エラー

すべてのエラーレスポンスをこの形に統一せよ。

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "title is required", "details": { } } }
```

| HTTP | code | 使う場面 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod 検証失敗。`details` に Zod の issues を入れる |
| 400 | `BAD_REQUEST` | 検証は通ったが業務上不正（例：`endAt` が `startAt` より前） |
| 404 | `NOT_FOUND` | 対象リソースが存在しない |
| 409 | `CONFLICT` | 一意制約違反（例：同名タグ） |
| 422 | `UNPROCESSABLE` | 状態遷移が不正（例：完了済みタスクを再完了） |
| 500 | `INTERNAL_ERROR` | 想定外。`message` に内部情報を出すな |

- `message` はユーザーに見せてよい文言だけにせよ。スタックトレースやSQLを含めるな。
- 500 の詳細はレスポンスではなくサーバーログへ出せ。

## バリデーション

- リクエスト・レスポンスのスキーマは `packages/shared/src/schemas/` に Zod で定義し、フロント・バック双方から import せよ。同じ形の型を両側で書くな。
- 検証は `validate({ body, query, params })` ミドルウェアで行い、ハンドラに入る前に弾け。ハンドラ内で手書きの if 検証を書くな。
- 型は `z.infer<typeof taskCreateSchema>` で導出せよ。
- 日時フィールドは文字列として受け取り、Zod で `Date` に変換してからサービス層へ渡せ。

## 認証（未実装）

- 認証は M1〜M6 の範囲では実装しない。
- ただしサービス層の関数は**必ず第1引数で `userId` を受け取れ**。現状は固定の開発用ユーザーIDをミドルウェアが `req.userId` に載せる。後からログインを足すとき、この形なら差し替えるのはミドルウェア1箇所だけで済む。
- サービス層のクエリでは常に `where: { userId, ... }` を付けよ。他人のデータが取れる実装を書くな。
