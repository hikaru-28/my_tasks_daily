import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { NotFoundError, UnprocessableError } from '@/errors/app-error'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '@/services/task-service'
import { createEvent } from '@/services/event-service'

const TEST_USER_EMAIL = 'task-service-test@example.com'
const OTHER_USER_EMAIL = 'task-service-test-other@example.com'

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
  await prisma.task.deleteMany({ where: { userId: { in: [userId, otherUserId] } } })
  await prisma.event.deleteMany({ where: { userId: { in: [userId, otherUserId] } } })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } })
})

describe('createTask', () => {
  it('assigns sortOrder in increments of 1024 within the same status', async () => {
    const first = await createTask(userId, { title: '1件目', priority: 'MEDIUM' })
    const second = await createTask(userId, { title: '2件目', priority: 'MEDIUM' })

    expect(first.sortOrder).toBe(1024)
    expect(second.sortOrder).toBe(2048)
  })

  it('defaults optional fields', async () => {
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })

    expect(task.description).toBeNull()
    expect(task.dueAt).toBeNull()
    expect(task.status).toBe('TODO')
  })

  it('links to an event when eventId is provided', async () => {
    const event = await createEvent(userId, {
      title: '打ち合わせ',
      allDay: false,
      startAt: new Date('2026-08-20T01:00:00.000Z'),
      endAt: new Date('2026-08-20T02:00:00.000Z'),
    })

    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM', eventId: event.id })

    expect(task.eventId).toBe(event.id)
  })

  it('throws NotFoundError when eventId belongs to another user', async () => {
    const event = await createEvent(otherUserId, {
      title: '他人の予定',
      allDay: false,
      startAt: new Date('2026-08-20T01:00:00.000Z'),
      endAt: new Date('2026-08-20T02:00:00.000Z'),
    })

    await expect(
      createTask(userId, { title: 'タスク', priority: 'MEDIUM', eventId: event.id }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('listTasks', () => {
  it('filters by status', async () => {
    await createTask(userId, { title: 'TODOタスク', priority: 'MEDIUM' })
    const doing = await createTask(userId, { title: 'DOINGタスク', priority: 'MEDIUM' })
    await updateTask(userId, doing.id, { status: 'DOING' })

    const result = await listTasks(userId, { status: 'DOING' })

    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('DOINGタスク')
  })

  it('filters by dueBefore', async () => {
    await createTask(userId, {
      title: '期限あり',
      priority: 'MEDIUM',
      dueAt: new Date('2026-08-01T00:00:00.000Z'),
    })
    await createTask(userId, {
      title: '期限先',
      priority: 'MEDIUM',
      dueAt: new Date('2026-12-01T00:00:00.000Z'),
    })

    const result = await listTasks(userId, { dueBefore: new Date('2026-09-01T00:00:00.000Z') })

    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('期限あり')
  })

  it('filters by q against title and description', async () => {
    await createTask(userId, { title: '牛乳を買う', priority: 'MEDIUM' })
    await createTask(userId, { title: '掃除する', priority: 'MEDIUM', description: '牛乳パックも捨てる' })
    await createTask(userId, { title: '無関係', priority: 'MEDIUM' })

    const result = await listTasks(userId, { q: '牛乳' })

    expect(result.total).toBe(2)
  })

  it('only returns tasks belonging to the given userId', async () => {
    await createTask(userId, { title: '自分のタスク', priority: 'MEDIUM' })
    await createTask(otherUserId, { title: '他人のタスク', priority: 'MEDIUM' })

    const result = await listTasks(userId, {})

    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('自分のタスク')
  })
})

describe('updateTask', () => {
  it('updates plain fields', async () => {
    const task = await createTask(userId, { title: '元タイトル', priority: 'LOW' })

    const updated = await updateTask(userId, task.id, { title: '新タイトル', priority: 'HIGH' })

    expect(updated.title).toBe('新タイトル')
    expect(updated.priority).toBe('HIGH')
  })

  it('clears description when explicitly set to null', async () => {
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM', description: '説明' })

    const updated = await updateTask(userId, task.id, { description: null })

    expect(updated.description).toBeNull()
  })

  it('sets completedAt when status becomes DONE', async () => {
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })

    const updated = await updateTask(userId, task.id, { status: 'DONE' })

    expect(updated.status).toBe('DONE')
    expect(updated.completedAt).not.toBeNull()
  })

  it('clears completedAt when status moves away from DONE', async () => {
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })
    await updateTask(userId, task.id, { status: 'DONE' })

    const updated = await updateTask(userId, task.id, { status: 'TODO' })

    expect(updated.status).toBe('TODO')
    expect(updated.completedAt).toBeNull()
  })

  it('throws UnprocessableError when re-completing an already done task', async () => {
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })
    await updateTask(userId, task.id, { status: 'DONE' })

    await expect(updateTask(userId, task.id, { status: 'DONE' })).rejects.toBeInstanceOf(
      UnprocessableError,
    )
  })

  it('throws NotFoundError for a task belonging to another user', async () => {
    const task = await createTask(otherUserId, { title: '他人のタスク', priority: 'MEDIUM' })

    await expect(updateTask(userId, task.id, { title: '書き換え' })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('links to an event and clears the link when eventId is set to null', async () => {
    const event = await createEvent(userId, {
      title: '打ち合わせ',
      allDay: false,
      startAt: new Date('2026-08-20T01:00:00.000Z'),
      endAt: new Date('2026-08-20T02:00:00.000Z'),
    })
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })

    const linked = await updateTask(userId, task.id, { eventId: event.id })
    expect(linked.eventId).toBe(event.id)

    const unlinked = await updateTask(userId, task.id, { eventId: null })
    expect(unlinked.eventId).toBeNull()
  })

  it('throws NotFoundError when linking to another user\'s event', async () => {
    const event = await createEvent(otherUserId, {
      title: '他人の予定',
      allDay: false,
      startAt: new Date('2026-08-20T01:00:00.000Z'),
      endAt: new Date('2026-08-20T02:00:00.000Z'),
    })
    const task = await createTask(userId, { title: 'タスク', priority: 'MEDIUM' })

    await expect(updateTask(userId, task.id, { eventId: event.id })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})

describe('getTask', () => {
  it('throws NotFoundError for a non-existent id', async () => {
    await expect(getTask(userId, 'nonexistent-id')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('deleteTask', () => {
  it('deletes the task', async () => {
    const task = await createTask(userId, { title: '削除対象', priority: 'MEDIUM' })

    await deleteTask(userId, task.id)

    await expect(getTask(userId, task.id)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError when deleting a task belonging to another user', async () => {
    const task = await createTask(otherUserId, { title: '他人のタスク', priority: 'MEDIUM' })

    await expect(deleteTask(userId, task.id)).rejects.toBeInstanceOf(NotFoundError)
  })
})
