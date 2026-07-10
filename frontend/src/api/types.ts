export interface Comment {
  id: number
  body: string
  created_at: string
}

export interface Entry {
  id: number
  title: string
  body: string
  created_at: string
  current_stage: number
  reminder_flag: boolean
  archived_at: string | null
  stage_label: string
  due_date: string | null
  is_editable: boolean
  comments: Comment[]
  tags: string[]
}

export interface Tag {
  id: number
  name: string
}

export type DueEntriesResponse = Record<string, Entry[]>

export type MeResponse =
  | { authenticated: true; id: number; username: string }
  | { authenticated: false }
