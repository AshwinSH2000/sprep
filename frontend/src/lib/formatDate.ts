// Mirrors the legacy Django template filter 'j M, g:i A', e.g. "10 Jul, 2:53 PM".
export function formatCommentDate(isoString: string): string {
  const date = new Date(isoString)
  const datePart = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    date,
  )
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
  return `${datePart}, ${timePart}`
}

// Mirrors the legacy 'j M Y' filter used for archived_at, e.g. "10 Jul 2026".
export function formatArchivedDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString))
}

// Labels a flagged section grouped by reminder_date (Phase 16). "Unscheduled"
// passes through unchanged (legacy flagged entries with no reminder_date).
export function formatReminderLabel(dateOrLabel: string): string {
  if (dateOrLabel === 'Unscheduled') return dateOrLabel
  const [year, month, day] = dateOrLabel.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}
