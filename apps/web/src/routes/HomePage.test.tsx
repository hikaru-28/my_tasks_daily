import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/routes/HomePage'

describe('HomePage', () => {
  it('renders the hello heading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Hello, my daily tasks')).toBeInTheDocument()
  })
})
