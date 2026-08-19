import {
  taskListResponseSchema,
  taskSchema,
  type Task,
  type TaskCreateBody,
  type TaskListQuery,
  type TaskListResponse,
  type TaskUpdateBody,
} from '@my-daily-tasks/shared'
import { apiFetch } from '@/lib/apiClient'

export async function fetchTasks(query: TaskListQuery = {}): Promise<TaskListResponse> {
  const data = await apiFetch('/tasks', { searchParams: toSearchParams(query) })
  return taskListResponseSchema.parse(data)
}

export async function createTaskRequest(input: TaskCreateBody): Promise<Task> {
  const data = await apiFetch('/tasks', { method: 'POST', body: input })
  return taskSchema.parse(data)
}

export async function updateTaskRequest(id: string, input: TaskUpdateBody): Promise<Task> {
  const data = await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: input })
  return taskSchema.parse(data)
}

export async function deleteTaskRequest(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}`, { method: 'DELETE' })
}

function toSearchParams(query: TaskListQuery): Record<string, string | undefined> {
  return {
    status: query.status,
    dueBefore: query.dueBefore?.toISOString(),
    tagId: query.tagId,
    eventId: query.eventId,
    q: query.q,
  }
}
