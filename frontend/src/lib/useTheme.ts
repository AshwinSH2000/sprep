import { useState } from 'react'
import { applyTheme, getStoredTheme, type Theme } from './theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return { theme, toggleTheme }
}
