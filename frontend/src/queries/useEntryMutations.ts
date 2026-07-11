import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addComment, bulkAction, createEntry, markDone, remindTomorrow } from '../api/entries'
import type { Comment, DueEntriesResponse, Entry, FlaggedEntriesResponse } from '../api/types'
import { queryKeys } from './queryKeys'

// FlaggedEntriesResponse is grouped by reminder_date the same way
// DueEntriesResponse is grouped by stage label, so both can share this.
function removeFromGrouped<T extends Record<string, Entry[]>>(
  grouped: T | undefined,
  id: number,
): T {
  if (!grouped) return {} as T
  const next = {} as T
  for (const [label, entries] of Object.entries(grouped)) {
    const filtered = entries.filter((e) => e.id !== id)
    // Omit the label entirely once its group is empty — mirrors the backend,
    // which never returns empty stage groups, and the "hide empty sections"
    // rule from the legacy templates. Leaving [] here would flash an empty
    // section before the next invalidated fetch corrects it.
    if (filtered.length > 0) (next as Record<string, Entry[]>)[label] = filtered
  }
  return next
}

export function useCreateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, body, tags }: { title: string; body: string; tags: string[] }) =>
      createEntry(title, body, tags),
    onMutate: async ({ title, body, tags }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.today })
      const previous = queryClient.getQueryData<Entry[]>(queryKeys.entries.today)
      const optimisticEntry: Entry = {
        id: -Date.now(),
        title,
        body,
        created_at: new Date().toISOString().slice(0, 10),
        current_stage: 0,
        reminder_flag: false,
        reminder_date: null,
        archived_at: null,
        stage_label: '',
        due_date: null,
        is_editable: true,
        comments: [],
        tags,
      }
      queryClient.setQueryData<Entry[]>(queryKeys.entries.today, (old) => [
        ...(old ?? []),
        optimisticEntry,
      ])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.entries.today, context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.today })
      // A submit may have introduced brand-new tags — refresh autocomplete.
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })
}

export function useMarkDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markDone(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.due })
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.flagged })

      const previousDue = queryClient.getQueryData<DueEntriesResponse>(queryKeys.entries.due)
      const previousFlagged = queryClient.getQueryData<FlaggedEntriesResponse>(
        queryKeys.entries.flagged,
      )

      queryClient.setQueryData<DueEntriesResponse>(queryKeys.entries.due, (old) =>
        removeFromGrouped(old, id),
      )
      queryClient.setQueryData<FlaggedEntriesResponse>(queryKeys.entries.flagged, (old) =>
        removeFromGrouped(old, id),
      )

      return { previousDue, previousFlagged }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.entries.due, context?.previousDue)
      queryClient.setQueryData(queryKeys.entries.flagged, context?.previousFlagged)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.due })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.flagged })
      // Entry may have just reached stage 8.
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.archive })
    },
  })
}

export function useRemindTomorrow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date }: { id: number; date?: string }) => remindTomorrow(id, date),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.due })
      const previousDue = queryClient.getQueryData<DueEntriesResponse>(queryKeys.entries.due)
      queryClient.setQueryData<DueEntriesResponse>(queryKeys.entries.due, (old) =>
        removeFromGrouped(old, id),
      )
      return { previousDue }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.entries.due, context?.previousDue)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.due })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.flagged })
    },
  })
}

function patchEntryComments(entry: Entry, comment: Comment): Entry {
  return { ...entry, comments: [...entry.comments, comment] }
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, body }: { entryId: number; body: string }) =>
      addComment(entryId, body),
    // Matches the legacy vanilla-JS behavior: comments are appended to the
    // DOM only after the server confirms, not optimistically.
    onSuccess: (comment, { entryId }) => {
      queryClient.setQueryData<Entry[]>(queryKeys.entries.today, (old) =>
        old?.map((e) => (e.id === entryId ? patchEntryComments(e, comment) : e)),
      )
      queryClient.setQueryData<Entry[]>(queryKeys.entries.archive, (old) =>
        old?.map((e) => (e.id === entryId ? patchEntryComments(e, comment) : e)),
      )
      queryClient.setQueryData<DueEntriesResponse>(queryKeys.entries.due, (old) => {
        if (!old) return old
        const next: DueEntriesResponse = {}
        for (const [label, entries] of Object.entries(old)) {
          next[label] = entries.map((e) =>
            e.id === entryId ? patchEntryComments(e, comment) : e,
          )
        }
        return next
      })
      queryClient.setQueryData<FlaggedEntriesResponse>(queryKeys.entries.flagged, (old) => {
        if (!old) return old
        const next: FlaggedEntriesResponse = {}
        for (const [label, entries] of Object.entries(old)) {
          next[label] = entries.map((e) =>
            e.id === entryId ? patchEntryComments(e, comment) : e,
          )
        }
        return next
      })
    },
  })
}

export function useBulkAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'flag' | 'delete' }) =>
      bulkAction(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.due })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.flagged })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.archive })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.searchAll })
    },
  })
}
