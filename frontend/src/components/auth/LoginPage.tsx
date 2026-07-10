import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../../queries/useAuth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const loginMutation = useLogin()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    loginMutation.mutate(
      { username, password },
      { onSuccess: () => navigate('/') },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-8 shadow-[0_0_40px_-10px_var(--color-accent)]"
      >
        <h1 className="mb-6 text-2xl font-semibold text-text">SpRep</h1>
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
        <label className="mb-1 block text-sm text-text-secondary" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent"
        />
        {loginMutation.isError && (
          <p className="mb-4 text-sm text-error">Invalid credentials</p>
        )}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover disabled:opacity-60"
        >
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
