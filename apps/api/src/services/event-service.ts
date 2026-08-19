import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BadRequestError, NotFoundError } from '@/errors/app-error'
import type { EventCreateInput, EventListQuery, EventUpdateInput } from '@my-daily-tasks/shared'

// select を1箇所に集約し、eventSchema（packages/shared）の形とAPIレスポンスの形を一致させ続ける。
// userId は公開DTOに含めない。
const eventSelect = {
  id: true,
  title: true,
  description: true,
  startAt: true,
  endAt: true,
  allDay: true,
  location: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect

type EventDto = Prisma.EventGetPayload<{ select: typeof eventSelect }>

export async function listEvents(
  userId: string,
  query: EventListQuery,
): Promise<{ items: EventDto[]; total: number }> {
  const where: Prisma.EventWhereInput = {
    userId,
    startAt: { lt: query.to },
    endAt: { gt: query.from },
  }

  const [items, total] = await Promise.all([
    prisma.event.findMany({ where, select: eventSelect, orderBy: { startAt: 'asc' } }),
    prisma.event.count({ where }),
  ])

  return { items, total }
}

export async function createEvent(userId: string, input: EventCreateInput): Promise<EventDto> {
  assertEndAtNotBeforeStartAt(input.startAt, input.endAt)

  return prisma.event.create({
    select: eventSelect,
    data: {
      userId,
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
    },
  })
}

export async function getEvent(userId: string, id: string): Promise<EventDto> {
  const event = await prisma.event.findFirst({ where: { id, userId }, select: eventSelect })
  if (!event) {
    // 他ユーザーの予定へのアクセスも同じ NotFound にする（存在を漏らさない）
    throw new NotFoundError('event not found')
  }
  return event
}

export async function updateEvent(
  userId: string,
  id: string,
  input: EventUpdateInput,
): Promise<EventDto> {
  const existing = await getEvent(userId, id)

  const nextStartAt = input.startAt ?? existing.startAt
  const nextEndAt = input.endAt ?? existing.endAt
  if (input.startAt !== undefined || input.endAt !== undefined) {
    assertEndAtNotBeforeStartAt(nextStartAt, nextEndAt)
  }

  const data: Prisma.EventUpdateInput = {}
  if (input.title !== undefined) data.title = input.title
  if (input.description !== undefined) data.description = input.description
  if (input.startAt !== undefined) data.startAt = input.startAt
  if (input.endAt !== undefined) data.endAt = input.endAt
  if (input.allDay !== undefined) data.allDay = input.allDay
  if (input.location !== undefined) data.location = input.location

  return prisma.event.update({ where: { id: existing.id }, data, select: eventSelect })
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  await getEvent(userId, id)
  await prisma.event.delete({ where: { id } })
}

function assertEndAtNotBeforeStartAt(startAt: Date, endAt: Date): void {
  if (endAt < startAt) {
    throw new BadRequestError('endAt must be on or after startAt')
  }
}
