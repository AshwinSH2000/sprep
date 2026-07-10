// Single source of truth for query-key arrays — import these everywhere
// instead of writing literal ['entries', 'due'] etc. inline.
export const queryKeys = {
  entries: {
    today: ['entries', 'today'] as const,
    due: ['entries', 'due'] as const,
    flagged: ['entries', 'flagged'] as const,
    archive: ['entries', 'archive'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
}
