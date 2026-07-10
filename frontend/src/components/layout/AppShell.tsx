import { Outlet } from 'react-router-dom'
import { AccountBar } from './AccountBar'
import { CommandPalette } from '../command-palette/CommandPalette'
import { useCommandPalette } from '../command-palette/useCommandPalette'

export function AppShell() {
  const { open, setOpen } = useCommandPalette()

  return (
    <div className="min-h-screen bg-bg text-text">
      <AccountBar />
      <main className="mx-auto max-w-5xl px-6 pb-40 pt-6">
        <Outlet />
      </main>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
