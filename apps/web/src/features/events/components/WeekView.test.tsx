import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeekView } from './WeekView'

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
    vi.fn((url: string) => {
      if (url.includes('/api/v1/events')) {
        return jsonResponse(handlers.events ?? { items: [], total: 0 })
      }
      return jsonResponse(handlers.tasks ?? { items: [], total: 0 })
    }),
  )
}

describe('WeekView', () => {
  it('shows a loading state while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    renderWithClient(<WeekView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect(screen.getByText('予定を読み込み中...')).toBeInTheDocument()
  })

  it('shows an empty-per-day label when there are no events', async () => {
    stubFetchByUrl({ events: { items: [], total: 0 } })

    renderWithClient(<WeekView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect((await screen.findAllByText('予定なし')).length).toBeGreaterThan(0)
  })

  it('renders event titles grouped into the correct day', async () => {
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

    renderWithClient(<WeekView date={new Date('2026-08-20T00:00:00.000Z')} onDateChange={vi.fn()} />)

    expect(await screen.findByText('打ち合わせ')).toBeInTheDocument()
  })
})
