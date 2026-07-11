import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useChangePassword } from '../../queries/useAuth'
import { getPasswordIssues } from '../../lib/passwordRules'
import { Banner } from '../common/Banner'
import { PasswordInput } from '../common/PasswordInput'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const changePasswordMutation = useChangePassword()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const issues = getPasswordIssues(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = oldPassword.length > 0 && issues.length === 0 && passwordsMatch

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    changePasswordMutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => setSuccess(true),
        onError: (err: unknown) => {
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          setError(detail || 'Could not change password. Please try again.')
        },
      },
    )
  }

  function goToLogin() {
    // The backend already destroyed the session — drop the local cache too
    // so nothing on the way to /login still thinks we're authenticated.
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6 text-center shadow-[0_0_60px_-15px_var(--color-accent)]">
          <h2 className="mb-2 text-lg font-semibold text-text">Password changed successfully</h2>
          <p className="mb-6 text-sm text-text-secondary">
            You are required to log in with your new password now.
          </p>
          <button
            type="button"
            onClick={goToLogin}
            className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">Change password</h1>
      <p className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-accent hover:text-accent-hover"
        >
          ← Back
        </button>
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm rounded-xl border border-border bg-bg-card p-6"
      >
        {error && (
          <Banner
            variant="error"
            message={error}
            onClose={() => setError(null)}
            autoDismissMs={5000}
          />
        )}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="old-password">
          Old password
        </label>
        <PasswordInput
          id="old-password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          wrapperClassName="mb-4"
        />

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="new-password">
          New password
        </label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {newPassword.length > 0 && issues.length > 0 && (
          <ul className="mb-4 mt-1 list-disc pl-5 text-xs text-text-muted">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
        {newPassword.length > 0 && issues.length === 0 && <div className="mb-4" />}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="confirm-password">
          Confirm new password
        </label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {confirmPassword.length > 0 && !passwordsMatch ? (
          <p className="mb-4 mt-1 text-xs text-error">Passwords do not match</p>
        ) : (
          <div className="mb-4" />
        )}

        <button
          type="submit"
          disabled={!canSubmit || changePasswordMutation.isPending}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {changePasswordMutation.isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}
