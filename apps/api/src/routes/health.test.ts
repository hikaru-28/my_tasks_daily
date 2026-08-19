import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp()
    const response = await request(app).get('/api/v1/health')
    const body: unknown = response.body

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ status: 'ok', db: 'ok' })
  })
})
