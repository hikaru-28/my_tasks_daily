import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { BadRequestError, NotFoundError } from '@/errors/app-error'
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from '@/services/event-service'

const TEST_USER_EMAIL = 'event-service-test@example.com'
const OTHER_USER_EMAIL = 'event-service-test-other@example.com'

let userId: string
let otherUserId: string

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    update: {},
    create: { email: TEST_USER_EMAIL, name: 'テストユーザー' },
  })
  userId = user.id

  const otherUser = await prisma.user.upsert({
    where: { email: OTHER_USER_EMAIL },
    update: {},
    create: { email: OTHER_USER_EMAIL, name: '他のテストユーザー' },
  })
  otherUserId = otherUser.id
})

afterEach(async () => {
  await prisma.event.deleteMany({ where: { userId: { in: [userId, otherUserId] } } })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } })
})

function range(startAt: string, endAt: string) {
  return { startAt: new Date(startAt), endAt: new Date(endAt) }
}

function fromTo(from: string, to: string) {
  return { from: new Date(from), to: new Date(to) }
}

describe('createEvent', () => {
  it('creates an event with default allDay=false', async () => {
    const event = await createEvent(userId, {
      title: '打ち合わせ',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    expect(event).toMatchObject({ title: '打ち合わせ', allDay: false })
  })

  it('throws BadRequestError when endAt is before startAt', async () => {
    await expect(
      createEvent(userId, {
        title: '打ち合わせ',
        allDay: false,
        ...range('2026-08-20T02:00:00.000Z', '2026-08-20T01:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })
})

describe('listEvents', () => {
  it('returns events overlapping the from/to range', async () => {
    const inRange = await createEvent(userId, {
      title: '範囲内',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })
    await createEvent(userId, {
      title: '範囲外(過去)',
      allDay: false,
      ...range('2026-08-01T01:00:00.000Z', '2026-08-01T02:00:00.000Z'),
    })
    await createEvent(userId, {
      title: '範囲外(未来)',
      allDay: false,
      ...range('2026-09-01T01:00:00.000Z', '2026-09-01T02:00:00.000Z'),
    })

    const result = await listEvents(userId, fromTo('2026-08-20T00:00:00.000Z', '2026-08-21T00:00:00.000Z'))

    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe(inRange.id)
  })

  it('includes events that span across the range boundary', async () => {
    const spanning = await createEvent(userId, {
      title: '跨ぐ予定',
      allDay: false,
      ...range('2026-08-19T23:00:00.000Z', '2026-08-20T01:00:00.000Z'),
    })

    const result = await listEvents(userId, fromTo('2026-08-20T00:00:00.000Z', '2026-08-21T00:00:00.000Z'))

    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe(spanning.id)
  })

  it('only returns events belonging to the given userId', async () => {
    await createEvent(userId, {
      title: '自分の予定',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })
    await createEvent(otherUserId, {
      title: '他人の予定',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    const result = await listEvents(userId, fromTo('2026-08-20T00:00:00.000Z', '2026-08-21T00:00:00.000Z'))

    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('自分の予定')
  })
})

describe('updateEvent', () => {
  it('updates plain fields', async () => {
    const event = await createEvent(userId, {
      title: '元タイトル',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    const updated = await updateEvent(userId, event.id, { title: '新タイトル', location: '会議室A' })

    expect(updated.title).toBe('新タイトル')
    expect(updated.location).toBe('会議室A')
  })

  it('throws BadRequestError when moving startAt after the existing endAt', async () => {
    const event = await createEvent(userId, {
      title: '打ち合わせ',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    await expect(
      updateEvent(userId, event.id, { startAt: new Date('2026-08-20T03:00:00.000Z') }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })

  it('throws NotFoundError for an event belonging to another user', async () => {
    const event = await createEvent(otherUserId, {
      title: '他人の予定',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    await expect(updateEvent(userId, event.id, { title: '書き換え' })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})

describe('getEvent', () => {
  it('throws NotFoundError for a non-existent id', async () => {
    await expect(getEvent(userId, 'nonexistent-id')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('deleteEvent', () => {
  it('deletes the event', async () => {
    const event = await createEvent(userId, {
      title: '削除対象',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    await deleteEvent(userId, event.id)

    await expect(getEvent(userId, event.id)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError when deleting an event belonging to another user', async () => {
    const event = await createEvent(otherUserId, {
      title: '他人の予定',
      allDay: false,
      ...range('2026-08-20T01:00:00.000Z', '2026-08-20T02:00:00.000Z'),
    })

    await expect(deleteEvent(userId, event.id)).rejects.toBeInstanceOf(NotFoundError)
  })
})
