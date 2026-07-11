interface FaqModalProps {
  open: boolean
  onClose: () => void
}

export function FaqModal({ open, onClose }: FaqModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-bg-card shadow-[0_0_60px_-15px_var(--color-accent)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">FAQ &amp; Guide</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-text-secondary">
          <section>
            <h3 className="mb-1 text-base font-semibold text-text">What is SpRep?</h3>
            <p>
              SpRep is a personal journal built around spaced repetition. You write entries the
              same way you'd write any note — no flashcards, no formatting required — and the app
              automatically brings each entry back in front of you on a schedule proven to help
              things stick in long-term memory. You just write; SpRep handles when you see it
              again.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">Adding an entry</h3>
            <p>
              Use the entry bar pinned to the bottom of the Dashboard: give it a title and a body
              (Markdown is supported — bold, italics, lists, and links all render), then submit.
              It appears immediately under "Written today," and its first review is scheduled two
              days out.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">What does "Done" do?</h3>
            <p>
              Clicking <strong>Done</strong> on a card logs that you reviewed it and advances it to
              the next stage in the schedule: Day 2 → 4 → 8 → 14 → 28 → 56 → 90. Each stage
              spaces the review further apart as the memory strengthens. After the Day 90 review,
              the entry is marked Archived and moves to the read-only Archive page — it won't come
              back for review again.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">
              Reviewing on your own schedule
            </h3>
            <p>
              Not ready to act on an entry yet? Instead of Done, use{' '}
              <strong>Remind me tomorrow</strong> for a quick one-day snooze, or{' '}
              <strong>Pick a date…</strong> to flag it for review on any specific day you choose.
              Flagged entries show up in their own section on the Dashboard, grouped by the date
              you picked, separate from the regular due-today list.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">
              What if I forget to review something?
            </h3>
            <p>
              Nothing is lost and nothing gets skipped. An entry simply stays in its due section
              on the Dashboard — whether it was due today or three weeks ago — until you open it
              and click Done or reschedule it. There's no penalty for a missed day; the schedule
              only moves forward when you actually interact with the entry.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">Dashboard vs. Notes vs. Archive</h3>
            <p>
              <strong>Dashboard</strong> is your home base — it shows anything flagged for review,
              one section per day that has entries due, and everything you wrote today.{' '}
              <strong>Notes</strong> is a searchable list of every entry you've ever written,
              filterable by text and by tag, for when you want to browse or look something up
              rather than wait for it to come due. <strong>Archive</strong> is read-only and holds
              entries that have completed the full review cycle (Day 90 and beyond).
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">Tags, Stats, and Export</h3>
            <p>
              Tag entries as you write them and filter by tag on the Notes page. The{' '}
              <strong>Stats</strong> page charts your writing and review activity over time,
              including your current streak and on-time review rate. Use{' '}
              <strong>Export</strong> in the nav bar to download everything you've written as a
              Markdown zip or a single JSON file at any time.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-base font-semibold text-text">Other shortcuts</h3>
            <p>
              Press <strong>Cmd/Ctrl+K</strong> anywhere to open the command palette for quick
              keyboard access to every page and action above. The sun/moon icon in the top bar
              switches between light and dark themes, and your preference is remembered on this
              device.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
