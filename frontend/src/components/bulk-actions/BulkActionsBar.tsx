import { useState } from 'react'

interface BulkActionsBarProps {
  selectedCount: number
  onFlag: () => void
  onDelete: () => void
  onClear: () => void
  pending?: boolean
}

// Shared selection toolbar for the Notes and Archive pages (Phase 17).
// Delete is the one destructive action in the app so far, so it requires an
// explicit second click to confirm rather than firing immediately.
export function BulkActionsBar({
  selectedCount,
  onFlag,
  onDelete,
  onClear,
  pending = false,
}: BulkActionsBarProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (selectedCount === 0) return null

  function handleDeleteClick() {
    if (confirmingDelete) {
      onDelete()
      setConfirmingDelete(false)
    } else {
      setConfirmingDelete(true)
    }
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-bg-card px-4 py-2.5">
      <span className="text-sm text-text-secondary">
        {selectedCount} selected
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={onFlag}
        className="rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover disabled:opacity-60"
      >
        Flag for review
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDeleteClick}
        className={
          confirmingDelete
            ? 'rounded-md bg-error px-3 py-1.5 text-sm font-medium text-accent-text transition disabled:opacity-60'
            : 'rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover disabled:opacity-60'
        }
      >
        {confirmingDelete ? 'Confirm delete?' : 'Delete'}
      </button>
      {confirmingDelete && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(false)}
          className="text-sm text-text-secondary hover:text-text"
        >
          Cancel
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-sm text-text-secondary hover:text-text"
      >
        Clear selection
      </button>
    </div>
  )
}
