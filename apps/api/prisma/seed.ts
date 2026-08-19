import { PrismaClient, Priority, TaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: { email: 'dev@example.com', name: '開発用ユーザー' },
  })

  await prisma.task.deleteMany({ where: { userId: user.id } })
  await prisma.event.deleteMany({ where: { userId: user.id } })
  await prisma.note.deleteMany({ where: { userId: user.id } })
  await prisma.tag.deleteMany({ where: { userId: user.id } })

  const [workTag, privateTag, studyTag] = await Promise.all([
    prisma.tag.create({ data: { userId: user.id, name: '仕事', color: '#f97316' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'プライベート', color: '#22c55e' } }),
    prisma.tag.create({ data: { userId: user.id, name: '学習', color: '#3b82f6' } }),
  ])

  const meeting = await prisma.event.create({
    data: {
      userId: user.id,
      title: '定例ミーティング',
      startAt: new Date('2026-08-20T01:00:00.000Z'),
      endAt: new Date('2026-08-20T02:00:00.000Z'),
      tags: { create: [{ tagId: workTag.id }] },
    },
  })

  await prisma.event.create({
    data: {
      userId: user.id,
      title: '歯医者',
      startAt: new Date('2026-08-21T05:00:00.000Z'),
      endAt: new Date('2026-08-21T05:30:00.000Z'),
      tags: { create: [{ tagId: privateTag.id }] },
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'ミーティング資料を準備する',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueAt: new Date('2026-08-20T00:00:00.000Z'),
      eventId: meeting.id,
      tags: { create: [{ tagId: workTag.id }] },
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Prisma を勉強する',
      status: TaskStatus.DOING,
      priority: Priority.MEDIUM,
      tags: { create: [{ tagId: studyTag.id }] },
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: '買い物に行く',
      status: TaskStatus.DONE,
      priority: Priority.LOW,
      completedAt: new Date('2026-08-18T10:00:00.000Z'),
      tags: { create: [{ tagId: privateTag.id }] },
    },
  })

  await prisma.note.create({
    data: {
      userId: user.id,
      title: 'M2の作業メモ',
      body: '# M2\n\n土台の構築についてのメモ。',
      pinned: true,
      tags: { create: [{ tagId: workTag.id }] },
    },
  })

  await prisma.note.create({
    data: {
      userId: user.id,
      title: '読みたい本リスト',
      body: '- 設計の本\n- TypeScriptの本',
      tags: { create: [{ tagId: studyTag.id }] },
    },
  })

  await prisma.note.create({
    data: {
      userId: user.id,
      title: '過去のアイデアメモ',
      body: '使わなくなったメモ。',
      archivedAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  })
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
