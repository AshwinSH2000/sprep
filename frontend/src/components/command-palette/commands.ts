import type { NavigateFunction } from 'react-router-dom'
import { downloadExport } from '../../api/stats'

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
  onOpenFaq: () => void
}

export function buildCommands({ navigate, onLogout, onOpenFaq }: BuildCommandsArgs): Command[] {
  return [
    { id: 'go-home', label: 'Go to SpRep', run: () => navigate('/') },
    { id: 'go-archive', label: 'Go to Archive', run: () => navigate('/archive') },
    { id: 'browse-notes', label: 'Browse all notes', run: () => navigate('/notes') },
    { id: 'go-stats', label: 'View stats', run: () => navigate('/stats') },
    { id: 'export-md', label: 'Export all notes (Markdown zip)', run: () => downloadExport('md') },
    { id: 'export-json', label: 'Export all notes (JSON)', run: () => downloadExport('json') },
    {
      id: 'focus-input',
      label: 'Focus new entry input',
      run: () => document.dispatchEvent(new CustomEvent(FOCUS_ENTRY_INPUT_EVENT)),
    },
    { id: 'open-faq', label: 'Open FAQ & Guide', run: onOpenFaq },
    { id: 'logout', label: 'Log out', run: onLogout },
  ]
}
