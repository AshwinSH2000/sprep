import { client } from './client'
import type { AuthenticatedUser, MeResponse } from './types'

export async function bootstrapCsrf(): Promise<void> {
  await client.get('/auth/csrf/')
}

export async function register(payload: {
  first_name: string
  last_name: string
  email: string
  username: string
  password: string
  confirm_password: string
}): Promise<void> {
  await client.post('/auth/register/', payload)
}

export async function login(username: string, password: string) {
  const { data } = await client.post<AuthenticatedUser>('/auth/login/', {
    username,
    password,
  })
  return data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout/')
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await client.get<MeResponse>('/auth/me/')
  return data
}

export async function updateProfile(profile: {
  first_name: string
  last_name: string
  email: string
}): Promise<AuthenticatedUser> {
  const { data } = await client.patch<AuthenticatedUser>('/auth/profile/', profile)
  return data
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await client.post('/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  })
}
