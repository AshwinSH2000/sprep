import { useEffect } from 'react'

interface BannerProps {
  message: string
  variant: 'error' | 'success'
  onClose: () => void
  autoDismissMs?: number
}

const VARIANT_CLASSES: Record<BannerProps['variant'], string> = {
  error: 'border-error/40 bg-error/10 text-error',
  success: 'border-accent/40 bg-accent/10 text-accent-hover',
}

// Inline, dismissible banner — used in place of native browser alert()s so
// error/success messaging matches the app theme and doesn't block the UI.
export function Banner({ message, variant, onClose, autoDismissMs }: BannerProps) {
  useEffect(() => {
    if (!autoDismissMs) return
    const timer = setTimeout(onClose, autoDismissMs)
    return () => clearTimeout(timer)
  }, [autoDismissMs, onClose])

  return (
    <div
      role="alert"
      className={`mb-4 flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 leading-none text-current opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
