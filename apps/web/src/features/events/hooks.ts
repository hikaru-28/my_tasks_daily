import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EventCreateBody, EventListQuery, EventUpdateBody } from '@my-daily-tasks/shared'
import {
  createEventRequest,
  deleteEventRequest,
  fetchEvents,
  updateEventRequest,
} from '@/features/events/api'

const eventKeys = {
  all: ['events'] as const,
  list: (query: EventListQuery) => ['events', 'list', query] as const,
}

export function useEvents(query: EventListQuery) {
  return useQuery({ queryKey: eventKeys.list(query), queryFn: () => fetchEvents(query) })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EventCreateBody) => createEventRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EventUpdateBody }) =>
      updateEventRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEventRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}
