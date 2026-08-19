import type { Event } from '@my-daily-tasks/shared'
import { isoStringToJstDateInput } from '@/lib/jst-date'

const dateTimeFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
})

// <input type="datetime-local"> の値（YYYY-MM-DDTHH:mm）はJSTの日時とみなし、UTCのISO文字列に変換する
export function jstDateTimeInputToIsoString(value: string): string {
  return new Date(`${value}:00+09:00`).toISOString()
}

// APIから受け取ったISO文字列を <input type="datetime-local"> 用のJST日時文字列に変換する
export function isoStringToJstDateTimeInput(iso: string): string {
  // sv-SE ロケールは "YYYY-MM-DD HH:mm:ss" 形式を返すため datetime-local 用に整形する
  const [datePart, timePart] = dateTimeFormatter.format(new Date(iso)).split(' ')
  return `${datePart}T${timePart?.slice(0, 5)}`
}

export function formatEventTimeRange(event: Pick<Event, 'startAt' | 'endAt' | 'allDay'>): string {
  if (event.allDay) {
    return `${isoStringToJstDateInput(event.startAt)} 終日`
  }
  const start = new Date(event.startAt)
  const end = new Date(event.endAt)
  const sameDay = isoStringToJstDateInput(event.startAt) === isoStringToJstDateInput(event.endAt)
  if (sameDay) {
    return `${dateFormatter.format(start)} ${timeFormatter.format(start)}〜${timeFormatter.format(end)}`
  }
  return `${dateFormatter.format(start)} ${timeFormatter.format(start)}〜${dateFormatter.format(end)} ${timeFormatter.format(end)}`
}
