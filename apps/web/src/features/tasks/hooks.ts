import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TaskCreateBody, TaskListQuery, TaskUpdateBody } from '@my-daily-tasks/shared'
import { createTaskRequest, deleteTaskRequest, fetchTasks, updateTaskRequest } from '@/features/tasks/api'

const taskKeys = {
  all: ['tasks'] as const,
  list: (query?: TaskListQuery) => ['tasks', 'list', query ?? {}] as const,
}

export function useTasks(query?: TaskListQuery) {
  return useQuery({ queryKey: taskKeys.list(query), queryFn: () => fetchTasks(query) })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskCreateBody) => createTaskRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdateBody }) => updateTaskRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTaskRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
