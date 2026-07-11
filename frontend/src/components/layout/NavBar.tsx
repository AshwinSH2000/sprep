import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { downloadExport } from '../../api/stats'
import { useLogout, useMe } from '../../queries/useAuth'
import { useTheme } from '../../lib/useTheme'
import { useClickOutside } from '../../lib/useClickOutside'
import { FaqModal } from '../faq/FaqModal'
import { FloppyDiskIcon, MoonIcon, SunIcon } from './icons'

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/notes', label: 'Notes' },
  { to: '/archive', label: 'Archive' },
  { to: '/stats', label: 'Stats' },
]

export function NavBar() {
  const { data } = useMe()
  const location = useLocation()
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const { theme, toggleTheme } = useTheme()
  const [exportOpen, setExportOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useClickOutside(exportRef, () => setExportOpen(false))
  useClickOutside(accountRef, () => setAccountOpen(false))

  if (!data?.authenticated) return null

  const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username

  function handleExport(format: 'json' | 'md') {
    setExportOpen(false)
    downloadExport(format)
  }

  function handleLogout() {
    setAccountOpen(false)
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  function goToAccountRoute(path: string) {
    setAccountOpen(false)
    navigate(path)
  }

  return (
    <nav className="flex items-center gap-4 border-b border-border px-6 py-3 text-base">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-toggle-bg">
        <FloppyDiskIcon className="h-6 w-6 text-white" />
      </span>

      {LINKS.map(({ to, label }) => {
        const isActive = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={isActive ? 'font-semibold text-text' : 'text-text-secondary hover:text-text'}
          >
            {label}
          </Link>
        )
      })}

      <div className="relative" ref={exportRef}>
        <button
          type="button"
          onClick={() => setExportOpen((open) => !open)}
          className="text-text-secondary hover:text-text"
        >
          Export ▾
        </button>
        {exportOpen && (
          <div className="absolute left-0 top-full z-10 mt-2 w-52 rounded-md border border-border bg-bg-card py-1 shadow-lg">
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

      <button
        type="button"
        onClick={() => setFaqOpen(true)}
        className="text-text-secondary hover:text-text"
      >
        FAQ
      </button>
      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-toggle-bg text-white/90 transition hover:text-white"
        >
          {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>

        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="text-text-secondary hover:text-text"
          >
            {displayName} ▾
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-md border border-border bg-bg-card py-1 shadow-lg">
              <button
                type="button"
                onClick={() => goToAccountRoute('/profile')}
                className="block w-full px-3 py-1.5 text-left text-text-secondary hover:bg-btn-secondary-bg hover:text-text"
              >
                View profile
              </button>
              <button
                type="button"
                onClick={() => goToAccountRoute('/change-password')}
                className="block w-full px-3 py-1.5 text-left text-text-secondary hover:bg-btn-secondary-bg hover:text-text"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-3 py-1.5 text-left text-text-secondary hover:bg-btn-secondary-bg hover:text-text"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
