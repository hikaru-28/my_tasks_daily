import { prisma } from '@/lib/prisma'

const DEV_USER_EMAIL = 'dev@example.com'

let cachedDevUserId: string | undefined

// 認証は未実装（M1〜M6の範囲外）。固定の開発用ユーザーIDを返す。
// ログイン導入時に差し替えるのはこの関数と呼び出し元のミドルウェアのみで済む設計。
export async function getDevUserId(): Promise<string> {
  if (cachedDevUserId) {
    return cachedDevUserId
  }

  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: { email: DEV_USER_EMAIL, name: '開発用ユーザー' },
  })

  cachedDevUserId = user.id
  return cachedDevUserId
}
