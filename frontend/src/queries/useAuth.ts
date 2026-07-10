import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, login, logout } from '../api/auth'
import { queryKeys } from './queryKeys'

export function useMe() {
  return useQuery({ queryKey: queryKeys.auth.me, queryFn: fetchMe })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, { authenticated: true, ...user })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drop every cached query, not just `me` — avoids leaking a previous
      // session's cached entries into the next login in the same tab.
      queryClient.clear()
    },
  })
}
