import { useState } from 'react'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskList } from '@/features/tasks/components/TaskList'

export function TasksPage() {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">タスク</h1>

      {isCreating ? (
        <TaskForm
          mode="create"
          onSuccess={() => {
            setIsCreating(false)
          }}
          onCancel={() => {
            setIsCreating(false)
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsCreating(true)
          }}
          className="self-start rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + タスクを追加
        </button>
      )}

      <TaskList />
    </main>
  )
}
