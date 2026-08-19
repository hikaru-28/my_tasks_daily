import type { Event } from '@my-daily-tasks/shared'
import { useEvents } from '@/features/events/hooks'
import { addDays, getWeekRange } from '@/features/events/lib/date-range'
import { EventItem } from '@/features/events/components/EventItem'
import { isoStringToJstDateInput } from '@/lib/jst-date'

type WeekViewProps = {
  date: Date
  onDateChange: (date: Date) => void
}

const weekdayFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
})

export function WeekView({ date, onDateChange }: WeekViewProps) {
  const { from, to } = getWeekRange(date)
  const { data, isLoading, isError } = useEvents({ from, to })

  const days = Array.from({ length: 7 }, (_, index) => addDays(from, index))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onDateChange(addDays(date, -7))
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          前週
        </button>
        <button
          type="button"
          onClick={() => {
            onDateChange(new Date())
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          今週
        </button>
        <button
          type="button"
          onClick={() => {
            onDateChange(addDays(date, 7))
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          翌週
        </button>
      </div>

      {isLoading && <p>予定を読み込み中...</p>}
      {isError && <p className="text-red-600">予定の取得に失敗しました</p>}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {days.map((day) => (
            <DayColumn key={day.toISOString()} day={day} events={data?.items ?? []} />
          ))}
        </div>
      )}
    </div>
  )
}

function DayColumn({ day, events }: { day: Date; events: Event[] }) {
  const dayKey = isoStringToJstDateInput(day.toISOString())
  const dayEvents = events
    .filter((event) => isoStringToJstDateInput(event.startAt) === dayKey)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-700">{weekdayFormatter.format(day)}</p>
      {dayEvents.length === 0 ? (
        <p className="text-xs text-slate-400">予定なし</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dayEvents.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  )
}
