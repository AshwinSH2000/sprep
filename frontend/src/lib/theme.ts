export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'recall-theme'

export function getStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}

// Called once in main.tsx before the app renders, so there's no flash of
// the wrong theme on load.
export function initTheme() {
  applyTheme(getStoredTheme())
}
