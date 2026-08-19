import { useState } from 'react'
import type { Event } from '@my-daily-tasks/shared'
import { useDeleteEvent } from '@/features/events/hooks'
import { formatEventTimeRange } from '@/features/events/lib/format-date'
import { EventForm } from '@/features/events/components/EventForm'
import { useTasks } from '@/features/tasks/hooks'

type EventItemProps = {
  event: Event
}

export function EventItem({ event }: EventItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const deleteEvent = useDeleteEvent()
  const { data: linkedTasks } = useTasks({ eventId: event.id })

  function handleDelete() {
    if (window.confirm(`「${event.title}」を削除しますか？`)) {
      deleteEvent.mutate(event.id)
    }
  }

  if (isEditing) {
    return (
      <EventForm
        mode="edit"
        initialValue={event}
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
      <div className="min-w-0 flex-1">
        <p className="break-words text-slate-900">{event.title}</p>
        <p className="text-xs text-slate-400">{formatEventTimeRange(event)}</p>
        {event.location && <p className="text-sm text-slate-500">場所: {event.location}</p>}
        {event.description && <p className="text-sm text-slate-500">{event.description}</p>}
        {linkedTasks && linkedTasks.items.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {linkedTasks.items.map((task) => (
              <li key={task.id} className="text-xs text-slate-500">
                ・{task.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => {
            setIsEditing(true)
          }}
          className="text-sm whitespace-nowrap text-slate-600 underline"
        >
          編集
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm whitespace-nowrap text-red-600 underline"
        >
          削除
        </button>
      </div>
    </li>
  )
}
