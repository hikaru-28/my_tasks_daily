import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTaskRequest, deleteTaskRequest, fetchTasks, updateTaskRequest } from './api'

const TASK_RESPONSE = {
  id: 't1',
  title: 'タスク',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueAt: null,
  completedAt: null,
  sortOrder: 1024,
  eventId: null,
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

describe('fetchTasks', () => {
  it('requests /api/v1/tasks and parses the list response', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ items: [TASK_RESPONSE], total: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchTasks()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/tasks', expect.objectContaining({ method: 'GET' }))
    expect(result.total).toBe(1)
    expect(result.items[0]?.title).toBe('タスク')
  })

  it('includes query params when provided', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ items: [], total: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchTasks({ status: 'DONE' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/tasks?status=DONE',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})

describe('createTaskRequest', () => {
  it('POSTs the input and parses the created task', async () => {
    const fetchMock = vi.fn(() => jsonResponse(TASK_RESPONSE, 201))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createTaskRequest({ title: 'タスク', priority: 'MEDIUM' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'タスク', priority: 'MEDIUM' }),
      }),
    )
    expect(result.id).toBe('t1')
  })
})

describe('updateTaskRequest', () => {
  it('PATCHes the given id', async () => {
    const fetchMock = vi.fn(() => jsonResponse(TASK_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    await updateTaskRequest('t1', { status: 'DONE' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/tasks/t1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'DONE' }) }),
    )
  })
})

describe('deleteTaskRequest', () => {
  it('DELETEs the given id', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)

    await deleteTaskRequest('t1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/tasks/t1', expect.objectContaining({ method: 'DELETE' }))
  })
})
