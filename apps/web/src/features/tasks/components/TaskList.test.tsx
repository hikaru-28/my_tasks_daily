import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskList } from './TaskList'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('TaskList', () => {
  it('shows a loading state while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    renderWithClient(<TaskList />)

    expect(screen.getByText('タスクを読み込み中...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no tasks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], total: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    renderWithClient(<TaskList />)

    expect(await screen.findByText('タスクはまだありません')).toBeInTheDocument()
  })

  it('renders task titles once loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: 't1',
                  title: '牛乳を買う',
                  description: null,
                  status: 'TODO',
                  priority: 'MEDIUM',
                  dueAt: null,
                  completedAt: null,
                  sortOrder: 1024,
                  eventId: null,
                  createdAt: '2026-08-19T00:00:00.000Z',
                  updatedAt: '2026-08-19T00:00:00.000Z',
                },
              ],
              total: 1,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )

    renderWithClient(<TaskList />)

    expect(await screen.findByText('牛乳を買う')).toBeInTheDocument()
  })
})
