import { useQuery } from '@tanstack/react-query'
import {
  fetchAllEntries,
  fetchArchive,
  fetchDue,
  fetchFlagged,
  fetchTags,
  fetchToday,
} from '../api/entries'
import { queryKeys } from './queryKeys'

export function useTodaysEntries() {
  return useQuery({ queryKey: queryKeys.entries.today, queryFn: fetchToday })
}

export function useDueEntries() {
  return useQuery({ queryKey: queryKeys.entries.due, queryFn: fetchDue })
}

export function useFlaggedEntries() {
  return useQuery({ queryKey: queryKeys.entries.flagged, queryFn: fetchFlagged })
}

export function useArchive() {
  return useQuery({ queryKey: queryKeys.entries.archive, queryFn: fetchArchive })
}

export function useSearchEntries(query: string, tags: string[]) {
  return useQuery({
    queryKey: queryKeys.entries.search(query, tags),
    queryFn: () => fetchAllEntries(query, tags),
  })
}

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags.all, queryFn: fetchTags })
}
