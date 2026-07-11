import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe, useUpdateProfile } from '../../queries/useAuth'
import { Banner } from '../common/Banner'

const INPUT_CLASSES =
  'mb-4 w-full rounded-md border border-border bg-bg-input px-3 py-2 text-text outline-none focus:border-accent'

export function ProfilePage() {
  const { data } = useMe()
  const navigate = useNavigate()
  const updateMutation = useUpdateProfile()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data?.authenticated) {
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setEmail(data.email)
    }
  }, [data])

  if (!data?.authenticated) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    updateMutation.mutate(
      { first_name: firstName, last_name: lastName, email },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <>
      <h1 className="text-3xl font-semibold text-text">Profile</h1>
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
        {updateMutation.isError && (
          <Banner
            variant="error"
            message="Could not update profile. Please try again."
            onClose={() => updateMutation.reset()}
            autoDismissMs={5000}
          />
        )}
        {saved && (
          <Banner
            variant="success"
            message="Profile updated."
            onClose={() => setSaved(false)}
            autoDismissMs={5000}
          />
        )}

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="first-name">
          First name
        </label>
        <input
          id="first-name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={INPUT_CLASSES}
        />

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="last-name">
          Last name
        </label>
        <input
          id="last-name"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={INPUT_CLASSES}
        />

        <label className="mb-1 block text-sm text-text-secondary" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASSES}
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-md bg-btn-secondary-bg px-4 py-2 font-medium text-btn-secondary-text transition hover:bg-btn-secondary-hover"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 rounded-md bg-accent px-4 py-2 font-medium text-accent-text transition hover:bg-accent-hover disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Updating…' : 'Update'}
          </button>
        </div>
      </form>
    </>
  )
}
