import { useState } from 'react'
import type { Entry } from '../../api/types'
import { formatArchivedDate } from '../../lib/formatDate'
import { CardActions } from './CardActions'
import { CommentForm } from './CommentForm'
import { CommentsList } from './CommentsList'

interface EntryCardProps {
  entry: Entry
  readOnly?: boolean
}

export function EntryCard({ entry, readOnly = false }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-bg-card transition hover:border-accent/50">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full flex-col items-start px-4 py-3 text-left"
      >
        <span className="font-medium text-text">{entry.title}</span>
        {entry.archived_at && (
          <span className="mt-0.5 text-xs text-text-muted">
            Archived {formatArchivedDate(entry.archived_at)}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-text-secondary">{entry.body}</p>
          <CommentsList comments={entry.comments} />
          {!readOnly && (
            <>
              <CommentForm entryId={entry.id} />
              <CardActions entry={entry} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
