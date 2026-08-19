import { API_BASE_PATH, apiErrorResponseSchema } from '@my-daily-tasks/shared'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  searchParams?: Record<string, string | undefined>
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const url = buildUrl(path, options.searchParams)
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    ...(options.body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) }
      : {}),
  })

  if (response.status === 204) {
    return undefined
  }

  const data: unknown = await response.json()

  if (!response.ok) {
    throw toApiError(response.status, data)
  }

  return data
}

function toApiError(status: number, data: unknown): ApiError {
  const parsed = apiErrorResponseSchema.safeParse(data)
  if (parsed.success) {
    const { code, message, details } = parsed.data.error
    return new ApiError(status, code, message, details)
  }
  return new ApiError(status, 'INTERNAL_ERROR', 'unexpected error response', data)
}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>): string {
  const url = new URL(`${API_BASE_PATH}${path}`, window.location.origin)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, value)
      }
    }
  }
  return `${url.pathname}${url.search}`
}
