import { useState, type SubmitEvent } from 'react'
import type { Event, EventCreateBody, EventUpdateBody } from '@my-daily-tasks/shared'
import { useCreateEvent, useUpdateEvent } from '@/features/events/hooks'
import { addDays } from '@/features/events/lib/date-range'
import { isoStringToJstDateTimeInput, jstDateTimeInputToIsoString } from '@/features/events/lib/format-date'
import { isoStringToJstDateInput, jstDateInputToIsoString } from '@/lib/jst-date'

type EventFormProps = {
  mode: 'create' | 'edit'
  initialValue?: Event
  onSuccess: () => void
  onCancel?: () => void
}

export function EventForm({ mode, initialValue, onSuccess, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [location, setLocation] = useState(initialValue?.location ?? '')
  const [allDay, setAllDay] = useState(initialValue?.allDay ?? false)
  const [startDateTime, setStartDateTime] = useState(
    isoStringToJstDateTimeInput(initialValue?.startAt ?? new Date().toISOString()),
  )
  const [endDateTime, setEndDateTime] = useState(
    isoStringToJstDateTimeInput(initialValue?.endAt ?? new Date().toISOString()),
  )
  const [allDayDate, setAllDayDate] = useState(
    isoStringToJstDateInput(initialValue?.startAt ?? new Date().toISOString()),
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const isSubmitting = createEvent.isPending || updateEvent.isPending
  const errorMessage = validationError ?? createEvent.error?.message ?? updateEvent.error?.message

  function toStartEndIso(): { startAt: string; endAt: string } {
    if (allDay) {
      const startDate = new Date(jstDateInputToIsoString(allDayDate))
      const endDate = addDays(startDate, 1)
      return { startAt: startDate.toISOString(), endAt: endDate.toISOString() }
    }
    return {
      startAt: jstDateTimeInputToIsoString(startDateTime),
      endAt: jstDateTimeInputToIsoString(endDateTime),
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    const { startAt, endAt } = toStartEndIso()
    if (new Date(endAt) < new Date(startAt)) {
      setValidationError('終了は開始以降にしてください')
      return
    }

    if (mode === 'create') {
      const body: EventCreateBody = {
        title,
        startAt,
        endAt,
        allDay,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
      }
      createEvent.mutate(body, { onSuccess })
      return
    }

    if (!initialValue) {
      return
    }
    const body: EventUpdateBody = {
      title,
      startAt,
      endAt,
      allDay,
      description: description.trim() ? description.trim() : null,
      location: location.trim() ? location.trim() : null,
    }
    updateEvent.mutate({ id: initialValue.id, input: body }, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="event-title" className="text-sm font-medium text-slate-700">
          タイトル
        </label>
        <input
          id="event-title"
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
        <label htmlFor="event-description" className="text-sm font-medium text-slate-700">
          説明
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value)
          }}
          className="rounded border border-slate-300 px-2 py-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="event-all-day"
          type="checkbox"
          checked={allDay}
          onChange={(event) => {
            setAllDay(event.target.checked)
          }}
        />
        <label htmlFor="event-all-day" className="text-sm font-medium text-slate-700">
          終日
        </label>
      </div>

      {allDay ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="event-all-day-date" className="text-sm font-medium text-slate-700">
            日付
          </label>
          <input
            id="event-all-day-date"
            type="date"
            required
            value={allDayDate}
            onChange={(event) => {
              setAllDayDate(event.target.value)
            }}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="event-start-at" className="text-sm font-medium text-slate-700">
              開始
            </label>
            <input
              id="event-start-at"
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(event) => {
                setStartDateTime(event.target.value)
              }}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="event-end-at" className="text-sm font-medium text-slate-700">
              終了
            </label>
            <input
              id="event-end-at"
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(event) => {
                setEndDateTime(event.target.value)
              }}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="event-location" className="text-sm font-medium text-slate-700">
          場所
        </label>
        <input
          id="event-location"
          type="text"
          value={location}
          onChange={(event) => {
            setLocation(event.target.value)
          }}
          className="rounded border border-slate-300 px-2 py-1"
        />
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
