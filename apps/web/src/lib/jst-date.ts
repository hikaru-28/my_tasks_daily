// <input type="date"> の値（YYYY-MM-DD）はJSTの日付とみなし、UTCのISO文字列に変換する
export function jstDateInputToIsoString(value: string): string {
  return new Date(`${value}T00:00:00+09:00`).toISOString()
}

// APIから受け取ったISO文字列を <input type="date"> 用のJST日付文字列に変換する
export function isoStringToJstDateInput(iso: string | null): string {
  if (!iso) {
    return ''
  }
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
  return formatter.format(new Date(iso))
}
