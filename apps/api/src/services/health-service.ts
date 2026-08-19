import { prisma } from '@/lib/prisma'

export async function checkHealth(): Promise<{ status: 'ok'; db: 'ok' }> {
  await prisma.$queryRaw`SELECT 1`
  return { status: 'ok', db: 'ok' }
}
