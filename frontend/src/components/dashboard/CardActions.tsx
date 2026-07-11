import { useState } from 'react'
import type { Entry } from '../../api/types'
import { useMarkDone, useRemindTomorrow } from '../../queries/useEntryMutations'

interface CardActionsProps {
  entry: Entry
}

export function CardActions({ entry }: CardActionsProps) {
  const markDone = useMarkDone()
  const remindTomorrow = useRemindTomorrow()
  const [pickingDate, setPickingDate] = useState(false)
  const [date, setDate] = useState('')

  function remindOn(isoDate?: string) {
    remindTomorrow.mutate({ id: entry.id, date: isoDate })
    setPickingDate(false)
    setDate('')
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => markDone.mutate(entry.id)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-text transition hover:bg-accent-hover"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => remindOn()}
          className="rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover"
        >
          Remind me tomorrow
        </button>
        <button
          type="button"
          onClick={() => setPickingDate((prev) => !prev)}
          className="rounded-md bg-btn-secondary-bg px-3 py-1.5 text-sm text-btn-secondary-text transition hover:bg-btn-secondary-hover"
        >
          Pick a date…
        </button>
      </div>

      {pickingDate && (
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-bg-input px-2 py-1 text-sm text-text outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={!date}
            onClick={() => remindOn(date)}
            className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-text transition hover:bg-accent-hover disabled:opacity-60"
          >
            Set
          </button>
        </div>
      )}
    </div>
  )
}
