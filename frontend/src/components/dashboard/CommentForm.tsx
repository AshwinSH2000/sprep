import { useState, type FormEvent } from 'react'
import { useAddComment } from '../../queries/useEntryMutations'

interface CommentFormProps {
  entryId: number
}

export function CommentForm({ entryId }: CommentFormProps) {
  const [body, setBody] = useState('')
  const addComment = useAddComment()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    addComment.mutate(
      { entryId, body: trimmed },
      { onSuccess: () => setBody('') },
    )
  }

  return (
    <div className="mt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          autoComplete="off"
          required
          className="flex-1 rounded-md border border-border bg-bg-input px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={addComment.isPending}
          className="rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {addComment.isError && (
        <p className="mt-1 text-xs text-error">Could not add comment. Please try again.</p>
      )}
    </div>
  )
}
