import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react の自動cleanupは afterEach がグローバルに存在する場合のみ登録される。
// このプロジェクトの vitest 設定は globals を有効にしていないため、明示的に登録する
// （登録されないと、同一ファイル内の複数テストでDOMが蓄積し getByRole 等が誤って複数要素にマッチする）。
afterEach(() => {
  cleanup()
})
