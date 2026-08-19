import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import { prisma } from '@/lib/prisma'
import { getDevUserId } from '@/services/dev-user-service'

const app = createApp()

beforeEach(async () => {
  const userId = await getDevUserId()
  await prisma.task.deleteMany({ where: { userId } })
})

describe('POST /api/v1/tasks', () => {
  it('creates a task and returns 201', async () => {
    const response = await request(app).post('/api/v1/tasks').send({ title: '新しいタスク' })
    const body: unknown = response.body

    expect(response.status).toBe(201)
    expect(body).toMatchObject({ title: '新しいタスク', status: 'TODO', priority: 'MEDIUM' })
  })

  it('returns 400 VALIDATION_ERROR when title is missing', async () => {
    const response = await request(app).post('/api/v1/tasks').send({})
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })
})

describe('GET /api/v1/tasks', () => {
  it('returns items and total', async () => {
    await request(app).post('/api/v1/tasks').send({ title: 'タスク1' })
    await request(app).post('/api/v1/tasks').send({ title: 'タスク2' })

    const response = await request(app).get('/api/v1/tasks')
    const body: unknown = response.body

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ total: 2 })
  })
})

describe('GET /api/v1/tasks/:id', () => {
  it('returns 404 NOT_FOUND for a well-formed but non-existent id', async () => {
    const response = await request(app).get('/api/v1/tasks/cknonexistent00000000000')
    const body: unknown = response.body

    expect(response.status).toBe(404)
    expect(body).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })

  it('returns 400 VALIDATION_ERROR for a malformed id', async () => {
    const response = await request(app).get('/api/v1/tasks/not-a-cuid')
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })
})

describe('PATCH /api/v1/tasks/:id', () => {
  it('updates title, priority and dueAt', async () => {
    const created = await request(app).post('/api/v1/tasks').send({ title: '元タイトル' })
    const createdBody = created.body as { id: string }

    const response = await request(app)
      .patch(`/api/v1/tasks/${createdBody.id}`)
      .send({ title: '新タイトル', priority: 'HIGH', dueAt: '2026-09-01T00:00:00.000Z' })
    const body: unknown = response.body

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      title: '新タイトル',
      priority: 'HIGH',
      dueAt: '2026-09-01T00:00:00.000Z',
    })
  })

  it('returns 422 UNPROCESSABLE when completing an already done task', async () => {
    const created = await request(app).post('/api/v1/tasks').send({ title: 'タスク' })
    const createdBody = created.body as { id: string }
    await request(app).patch(`/api/v1/tasks/${createdBody.id}`).send({ status: 'DONE' })

    const response = await request(app)
      .patch(`/api/v1/tasks/${createdBody.id}`)
      .send({ status: 'DONE' })
    const body: unknown = response.body

    expect(response.status).toBe(422)
    expect(body).toMatchObject({ error: { code: 'UNPROCESSABLE' } })
  })
})

describe('DELETE /api/v1/tasks/:id', () => {
  it('deletes the task and returns 204', async () => {
    const created = await request(app).post('/api/v1/tasks').send({ title: '削除対象' })
    const createdBody = created.body as { id: string }

    const deleteResponse = await request(app).delete(`/api/v1/tasks/${createdBody.id}`)
    expect(deleteResponse.status).toBe(204)

    const getResponse = await request(app).get(`/api/v1/tasks/${createdBody.id}`)
    expect(getResponse.status).toBe(404)
  })
})
