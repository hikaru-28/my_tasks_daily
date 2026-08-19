# DBスキーマ設計

DB: PostgreSQL / ORM: Prisma
このファイルは **設計の意図**を残す場所。実ファイルは `apps/api/prisma/schema.prisma`（M2で作成）。
スキーマを変更したら、このファイルの「設計判断」も併せて更新すること。

---

## エンティティ関連

```
User ─┬─< Task >─┬─< TaskTag  >──┐
      │          └──(任意)── Event
      ├─< Event  ──< EventTag >──┼── Tag ──< User
      └─< Note   ──< NoteTag  >──┘
```

- `User` はすべてのデータの所有者（現在は開発用の1件のみ）
- `Tag` は Task / Event / Note を横断する。中間テーブル3本で繋ぐ
- `Task` は任意で1つの `Event` に紐づく（「この予定のためのタスク」）

---

## Prisma スキーマ

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  tasks     Task[]
  events    Event[]
  notes     Note[]
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum TaskStatus {
  TODO
  DOING
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueAt       DateTime?
  completedAt DateTime?
  sortOrder   Int        @default(0)
  eventId     String?
  event       Event?     @relation(fields: [eventId], references: [id], onDelete: SetNull)
  tags        TaskTag[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId, status, priority])
  @@index([userId, dueAt])
  @@index([eventId])
}

model Event {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime
  allDay      Boolean    @default(false)
  location    String?
  tasks       Task[]
  tags        EventTag[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId, startAt])
  @@index([userId, endAt])
}

model Note {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String
  body       String    // Markdown
  pinned     Boolean   @default(false)
  archivedAt DateTime?
  tags       NoteTag[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId, archivedAt, updatedAt])
  @@index([userId, pinned])
}

model Tag {
  id     String     @id @default(cuid())
  userId String
  user   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name   String
  color  String     @default("#94a3b8")
  tasks  TaskTag[]
  events EventTag[]
  notes  NoteTag[]

  @@unique([userId, name])
}

model TaskTag {
  taskId String
  tagId  String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId],  references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@index([tagId])
}

model EventTag {
  eventId String
  tagId   String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tagId],   references: [id], onDelete: Cascade)

  @@id([eventId, tagId])
  @@index([tagId])
}

model NoteTag {
  noteId String
  tagId  String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId],  references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
  @@index([tagId])
}
```

---

## 設計判断とその理由

### 1. 認証はないが `userId` を最初から全テーブルに持たせる

後からログインを足すときに、マイグレーションもクエリの書き換えも発生しない。
M2 では seed で開発用ユーザーを1件作り、ミドルウェアが常にその ID を `req.userId` に載せる。

### 2. タグはポリモーフィック1本ではなく中間テーブル3本にする

Prisma は「TagLink(targetType, targetId)」のようなポリモーフィック関連を、型安全にも外部キー制約付きにも表現できない。
テーブルは増えるが、`onDelete: Cascade` が効き、`include: { tags: true }` が型付きで書ける利点を取る。

### 3. 日時はすべて UTC（`timestamptz`）で保存する

Prisma の `DateTime` は PostgreSQL では `timestamptz` になる。
JST への変換は**表示直前のフロントエンドでのみ**行う。API の入出力は ISO 8601 の UTC 文字列。
これを崩すと「日付をまたぐタスクの期限」でズレが必ず起きる。

### 4. 削除は物理削除。ただし Note のみアーカイブを持つ

Task と Event は消えても困らない（完了済みタスクは `status: DONE` で残る）。
メモは誤削除の損失が大きいため `archivedAt` を持ち、一覧はデフォルトで `archivedAt: null` のみを返す。
全テーブルに soft delete を入れると全クエリに `deletedAt: null` が必要になり、付け忘れのバグを生むため採用しない。

### 5. 主キーは cuid

URL に出ても連番から他レコードを推測できない。UUID より短く、生成順に単調増加するためインデックスの断片化も少ない。

### 6. `Task.eventId` で「予定に紐づくタスク」を表現する

予定を消してもタスクは残したいので `onDelete: SetNull`。
逆にタスクから予定を自動生成することはしない（タスクと予定の責務を混ぜない）。
「予定の準備タスク」を表現するだけで、予定＝タスクの別表現にはしない。

### 7. `Task.sortOrder` は手動並び替え用

同一ステータス内でのドラッグ並び替えに使う。`Int` の連番だと挿入のたびに全件更新が必要になるため、
**M3 の実装時は 1024 刻みで採番し、間に挿入するときは前後の中間値を使う**こと。

### 8. `Event` の一覧取得は `from`/`to` との重なり判定（半開区間）で行う

`GET /api/v1/events` の `from`/`to` は「範囲内に開始した予定」だけでなく「範囲より前に始まり範囲内で終わる予定」
「範囲を跨いで開催される予定」も含めたい（日/週ビューでの表示欠けを防ぐため）。そのため
`startAt < to AND endAt > from` という半開区間の重なり判定を使う（`services/event-service.ts`）。

終日（`allDay: true`）の予定は `startAt = 対象日 0:00 JST`、`endAt = 翌日 0:00 JST`（終了は排他的）として
保存する規約とし、この重なり判定と整合させる。

---

## 想定クエリとインデックスの対応

| ユースケース | クエリ | 使うインデックス |
|---|---|---|
| 今日期限の未完了タスクを優先度順 | `where: { userId, status: { not: 'DONE' }, dueAt: { lte: 今日の終わり } }` | `[userId, dueAt]` |
| ステータス別のタスク一覧（かんばん） | `where: { userId, status }, orderBy: [{ priority }, { sortOrder }]` | `[userId, status, priority]` |
| 指定期間と重なる予定を日付順 | `where: { userId, startAt: { lt: to }, endAt: { gt: from } }` | `[userId, startAt]` |
| メモ一覧（更新順、アーカイブ除く） | `where: { userId, archivedAt: null }, orderBy: { updatedAt: 'desc' }` | `[userId, archivedAt, updatedAt]` |
| タグで横断検索 | `TaskTag/EventTag/NoteTag` を `tagId` で引く | 各中間テーブルの `[tagId]` |

**未対応（将来課題）**: メモ本文の全文検索。件数が増えるまでは `contains` の LIKE 検索で済ませ、
遅くなったら PostgreSQL の `pg_trgm` か全文検索インデックスを検討する。

---

## Seed データ（M2で作成）

- 開発用ユーザー 1件
- タグ 3件（`仕事` / `プライベート` / `学習`）
- タスク・予定・メモを各2〜3件（画面の見た目確認用）
