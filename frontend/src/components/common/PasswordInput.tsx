import { useState, type ChangeEvent } from 'react'
import { EyeIcon, EyeSlashIcon } from '../layout/icons'

const BASE_INPUT_CLASSES =
  'w-full rounded-md border border-border bg-bg-input px-3 py-2 pr-10 text-text outline-none focus:border-accent'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  required?: boolean
  wrapperClassName?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required,
  wrapperClassName,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`relative ${wrapperClassName ?? ''}`}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        className={BASE_INPUT_CLASSES}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text"
      >
        {visible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  )
}
