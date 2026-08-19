import { Prisma, type TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { NotFoundError, UnprocessableError } from '@/errors/app-error'
import { getEvent } from '@/services/event-service'
import type { TaskCreateInput, TaskListQuery, TaskUpdateInput } from '@my-daily-tasks/shared'

// select を1箇所に集約し、taskSchema（packages/shared）の形とAPIレスポンスの形を一致させ続ける。
// userId は公開DTOに含めない。
const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueAt: true,
  completedAt: true,
  sortOrder: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect

type TaskDto = Prisma.TaskGetPayload<{ select: typeof taskSelect }>

export async function listTasks(
  userId: string,
  query: TaskListQuery,
): Promise<{ items: TaskDto[]; total: number }> {
  const where: Prisma.TaskWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.dueBefore ? { dueAt: { lte: query.dueBefore } } : {}),
    ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
    ...(query.eventId ? { eventId: query.eventId } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskSelect,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { sortOrder: 'asc' }],
    }),
    prisma.task.count({ where }),
  ])

  return { items, total }
}

export async function createTask(userId: string, input: TaskCreateInput): Promise<TaskDto> {
  const sortOrder = await nextSortOrder(userId, 'TODO')
  if (input.eventId !== undefined) {
    // 他人の予定/存在しない予定への紐付けは NotFoundError にする（getEvent と同じ「存在を漏らさない」方針）
    await getEvent(userId, input.eventId)
  }
  return prisma.task.create({
    select: taskSelect,
    data: {
      userId,
      title: input.title,
      priority: input.priority,
      sortOrder,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
      ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
    },
  })
}

export async function getTask(userId: string, id: string): Promise<TaskDto> {
  const task = await prisma.task.findFirst({ where: { id, userId }, select: taskSelect })
  if (!task) {
    // 他ユーザーのタスクへのアクセスも同じ NotFound にする（存在を漏らさない）
    throw new NotFoundError('task not found')
  }
  return task
}

export async function updateTask(
  userId: string,
  id: string,
  input: TaskUpdateInput,
): Promise<TaskDto> {
  const existing = await getTask(userId, id)

  if (input.eventId !== undefined && input.eventId !== null) {
    // 他人の予定/存在しない予定への紐付けは NotFoundError にする（getEvent と同じ「存在を漏らさない」方針）
    await getEvent(userId, input.eventId)
  }

  const data: Prisma.TaskUpdateInput = {}
  if (input.title !== undefined) data.title = input.title
  if (input.description !== undefined) data.description = input.description
  if (input.priority !== undefined) data.priority = input.priority
  if (input.dueAt !== undefined) data.dueAt = input.dueAt
  if (input.eventId !== undefined) {
    data.event = input.eventId === null ? { disconnect: true } : { connect: { id: input.eventId } }
  }
  if (input.status !== undefined) {
    if (input.status === 'DONE' && existing.status === 'DONE') {
      throw new UnprocessableError('task is already done')
    }
    data.status = input.status
    data.completedAt = input.status === 'DONE' ? new Date() : null
  }

  return prisma.task.update({ where: { id: existing.id }, data, select: taskSelect })
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await getTask(userId, id)
  await prisma.task.delete({ where: { id } })
}

async function nextSortOrder(userId: string, status: TaskStatus): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { userId, status },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return (last?.sortOrder ?? 0) + 1024
}
