import { useNavigate } from 'react-router-dom'
import { useLogout, useMe } from '../../queries/useAuth'
import { useTheme } from '../../lib/useTheme'

export function AccountBar() {
  const { data } = useMe()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  if (!data?.authenticated) return null

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-3 text-sm text-text-secondary">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="rounded-md px-2 py-1 text-text-secondary transition hover:bg-btn-secondary-bg hover:text-text"
      >
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
      <span>{data.username}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-text-secondary underline decoration-border underline-offset-2 hover:text-text"
      >
        Log out
      </button>
    </div>
  )
}
