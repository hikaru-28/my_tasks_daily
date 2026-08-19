import { useState } from 'react'
import { EventForm } from '@/features/events/components/EventForm'
import { DayView } from '@/features/events/components/DayView'
import { WeekView } from '@/features/events/components/WeekView'

type ViewMode = 'day' | 'week'

export function EventsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">予定</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setViewMode('day')
          }}
          className={
            viewMode === 'day'
              ? 'rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700'
          }
        >
          日
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('week')
          }}
          className={
            viewMode === 'week'
              ? 'rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700'
          }
        >
          週
        </button>
      </div>

      {isCreating ? (
        <EventForm
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
          + 予定を追加
        </button>
      )}

      {viewMode === 'day' ? (
        <DayView date={currentDate} onDateChange={setCurrentDate} />
      ) : (
        <WeekView date={currentDate} onDateChange={setCurrentDate} />
      )}
    </main>
  )
}
