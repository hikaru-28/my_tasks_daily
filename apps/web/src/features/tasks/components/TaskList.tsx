import { useTasks } from '@/features/tasks/hooks'
import { TaskItem } from '@/features/tasks/components/TaskItem'

export function TaskList() {
  const { data, isLoading, isError } = useTasks()

  if (isLoading) {
    return <p>タスクを読み込み中...</p>
  }

  if (isError) {
    return <p className="text-red-600">タスクの取得に失敗しました</p>
  }

  if (!data || data.items.length === 0) {
    return <p className="text-slate-500">タスクはまだありません</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.items.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
