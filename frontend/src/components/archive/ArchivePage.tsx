import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchive } from '../../queries/useEntries'
import { useBulkAction } from '../../queries/useEntryMutations'
import { BulkActionsBar } from '../bulk-actions/BulkActionsBar'
import { EntryCard } from '../dashboard/EntryCard'

export function ArchivePage() {
  const { data: archived = [] } = useArchive()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const bulkAction = useBulkAction()

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  function runBulk(action: 'flag' | 'delete') {
    bulkAction.mutate(
      { ids: selectedIds, action },
      { onSuccess: () => setSelectedIds([]) },
    )
  }

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">Archive</h1>
      <p className="mb-6">
        <Link to="/" className="text-sm text-accent hover:text-accent-hover">
          ← Back to SpRep
        </Link>
      </p>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onFlag={() => runBulk('flag')}
        onDelete={() => runBulk('delete')}
        onClear={() => setSelectedIds([])}
        pending={bulkAction.isPending}
      />

      {archived.length === 0 ? (
        <p className="text-sm text-text-muted">No archived entries yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              readOnly
              selected={selectedIds.includes(entry.id)}
              onToggleSelect={() => toggleSelect(entry.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
