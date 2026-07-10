import { Link } from 'react-router-dom'
import { useArchive } from '../../queries/useEntries'
import { EntryCard } from '../dashboard/EntryCard'

export function ArchivePage() {
  const { data: archived = [] } = useArchive()

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">Archive</h1>
      <p className="mb-6">
        <Link to="/" className="text-sm text-accent hover:text-accent-hover">
          ← Back to Recall
        </Link>
      </p>

      {archived.length === 0 ? (
        <p className="text-sm text-text-muted">No archived entries yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map((entry) => (
            <EntryCard key={entry.id} entry={entry} readOnly />
          ))}
        </div>
      )}
    </>
  )
}
