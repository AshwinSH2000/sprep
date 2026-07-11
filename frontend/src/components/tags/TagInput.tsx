import { useState, type KeyboardEvent } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

// Chips + autocomplete tag editor, shared by the entry-creation form and the
// Notes-page filter pills. Purely controlled — the parent owns the tag list.
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add a tag…',
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const name = raw.trim()
    if (!name || value.includes(name)) {
      setDraft('')
      return
    }
    onChange([...value, name])
    setDraft('')
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  // Suggestions not already selected and matching the current draft.
  const matches = suggestions
    .filter((s) => !value.includes(s))
    .filter((s) => draft.trim() === '' || s.toLowerCase().includes(draft.trim().toLowerCase()))
    .slice(0, 6)

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg-card px-2 py-1.5 focus-within:border-accent">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-btn-secondary-bg px-2 py-0.5 text-xs text-btn-secondary-text"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="text-text-muted hover:text-text"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          autoComplete="off"
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-text outline-none placeholder:text-text-muted"
        />
      </div>

      {draft.trim() !== '' && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-card shadow-lg">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                // onMouseDown fires before the input's onBlur, so the click
                // registers instead of being swallowed by blur-adds-draft.
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTag(s)
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-text hover:bg-bg-input"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
