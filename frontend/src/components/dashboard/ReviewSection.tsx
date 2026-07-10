import type { Entry } from '../../api/types'
import { EntryCard } from './EntryCard'

interface ReviewSectionProps {
  label: string
  entries: Entry[]
}

export function ReviewSection({ label, entries }: ReviewSectionProps) {
  if (entries.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  )
}
