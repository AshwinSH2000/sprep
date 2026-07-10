import { Link } from 'react-router-dom'
import { useDueEntries, useFlaggedEntries, useTodaysEntries } from '../../queries/useEntries'
import { EntryInputBar } from '../entry-input/EntryInputBar'
import { ReviewSection } from './ReviewSection'
import { TodaysEntriesList } from './TodaysEntriesList'

export function Dashboard() {
  const { data: flagged = [] } = useFlaggedEntries()
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
      <h1 className="text-3xl font-semibold text-text">Recall</h1>
      <p className="mb-1 text-text-secondary">{todayLabel}</p>
      <p className="mb-6">
        <Link to="/archive" className="text-sm text-accent hover:text-accent-hover">
          View archive →
        </Link>
      </p>

      <ReviewSection label="Flagged for review" entries={flagged} />

      {Object.entries(due).map(([label, entries]) => (
        <ReviewSection key={label} label={label} entries={entries} />
      ))}

      <TodaysEntriesList entries={today} />

      <EntryInputBar />
    </>
  )
}
