import { client } from './client'
import type { StatsResponse } from './types'

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await client.get<StatsResponse>('/stats/')
  return data
}

// Phase 15 exports are plain GET downloads — Content-Disposition: attachment
// makes the browser save the file without leaving the SPA, and the session
// cookie rides along automatically.
export function downloadExport(format: 'json' | 'md') {
  window.location.href = `/api/entries/export/?format=${format}`
}
