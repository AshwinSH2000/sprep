import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { downloadExport } from '../../api/stats'
import { useMe } from '../../queries/useAuth'

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/notes', label: 'Notes' },
  { to: '/archive', label: 'Archive' },
  { to: '/stats', label: 'Stats' },
]

export function NavBar() {
  const { data } = useMe()
  const location = useLocation()
  const [exportOpen, setExportOpen] = useState(false)

  if (!data?.authenticated) return null

  function handleExport(format: 'json' | 'md') {
    setExportOpen(false)
    downloadExport(format)
  }

  return (
    <nav className="flex items-center gap-4 border-b border-border px-6 py-2 text-sm">
      {LINKS.map(({ to, label }) => {
        const isActive = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={
              isActive
                ? 'font-semibold text-text'
                : 'text-text-secondary hover:text-text'
            }
          >
            {label}
          </Link>
        )
      })}

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setExportOpen((open) => !open)}
          className="text-text-secondary hover:text-text"
        >
          Export ▾
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-md border border-border bg-bg-card py-1 shadow-lg">
            <button
              type="button"
              onClick={() => handleExport('md')}
              className="block w-full px-3 py-1.5 text-left text-text-secondary hover:bg-btn-secondary-bg hover:text-text"
            >
              Export all notes (Markdown zip)
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="block w-full px-3 py-1.5 text-left text-text-secondary hover:bg-btn-secondary-bg hover:text-text"
            >
              Export all notes (JSON)
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
