import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../../queries/useAuth'

export function RequireAuth() {
  const { data, isLoading } = useMe()

  if (isLoading) {
    return <div className="p-8 text-text-muted">Loading…</div>
  }

  if (!data?.authenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
