import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchEntries, useTags } from '../../queries/useEntries'
import { EntryCard } from '../dashboard/EntryCard'
import { TagInput } from '../tags/TagInput'

export function NotesPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const { data: allTags = [] } = useTags()

  // Debounce the search input (~300ms) so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: entries = [] } = useSearchEntries(debouncedQuery, tags)
  const hasFilter = debouncedQuery !== '' || tags.length > 0

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">All Notes</h1>
      <p className="mb-6">
        <Link to="/" className="text-sm text-accent hover:text-accent-hover">
          ← Back to Recall
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

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">
          {hasFilter ? 'No results for your search' : 'No notes yet'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} readOnly />
          ))}
        </div>
      )}
    </>
  )
}
