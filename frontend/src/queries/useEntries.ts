import { useQuery } from '@tanstack/react-query'
import { fetchArchive, fetchDue, fetchFlagged, fetchToday } from '../api/entries'
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
