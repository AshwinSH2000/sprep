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
