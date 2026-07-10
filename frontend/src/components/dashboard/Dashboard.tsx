import { useDueEntries, useFlaggedEntries, useTodaysEntries } from '../../queries/useEntries'
import { formatReminderLabel } from '../../lib/formatDate'
import { EntryInputBar } from '../entry-input/EntryInputBar'
import { ReviewSection } from './ReviewSection'
import { TodaysEntriesList } from './TodaysEntriesList'

export function Dashboard() {
  const { data: flagged = {} } = useFlaggedEntries()
  const { data: due = {} } = useDueEntries()
  const { data: today = [] } = useTodaysEntries()

  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">SpRep</h1>
      <p className="mb-6 text-text-secondary">{todayLabel}</p>

      {Object.entries(flagged).map(([reminderDate, entries]) => (
        <ReviewSection
          key={reminderDate}
          label={`Flagged for review — ${formatReminderLabel(reminderDate)}`}
          entries={entries}
        />
      ))}

      {Object.entries(due).map(([label, entries]) => (
        <ReviewSection key={label} label={label} entries={entries} />
      ))}

      <TodaysEntriesList entries={today} />

      <EntryInputBar />
    </>
  )
}
