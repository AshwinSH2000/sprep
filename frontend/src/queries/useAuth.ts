import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePassword, fetchMe, login, logout, updateProfile } from '../api/auth'
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
      queryClient.setQueryData(queryKeys.auth.me, user)
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

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user)
    },
  })
}

// Deliberately does not clear the query cache on success — the backend
// already destroyed the session (see ChangePasswordAPIView), but the
// success screen needs `me` to stay "authenticated" for a moment so
// RequireAuth doesn't yank the user away before they can read the prompt
// telling them to log back in. ChangePasswordPage clears the cache itself
// right before navigating to /login.
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changePassword(oldPassword, newPassword),
  })
}
