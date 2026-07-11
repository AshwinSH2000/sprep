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
  reminder_date: string | null
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
// Grouped by reminder_date (ISO date string, or "Unscheduled") — same shape
// as DueEntriesResponse (Phase 16).
export type FlaggedEntriesResponse = Record<string, Entry[]>

export interface BulkActionResult {
  flagged?: number
  deleted?: number
}

export interface WeeklyCount {
  week_start: string
  count: number
}

export interface StageCount {
  stage: number
  label: string
  count: number
}

export interface ReviewActivity {
  total_reviews: number
  on_time: number
  late: number
  on_time_rate: number | null
}

export interface StatsResponse {
  entries_per_week: WeeklyCount[]
  stage_distribution: StageCount[]
  review_activity: ReviewActivity
  current_streak: number
}

export interface AuthenticatedUser {
  authenticated: true
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}

export type MeResponse = AuthenticatedUser | { authenticated: false }
