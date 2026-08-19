import { useState } from 'react'
import type { Task } from '@my-daily-tasks/shared'
import { useDeleteTask, useUpdateTask } from '@/features/tasks/hooks'
import { formatDueDate } from '@/features/tasks/lib/format-date'
import { TaskForm } from '@/features/tasks/components/TaskForm'

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
}

type TaskItemProps = {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  function handleToggleDone() {
    updateTask.mutate({
      id: task.id,
      input: { status: task.status === 'DONE' ? 'TODO' : 'DONE' },
    })
  }

  function handleDelete() {
    if (window.confirm(`「${task.title}」を削除しますか？`)) {
      deleteTask.mutate(task.id)
    }
  }

  if (isEditing) {
    return (
      <TaskForm
        mode="edit"
        initialValue={task}
        onSuccess={() => {
          setIsEditing(false)
        }}
        onCancel={() => {
          setIsEditing(false)
        }}
      />
    )
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
      <input
        type="checkbox"
        checked={task.status === 'DONE'}
        onChange={handleToggleDone}
        className="mt-1"
        aria-label={`${task.title}を完了にする`}
      />
      <div className="flex-1">
        <p className={task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'}>
          {task.title}
        </p>
        {task.description && <p className="text-sm text-slate-500">{task.description}</p>}
        <p className="text-xs text-slate-400">
          優先度: {PRIORITY_LABEL[task.priority]} / 期限: {formatDueDate(task.dueAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setIsEditing(true)
          }}
          className="text-sm text-slate-600 underline"
        >
          編集
        </button>
        <button type="button" onClick={handleDelete} className="text-sm text-red-600 underline">
          削除
        </button>
      </div>
    </li>
  )
}
