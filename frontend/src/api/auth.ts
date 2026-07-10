import { client } from './client'
import type { MeResponse } from './types'

export async function bootstrapCsrf(): Promise<void> {
  await client.get('/auth/csrf/')
}

export async function login(username: string, password: string) {
  const { data } = await client.post<{ id: number; username: string }>('/auth/login/', {
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
