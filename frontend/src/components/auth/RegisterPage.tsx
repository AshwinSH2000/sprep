import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../queries/useAuth'
import { getPasswordIssues } from '../../lib/passwordRules'
import { Banner } from '../common/Banner'
import { PasswordInput } from '../common/PasswordInput'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [useEmailAsUsername, setUseEmailAsUsername] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const issues = getPasswordIssues(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const effectiveUsername = useEmailAsUsername ? email : username
  const canSubmit =
    firstName.length > 0 &&
    lastName.length > 0 &&
    email.length > 0 &&
    effectiveUsername.length > 0 &&
    issues.length === 0 &&
    passwordsMatch

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    registerMutation.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        username: effectiveUsername,
        password,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: () => setSuccess(true),
        onError: (err: unknown) => {
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          setError(detail || 'Could not create account. Please try again.')
        },
      },
    )
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6 text-center shadow-[0_0_60px_-15px_var(--color-accent)]">
          <h2 className="mb-2 text-lg font-semibold text-text">Account created successfully</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Log in with your new credentials to get started.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-8 shadow-[0_0_40px_-10px_var(--color-accent)]"
      >
        <h1 className="mb-6 text-2xl font-semibold text-text">Create your account</h1>

        {error && (
          <Banner
            variant="error"
            message={error}
            onClose={() => setError(null)}
            autoDismissMs={5000}
          />
        )}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="first-name">
          First name
        </label>
        <input
          id="first-name"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="last-name">
          Last name
        </label>
        <input
          id="last-name"
          type="text"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent"
        />

        <label className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={useEmailAsUsername}
            onChange={(e) => setUseEmailAsUsername(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Use my email as username
        </label>

        {!useEmailAsUsername && (
          <>
            <label className="mb-1 block text-sm text-text-secondary" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent"
            />
          </>
        )}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="password">
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password.length > 0 && issues.length > 0 && (
          <ul className="mb-4 mt-1 list-disc pl-5 text-xs text-text-muted">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
        {password.length > 0 && issues.length === 0 && <div className="mb-4" />}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="confirm-password">
          Confirm password
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
          disabled={!canSubmit || registerMutation.isPending}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {registerMutation.isPending ? 'Creating account…' : 'Register'}
        </button>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
