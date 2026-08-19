import type { Event } from '@my-daily-tasks/shared'
import { useEvents } from '@/features/events/hooks'
import { addDays, getDayRange } from '@/features/events/lib/date-range'
import { EventItem } from '@/features/events/components/EventItem'

type DayViewProps = {
  date: Date
  onDateChange: (date: Date) => void
}

export function DayView({ date, onDateChange }: DayViewProps) {
  const { from, to } = getDayRange(date)
  const { data, isLoading, isError } = useEvents({ from, to })

  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    dateStyle: 'full',
  }).format(date)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onDateChange(addDays(date, -1))
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          前日
        </button>
        <button
          type="button"
          onClick={() => {
            onDateChange(new Date())
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          今日
        </button>
        <button
          type="button"
          onClick={() => {
            onDateChange(addDays(date, 1))
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          翌日
        </button>
        <span className="text-sm font-medium text-slate-700">{dateLabel}</span>
      </div>

      {renderBody(data?.items, isLoading, isError)}
    </div>
  )
}

function renderBody(items: Event[] | undefined, isLoading: boolean, isError: boolean) {
  if (isLoading) {
    return <p>予定を読み込み中...</p>
  }

  if (isError) {
    return <p className="text-red-600">予定の取得に失敗しました</p>
  }

  if (!items || items.length === 0) {
    return <p className="text-slate-500">予定はありません</p>
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((event) => (
        <EventItem key={event.id} event={event} />
      ))}
    </ul>
  )
}
