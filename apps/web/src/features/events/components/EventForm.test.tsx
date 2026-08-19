import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventForm } from './EventForm'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('EventForm', () => {
  it('submits the entered title and calls onSuccess', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'e1',
            title: '新しい予定',
            description: null,
            startAt: '2026-08-20T01:00:00.000Z',
            endAt: '2026-08-20T02:00:00.000Z',
            allDay: false,
            location: null,
            createdAt: '2026-08-19T00:00:00.000Z',
            updatedAt: '2026-08-19T00:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const onSuccess = vi.fn()

    renderWithClient(<EventForm mode="create" onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: '新しい予定' } })
    fireEvent.change(screen.getByLabelText('開始'), { target: { value: '2026-08-20T10:00' } })
    fireEvent.change(screen.getByLabelText('終了'), { target: { value: '2026-08-20T11:00' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/events', expect.objectContaining({ method: 'POST' }))
  })

  it('shows a validation error when endAt is before startAt', () => {
    vi.stubGlobal('fetch', vi.fn())
    const onSuccess = vi.fn()

    renderWithClient(<EventForm mode="create" onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: '新しい予定' } })
    fireEvent.change(screen.getByLabelText('開始'), { target: { value: '2026-08-20T11:00' } })
    fireEvent.change(screen.getByLabelText('終了'), { target: { value: '2026-08-20T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByText('終了は開始以降にしてください')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
