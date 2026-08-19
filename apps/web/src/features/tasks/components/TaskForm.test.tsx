import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskForm } from './TaskForm'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
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
})
