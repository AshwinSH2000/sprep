import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../queries/useAuth'
import { FaqModal } from '../faq/FaqModal'
import { buildCommands } from './commands'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [faqOpen, setFaqOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const logoutMutation = useLogout()

  const commands = buildCommands({
    navigate,
    onLogout: () => logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') }),
    onOpenFaq: () => setFaqOpen(true),
  })
  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      inputRef.current?.focus()
    }
  }, [open])

  function runAndClose(run: () => void) {
    run()
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-32"
          onClick={onClose}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-bg-card shadow-[0_0_60px_-15px_var(--color-accent)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command…"
              className="w-full border-b border-border bg-transparent px-4 py-3 text-text outline-none placeholder:text-text-muted"
            />
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-2 text-sm text-text-muted">No matching commands</li>
              )}
              {filtered.map((command) => (
                <li key={command.id}>
                  <button
                    type="button"
                    onClick={() => runAndClose(command.run)}
                    className="w-full px-4 py-2 text-left text-text hover:bg-bg-input"
                  >
                    {command.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  )
}
