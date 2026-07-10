import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchEntries, useTags } from '../../queries/useEntries'
import { useBulkAction } from '../../queries/useEntryMutations'
import { BulkActionsBar } from '../bulk-actions/BulkActionsBar'
import { EntryCard } from '../dashboard/EntryCard'
import { TagInput } from '../tags/TagInput'

export function NotesPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const { data: allTags = [] } = useTags()
  const bulkAction = useBulkAction()

  // Debounce the search input (~300ms) so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: entries = [] } = useSearchEntries(debouncedQuery, tags)
  const hasFilter = debouncedQuery !== '' || tags.length > 0

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
      <h1 className="text-3xl font-semibold text-text">All Notes</h1>
      <p className="mb-6">
        <Link to="/" className="text-sm text-accent hover:text-accent-hover">
          ← Back to SpRep
        </Link>
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes…"
        className="mb-3 w-full rounded-lg border border-border bg-bg-input px-4 py-2 text-text outline-none placeholder:text-text-muted focus:border-accent"
      />
      <div className="mb-6">
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={allTags.map((t) => t.name)}
          placeholder="Filter by tag…"
        />
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onFlag={() => runBulk('flag')}
        onDelete={() => runBulk('delete')}
        onClear={() => setSelectedIds([])}
        pending={bulkAction.isPending}
      />

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">
          {hasFilter ? 'No results for your search' : 'No notes yet'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              readOnly
              overlay
              selected={selectedIds.includes(entry.id)}
              onToggleSelect={() => toggleSelect(entry.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
