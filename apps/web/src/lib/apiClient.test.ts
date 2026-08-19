import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './apiClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ hello: 'world' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    const result = await apiFetch('/tasks')
    expect(result).toEqual({ hello: 'world' })
  })

  it('returns undefined for a 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))))

    const result = await apiFetch('/tasks/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiError parsed from the error response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'task not found', details: {} } }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )

    await expect(apiFetch('/tasks/1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
      message: 'task not found',
    })
  })

  it('falls back to INTERNAL_ERROR when the error body is unrecognized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ unexpected: true }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    await expect(apiFetch('/tasks')).rejects.toBeInstanceOf(ApiError)
  })
})
