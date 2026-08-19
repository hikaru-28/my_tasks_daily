import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskForm } from './TaskForm'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
}

const EVENT_OPTIONS_RESPONSE = {
  items: [
    {
      id: 'e1',
      title: '打ち合わせ',
      description: null,
      startAt: '2026-08-20T01:00:00.000Z',
      endAt: '2026-08-20T02:00:00.000Z',
      allDay: false,
      location: null,
      createdAt: '2026-08-19T00:00:00.000Z',
      updatedAt: '2026-08-19T00:00:00.000Z',
    },
  ],
  total: 1,
}

describe('TaskForm', () => {
  it('submits the entered title and calls onSuccess', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 't1',
            title: '新しいタスク',
            description: null,
            status: 'TODO',
            priority: 'MEDIUM',
            dueAt: null,
            completedAt: null,
            sortOrder: 1024,
            eventId: null,
            createdAt: '2026-08-19T00:00:00.000Z',
            updatedAt: '2026-08-19T00:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    renderWithClient(<TaskForm mode="create" onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: '新しいタスク' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/tasks', expect.objectContaining({ method: 'POST' }))
  })

  it('includes the selected eventId when creating a task', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('/api/v1/events')) {
        return jsonResponse(EVENT_OPTIONS_RESPONSE)
      }
      if (init?.method === 'POST') {
        return jsonResponse(
          {
            id: 't1',
            title: '新しいタスク',
            description: null,
            status: 'TODO',
            priority: 'MEDIUM',
            dueAt: null,
            completedAt: null,
            sortOrder: 1024,
            eventId: 'e1',
            createdAt: '2026-08-19T00:00:00.000Z',
            updatedAt: '2026-08-19T00:00:00.000Z',
          },
          201,
        )
      }
      return jsonResponse({ items: [], total: 0 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    renderWithClient(<TaskForm mode="create" onSuccess={onSuccess} />)

    await screen.findByText('打ち合わせ')
    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: '新しいタスク' } })
    fireEvent.change(screen.getByLabelText('予定'), { target: { value: 'e1' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/tasks',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"eventId":"e1"'),
      }),
    )
  })
})
