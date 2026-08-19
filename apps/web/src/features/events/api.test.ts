import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEventRequest, deleteEventRequest, fetchEvents, updateEventRequest } from './api'

const EVENT_RESPONSE = {
  id: 'e1',
  title: '打ち合わせ',
  description: null,
  startAt: '2026-08-20T01:00:00.000Z',
  endAt: '2026-08-20T02:00:00.000Z',
  allDay: false,
  location: null,
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchEvents', () => {
  it('requests /api/v1/events with the required from/to query params', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ items: [EVENT_RESPONSE], total: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchEvents({
      from: new Date('2026-08-20T00:00:00.000Z'),
      to: new Date('2026-08-21T00:00:00.000Z'),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/events?from=2026-08-20T00%3A00%3A00.000Z&to=2026-08-21T00%3A00%3A00.000Z',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('打ち合わせ')
  })
})

describe('createEventRequest', () => {
  it('POSTs the input and parses the created event', async () => {
    const fetchMock = vi.fn(() => jsonResponse(EVENT_RESPONSE, 201))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createEventRequest({
      title: '打ち合わせ',
      startAt: '2026-08-20T01:00:00.000Z',
      endAt: '2026-08-20T02:00:00.000Z',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/events',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.id).toBe('e1')
  })
})

describe('updateEventRequest', () => {
  it('PATCHes the given id', async () => {
    const fetchMock = vi.fn(() => jsonResponse(EVENT_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    await updateEventRequest('e1', { title: '新タイトル' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/events/e1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ title: '新タイトル' }) }),
    )
  })
})

describe('deleteEventRequest', () => {
  it('DELETEs the given id', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)

    await deleteEventRequest('e1')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/events/e1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
