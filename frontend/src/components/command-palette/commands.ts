import type { NavigateFunction } from 'react-router-dom'

// EntryInputBar listens for this to expand itself and focus the title field.
export const FOCUS_ENTRY_INPUT_EVENT = 'recall:focus-entry-input'

export interface Command {
  id: string
  label: string
  run: () => void
}

interface BuildCommandsArgs {
  navigate: NavigateFunction
  onLogout: () => void
}

export function buildCommands({ navigate, onLogout }: BuildCommandsArgs): Command[] {
  return [
    { id: 'go-home', label: 'Go to Recall', run: () => navigate('/') },
    { id: 'go-archive', label: 'Go to Archive', run: () => navigate('/archive') },
    {
      id: 'focus-input',
      label: 'Focus new entry input',
      run: () => document.dispatchEvent(new CustomEvent(FOCUS_ENTRY_INPUT_EVENT)),
    },
    { id: 'logout', label: 'Log out', run: onLogout },
  ]
}
