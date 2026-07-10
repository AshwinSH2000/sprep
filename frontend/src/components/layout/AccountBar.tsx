import { useNavigate } from 'react-router-dom'
import { useLogout, useMe } from '../../queries/useAuth'

export function AccountBar() {
  const { data } = useMe()
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  if (!data?.authenticated) return null

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-3 text-sm text-text-secondary">
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
