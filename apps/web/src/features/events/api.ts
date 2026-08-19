import {
  eventListResponseSchema,
  eventSchema,
  type Event,
  type EventCreateBody,
  type EventListQuery,
  type EventListResponse,
  type EventUpdateBody,
} from '@my-daily-tasks/shared'
import { apiFetch } from '@/lib/apiClient'

export async function fetchEvents(query: EventListQuery): Promise<EventListResponse> {
  const data = await apiFetch('/events', { searchParams: toSearchParams(query) })
  return eventListResponseSchema.parse(data)
}

export async function createEventRequest(input: EventCreateBody): Promise<Event> {
  const data = await apiFetch('/events', { method: 'POST', body: input })
  return eventSchema.parse(data)
}

export async function updateEventRequest(id: string, input: EventUpdateBody): Promise<Event> {
  const data = await apiFetch(`/events/${id}`, { method: 'PATCH', body: input })
  return eventSchema.parse(data)
}

export async function deleteEventRequest(id: string): Promise<void> {
  await apiFetch(`/events/${id}`, { method: 'DELETE' })
}

function toSearchParams(query: EventListQuery): Record<string, string | undefined> {
  return {
    from: query.from.toISOString(),
    to: query.to.toISOString(),
  }
}
