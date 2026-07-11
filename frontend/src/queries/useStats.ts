import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '../api/stats'
import { queryKeys } from './queryKeys'

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats.all, queryFn: fetchStats })
}
