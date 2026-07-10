import { client } from './client'
import type { DueEntriesResponse, Entry, Comment } from './types'

export async function createEntry(title: string, body: string): Promise<Entry> {
  const { data } = await client.post<Entry>('/entries/', { title, body })
  return data
}

export async function fetchToday(): Promise<Entry[]> {
  const { data } = await client.get<Entry[]>('/entries/today/')
  return data
}

export async function fetchDue(): Promise<DueEntriesResponse> {
  const { data } = await client.get<DueEntriesResponse>('/entries/due/')
  return data
}

export async function fetchFlagged(): Promise<Entry[]> {
  const { data } = await client.get<Entry[]>('/entries/flagged/')
  return data
}

export async function fetchArchive(): Promise<Entry[]> {
  const { data } = await client.get<Entry[]>('/entries/archive/')
  return data
}

export async function markDone(id: number): Promise<Entry> {
  const { data } = await client.post<Entry>(`/entries/${id}/done/`)
  return data
}

export async function remindTomorrow(id: number): Promise<Entry> {
  const { data } = await client.post<Entry>(`/entries/${id}/remind/`)
  return data
}

export async function addComment(id: number, body: string): Promise<Comment> {
  const { data } = await client.post<Comment>(`/entries/${id}/comments/`, { body })
  return data
}
