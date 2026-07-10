import { useState } from 'react'
import type { Entry } from '../../api/types'
import { formatArchivedDate } from '../../lib/formatDate'
import { Markdown } from '../markdown/Markdown'
import { CardActions } from './CardActions'
import { CommentForm } from './CommentForm'
import { CommentsList } from './CommentsList'

interface EntryCardProps {
  entry: Entry
  readOnly?: boolean
  overlay?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

function EntryCardDetails({
  entry,
  readOnly,
}: {
  entry: Entry
  readOnly: boolean
}) {
  return (
    <>
      <Markdown>{entry.body}</Markdown>
      {entry.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-btn-secondary-bg px-2 py-0.5 text-xs text-btn-secondary-text"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <CommentsList comments={entry.comments} />
      {!readOnly && (
        <>
          <CommentForm entryId={entry.id} />
          <CardActions entry={entry} />
        </>
      )}
    </>
  )
}

export function EntryCard({
  entry,
  readOnly = false,
  overlay = false,
  selected = false,
  onToggleSelect,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false)

  const cardHeader = (
    <div className="flex w-full items-start gap-5 px-4 py-4">
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${entry.title}`}
          className="mt-1 h-4 w-4 shrink-0 accent-accent"
        />
      )}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex flex-1 flex-col items-start text-left"
      >
        <span className="font-medium text-text">{entry.title}</span>
        {entry.archived_at && (
          <span className="mt-0.5 text-xs text-text-muted">
            Archived {formatArchivedDate(entry.archived_at)}
          </span>
        )}
      </button>
    </div>
  )

  if (overlay) {
    return (
      <>
        <div className="rounded-lg border border-border bg-bg-card transition hover:border-accent/50">
          {cardHeader}
        </div>

        {expanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-lg border border-border bg-bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 rounded-t-lg border-b border-border bg-bg-card px-4 py-3">
                <div>
                  <span className="font-medium text-text">{entry.title}</span>
                  {entry.archived_at && (
                    <span className="mt-0.5 block text-xs text-text-muted">
                      Archived {formatArchivedDate(entry.archived_at)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-btn-secondary-bg hover:text-text"
                >
                  X
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-3">
                <EntryCardDetails entry={entry} readOnly={readOnly} />
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card transition hover:border-accent/50">
      {cardHeader}

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <EntryCardDetails entry={entry} readOnly={readOnly} />
        </div>
      )}
    </div>
  )
}
