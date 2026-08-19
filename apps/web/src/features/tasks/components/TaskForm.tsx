import { useState, type SubmitEvent } from 'react'
import type { Task, TaskCreateBody, TaskPriority, TaskUpdateBody } from '@my-daily-tasks/shared'
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks'
import { isoStringToJstDateInput, jstDateInputToIsoString } from '@/lib/jst-date'

type TaskFormProps = {
  mode: 'create' | 'edit'
  initialValue?: Task
  onSuccess: () => void
  onCancel?: () => void
}

export function TaskForm({ mode, initialValue, onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(initialValue?.priority ?? 'MEDIUM')
  const [dueAt, setDueAt] = useState(isoStringToJstDateInput(initialValue?.dueAt ?? null))

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const isSubmitting = createTask.isPending || updateTask.isPending
  const errorMessage = createTask.error?.message ?? updateTask.error?.message

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === 'create') {
      const body: TaskCreateBody = {
        title,
        priority,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(dueAt ? { dueAt: jstDateInputToIsoString(dueAt) } : {}),
      }
      createTask.mutate(body, { onSuccess })
      return
    }

    if (!initialValue) {
      return
    }
    const body: TaskUpdateBody = {
      title,
      priority,
      description: description.trim() ? description.trim() : null,
      dueAt: dueAt ? jstDateInputToIsoString(dueAt) : null,
    }
    updateTask.mutate({ id: initialValue.id, input: body }, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="task-title" className="text-sm font-medium text-slate-700">
          タイトル
        </label>
        <input
          id="task-title"
          type="text"
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
          }}
          className="rounded border border-slate-300 px-2 py-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="task-description" className="text-sm font-medium text-slate-700">
          説明
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value)
          }}
          className="rounded border border-slate-300 px-2 py-1"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="task-priority" className="text-sm font-medium text-slate-700">
            優先度
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as TaskPriority)
            }}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="task-due-at" className="text-sm font-medium text-slate-700">
            期限
          </label>
          <input
            id="task-due-at"
            type="date"
            value={dueAt}
            onChange={(event) => {
              setDueAt(event.target.value)
            }}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {mode === 'create' ? '追加' : '保存'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}
