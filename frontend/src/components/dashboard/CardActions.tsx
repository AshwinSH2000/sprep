import type { Entry } from '../../api/types'
import { useMarkDone, useRemindTomorrow } from '../../queries/useEntryMutations'

interface CardActionsProps {
  entry: Entry
}

export function CardActions({ entry }: CardActionsProps) {
  const markDone = useMarkDone()
  const remindTomorrow = useRemindTomorrow()

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => markDone.mutate(entry.id)}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-text transition hover:bg-accent-hover"
      >
        Done
      </button>
      <button
        type="button"
        onClick={() => remindTomorrow.mutate(entry.id)}
        className="rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover"
      >
        Remind me tomorrow
      </button>
    </div>
  )
}
