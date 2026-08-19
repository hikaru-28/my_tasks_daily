const dueDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
})

export function formatDueDate(iso: string | null): string {
  if (!iso) {
    return '期限なし'
  }
  return dueDateFormatter.format(new Date(iso))
}
