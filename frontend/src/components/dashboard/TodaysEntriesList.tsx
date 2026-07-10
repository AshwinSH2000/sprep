import type { Entry } from '../../api/types'

interface TodaysEntriesListProps {
  entries: Entry[]
}

export function TodaysEntriesList({ entries }: TodaysEntriesListProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Written today
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">No entries yet today. Write something below.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border bg-bg-card px-4 py-3">
              <div className="font-medium text-text">{entry.title}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                {entry.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
