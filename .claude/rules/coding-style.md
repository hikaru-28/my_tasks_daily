# コーディング規約

## TypeScript

- `strict` に加え `noUncheckedIndexedAccess` と `exactOptionalPropertyTypes` を有効にせよ。
- `any` を書くな。型が不明なら `unknown` で受けて絞り込め。外部ライブラリの型が壊れている場合のみ `as` を許可し、理由をコメントで残せ。
- 型定義を手書きする前に、Prisma 生成型（`@prisma/client`）と Zod の `z.infer` から導出できないか検討せよ。
- 関数の戻り値型は公開APIになるもの（service関数、共有パッケージのexport）には明示せよ。ローカルのヘルパーは推論に任せてよい。
- 列挙的な値は TypeScript の `enum` ではなく union 型（`'TODO' | 'DOING' | 'DONE'`）を使え。Prisma enum からは生成型を再利用せよ。

## 命名とファイル

- React コンポーネントのファイルは `PascalCase.tsx`。それ以外のファイルは `kebab-case.ts`。
- コンポーネント名 = ファイル名。1ファイル1コンポーネントを原則とせよ。
- **名前付きエクスポートのみ使え。** `export default` を書くな（`vite.config.ts` など設定ファイルは例外）。
- import は `@/` エイリアスを使え。`../../..` のような2階層以上を遡る相対パスを書くな。
- 変数名は省略するな（`e` ではなく `error`、`u` ではなく `user`）。ただし `map` のコールバック引数など数行で閉じるスコープは短くてよい。

## 関数とコンポーネント

- React はすべて関数コンポーネントで書け。クラスコンポーネントを書くな。
- サーバーから取得するデータは TanStack Query で扱え。`useEffect` + `useState` で fetch するな。
- クライアント状態は `useState` / `useContext` で足りる。状態管理ライブラリを追加するな。
- 1つの関数が画面表示とデータ整形の両方をしていたら分割せよ。整形ロジックは `features/*/lib` かサーバー側へ寄せよ。

## エラー処理

- サービス層では `AppError`（またはそのサブクラス）を throw せよ。HTTPステータスを直接扱うな。
- `routes/` に try/catch を書くな。Express 5 は async ハンドラの reject を自動で `next()` に流すため、`errorHandler` ミドルウェアが受け取る。
- エラーを握りつぶすな。ログだけ出して握りつぶす箇所を作る場合は、なぜ握りつぶしてよいかをコメントで書け。

## コメント

- コメントには「なぜ」を書け。「何をしているか」はコードで表現せよ。
- 自明な処理にコメントを付けるな。
- 一時的な回避策には `// TODO(理由):` の形で理由を書け。

## テスト

- テストは Vitest で書け。ファイル名は `*.test.ts` / `*.test.tsx`、対象ファイルと同じディレクトリに置け。
- サービス層はユニットテストで分岐を網羅せよ。
- ルーティングは Supertest で `app` を直接叩く結合テストを書け（サーバーを listen させるな）。
- UI は「表示されるか」「操作できるか」をテストせよ。スタイルやDOM構造をテストするな。
- テストを通すためだけにプロダクションコードへ分岐を足すな。
- `apps/api` のテストは専用のテストDBを持たず実DBを直接使う（M3で採用）。サービス層のテストは
  専用テストユーザーを作って後始末し、ルーティングのテストは開発用シードユーザー（`dev@example.com`）の
  タスクを `beforeEach` で消してからゼロ件で始める。そのため `npm test` を実行すると開発用シードの
  タスクが消える。ブラウザ確認用のデータが必要になったら `npm run db:seed -w apps/api` を再実行せよ。
- Zod の `validate` ミドルウェア（`apps/api/src/middlewares/validate.ts`）は body/query/params を
  `.transform()` 込みでパース済みの状態で `req.validated` に格納する。ルート側で同じスキーマを
  再度 `.parse()` するな（`.transform()` で型が変わった値を再度入力用スキーマに通すと失敗する）。
  `req.validated` は型システム上 `unknown` なので、ルート側で対応する型へ一度だけ `as` で絞り込め。
