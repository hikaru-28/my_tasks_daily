const jstDateFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
const jstWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  weekday: 'short',
})

export function addDays(date: Date, days: number): Date {
  const jstDateOnly = jstDateFormatter.format(date)
  const shifted = new Date(`${jstDateOnly}T00:00:00+09:00`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted
}

// dateを含むJSTの1日（00:00〜翌日00:00）をUTCで返す
export function getDayRange(date: Date): { from: Date; to: Date } {
  const jstDateOnly = jstDateFormatter.format(date)
  const from = new Date(`${jstDateOnly}T00:00:00+09:00`)
  const to = addDays(from, 1)
  return { from, to }
}

// dateを含むJSTの週（月曜00:00〜翌週月曜00:00）をUTCで返す
export function getWeekRange(date: Date): { from: Date; to: Date } {
  const weekday = jstWeekdayFormatter.format(date)
  const weekdayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday)
  const { from: dayStart } = getDayRange(date)
  const from = addDays(dayStart, -weekdayIndex)
  const to = addDays(from, 7)
  return { from, to }
}
