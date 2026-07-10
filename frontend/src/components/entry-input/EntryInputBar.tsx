import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FOCUS_ENTRY_INPUT_EVENT } from '../command-palette/commands'
import { useCreateEntry } from '../../queries/useEntryMutations'

export function EntryInputBar() {
  const [collapsed, setCollapsed] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const createEntry = useCreateEntry()

  useEffect(() => {
    function handleFocusRequest() {
      setCollapsed(false)
      // Wait a tick for the collapsed content to re-render before focusing.
      requestAnimationFrame(() => titleRef.current?.focus())
    }
    document.addEventListener(FOCUS_ENTRY_INPUT_EVENT, handleFocusRequest)
    return () => document.removeEventListener(FOCUS_ENTRY_INPUT_EVENT, handleFocusRequest)
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    createEntry.mutate(
      { title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setTitle('')
          setBody('')
        },
      },
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg-input shadow-[0_-8px_30px_-15px_var(--color-accent)]">
      <div className="mx-auto max-w-5xl px-6">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center py-1 text-text-muted hover:text-text"
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12l5-5 5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {!collapsed && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 pb-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              autoComplete="off"
              required
              className="rounded-md border border-border bg-bg-card px-3 py-2 text-text outline-none focus:border-accent"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What do you want to remember?"
              required
              rows={3}
              className="resize-none rounded-md border border-border bg-bg-card px-3 py-2 text-text outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={createEntry.isPending}
              className="self-end rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover disabled:opacity-60"
            >
              Save
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
