import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DayView } from './DayView'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
}

function stubFetchByUrl(handlers: { events?: unknown; tasks?: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/v1/events')) {
        return jsonResponse(handlers.events ?? { items: [], total: 0 })
      }
      return jsonResponse(handlers.tasks ?? { items: [], total: 0 })
    }),
  )
}

describe('DayView', () => {
  it('shows a loading state while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    renderWithClient(<DayView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect(screen.getByText('予定を読み込み中...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no events', async () => {
    stubFetchByUrl({ events: { items: [], total: 0 } })

    renderWithClient(<DayView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect(await screen.findByText('予定はありません')).toBeInTheDocument()
  })

  it('renders event titles once loaded', async () => {
    stubFetchByUrl({
      events: {
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
      },
    })

    renderWithClient(<DayView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect(await screen.findByText('打ち合わせ')).toBeInTheDocument()
  })
})
