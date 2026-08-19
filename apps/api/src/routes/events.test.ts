import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import { prisma } from '@/lib/prisma'
import { getDevUserId } from '@/services/dev-user-service'

const app = createApp()

const FROM = '2026-08-20T00:00:00.000Z'
const TO = '2026-08-21T00:00:00.000Z'

beforeEach(async () => {
  const userId = await getDevUserId()
  await prisma.event.deleteMany({ where: { userId } })
})

describe('POST /api/v1/events', () => {
  it('creates an event and returns 201', async () => {
    const response = await request(app)
      .post('/api/v1/events')
      .send({ title: '打ち合わせ', startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    const body: unknown = response.body

    expect(response.status).toBe(201)
    expect(body).toMatchObject({ title: '打ち合わせ', allDay: false })
  })

  it('returns 400 VALIDATION_ERROR when title is missing', async () => {
    const response = await request(app)
      .post('/api/v1/events')
      .send({ startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })

  it('returns 400 BAD_REQUEST when endAt is before startAt', async () => {
    const response = await request(app)
      .post('/api/v1/events')
      .send({ title: '打ち合わせ', startAt: '2026-08-20T02:00:00.000Z', endAt: '2026-08-20T01:00:00.000Z' })
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'BAD_REQUEST' } })
  })
})

describe('GET /api/v1/events', () => {
  it('returns items and total', async () => {
    await request(app)
      .post('/api/v1/events')
      .send({ title: '予定1', startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    await request(app)
      .post('/api/v1/events')
      .send({ title: '予定2', startAt: '2026-08-20T03:00:00.000Z', endAt: '2026-08-20T04:00:00.000Z' })

    const response = await request(app).get('/api/v1/events').query({ from: FROM, to: TO })
    const body: unknown = response.body

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ total: 2 })
  })

  it('returns 400 VALIDATION_ERROR when from/to are missing', async () => {
    const response = await request(app).get('/api/v1/events')
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })
})

describe('GET /api/v1/events/:id', () => {
  it('returns 404 NOT_FOUND for a well-formed but non-existent id', async () => {
    const response = await request(app).get('/api/v1/events/cknonexistent00000000000')
    const body: unknown = response.body

    expect(response.status).toBe(404)
    expect(body).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })
})

describe('PATCH /api/v1/events/:id', () => {
  it('updates title and location', async () => {
    const created = await request(app)
      .post('/api/v1/events')
      .send({ title: '元タイトル', startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    const createdBody = created.body as { id: string }

    const response = await request(app)
      .patch(`/api/v1/events/${createdBody.id}`)
      .send({ title: '新タイトル', location: '会議室A' })
    const body: unknown = response.body

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ title: '新タイトル', location: '会議室A' })
  })

  it('returns 400 BAD_REQUEST when the update makes endAt before startAt', async () => {
    const created = await request(app)
      .post('/api/v1/events')
      .send({ title: '打ち合わせ', startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    const createdBody = created.body as { id: string }

    const response = await request(app)
      .patch(`/api/v1/events/${createdBody.id}`)
      .send({ startAt: '2026-08-20T03:00:00.000Z' })
    const body: unknown = response.body

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: { code: 'BAD_REQUEST' } })
  })
})

describe('DELETE /api/v1/events/:id', () => {
  it('deletes the event and returns 204', async () => {
    const created = await request(app)
      .post('/api/v1/events')
      .send({ title: '削除対象', startAt: '2026-08-20T01:00:00.000Z', endAt: '2026-08-20T02:00:00.000Z' })
    const createdBody = created.body as { id: string }

    const deleteResponse = await request(app).delete(`/api/v1/events/${createdBody.id}`)
    expect(deleteResponse.status).toBe(204)

    const getResponse = await request(app).get(`/api/v1/events/${createdBody.id}`)
    expect(getResponse.status).toBe(404)
  })
})
