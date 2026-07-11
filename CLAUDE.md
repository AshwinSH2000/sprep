# CLAUDE.md — Recall (Spaced Repetition Journal)

This file is the authoritative guide for working on this codebase.
Read it in full before making any changes.

---

## Project summary

Recall is a personal, web-hosted spaced repetition journal built with Django.
Users write notes (entries). The app automatically resurfaces each entry on
scientifically-spaced intervals so the user can review and reinforce long-term
memory. No flashcard authoring — write naturally, the system handles scheduling.

---

## Tech stack (locked — do not deviate)

| Layer     | Choice                          | Notes                                              |
|-----------|----------------------------------|-----------------------------------------------------|
| Backend   | Django + Django REST Framework   | Django owns models/admin/auth; DRF serves a pure JSON API under `/api/` |
| Frontend  | React (Vite, TypeScript)         | Single-page app in `frontend/`, no server-rendered templates |
| Styling   | Tailwind CSS only                | No MUI, no Bootstrap, no other CSS framework       |
| State     | TanStack React Query             | Server-state cache, optimistic updates for card actions |
| Database  | PostgreSQL                       | Local dev on localhost:5432                        |

As of Phase 8/9, Django no longer renders any user-facing HTML. Its templating
engine still exists only because `django.contrib.admin` needs it — `/admin/`
is the one surface Django still renders directly.

---

## Directory structure

```
recall/               ← Django project config
  settings.py
  urls.py              ← routes only /admin/ and /api/ (include journal.api_urls)
  wsgi.py

journal/              ← main app (all domain logic lives here)
  models.py           ← Entry, ReviewLog, Comment — single source of truth
  serializers.py      ← DRF serializers (EntrySerializer, CommentSerializer)
  api_views.py         ← DRF views for entries/comments (one class per concern)
  api_auth.py           ← DRF views for csrf/login/logout/me
  api_urls.py          ← all /api/ routes, app_name='journal_api'
  admin.py
  migrations/

frontend/              ← React SPA (Vite + TypeScript + Tailwind)
  vite.config.ts        ← dev server on :5173, proxies /api/* to Django on :8000
  src/
    main.tsx            ← bootstraps CSRF cookie, mounts QueryClientProvider + BrowserRouter
    App.tsx              ← route table
    index.css            ← Tailwind import + @theme color tokens (dark blue palette)
    api/                 ← axios client + typed endpoint wrapper functions
    queries/              ← React Query hooks (queryKeys, useEntries, useEntryMutations, useAuth)
    components/
      layout/             ← AppShell, AccountBar, NavBar
      auth/                ← LoginPage, RequireAuth
      dashboard/           ← Dashboard, ReviewSection, TodaysEntriesList, EntryCard,
                              CommentsList, CommentForm, CardActions
      entry-input/          ← EntryInputBar (collapsible create-entry form)
      archive/              ← ArchivePage
      command-palette/      ← CommandPalette, useCommandPalette, commands.ts
    lib/formatDate.ts       ← comment/archived-date display formatting

manage.py
CLAUDE.md             ← this file
```

---

## The data model (locked — do not alter field names or types)

### Entry
```
id               BigAutoField (PK)
user             FK → User (required)
title            CharField(max_length=255)
body             TextField
created_at       DateField (date only — not datetime)
current_stage    PositiveSmallIntegerField (0–8)
reminder_flag    BooleanField (default False)
reminder_date    DateField (nullable; Phase 16 — set alongside reminder_flag)
archived_at      DateTimeField (nullable)
tags             ManyToManyField → Tag (Phase 12; blank=True)
```

### Tag (added Phase 12 — first change to the locked model)
```
id               BigAutoField (PK)
user             FK → User (required)
name             CharField(max_length=50)
                 unique_together(user, name) — tags are per-user
```

Tags are always scoped to the entry's own user: `EntrySerializer` get-or-creates
`Tag` rows under `request.user`, never crossing users, exactly like every other
Entry/Comment lookup. Everything else in this data model remains locked.

### ReviewLog
```
id               BigAutoField (PK)
entry            FK → Entry
stage_reviewed   PositiveSmallIntegerField
reviewed_at      DateTimeField
```

### Comment
```
id               BigAutoField (PK)
entry            FK → Entry
body             TextField
created_at       DateTimeField
```

### Stage map

| current_stage | Meaning              | Due (days after created_at) |
|---------------|----------------------|-----------------------------|
| 0             | Just created, not due yet | —                      |
| 1             | Awaiting Day 2 review     | 2                      |
| 2             | Awaiting Day 4 review     | 4                      |
| 3             | Awaiting Day 8 review     | 8                      |
| 4             | Awaiting Day 14 review    | 14                     |
| 5             | Awaiting Day 28 review    | 28                     |
| 6             | Awaiting Day 56 review    | 56                     |
| 7             | Awaiting Day 90 review    | 90                     |
| 8             | Archived                  | —                      |

`STAGE_INTERVALS` and `STAGE_LABELS` dicts live at the top of `models.py`
and are the single source of truth. Import from there — never hardcode
interval numbers in views, serializers, or frontend code. The frontend never
reimplements this scheduling math itself — `EntrySerializer` exposes
`stage_label`, `due_date`, and `is_editable` as computed fields precisely so
the React app can just display them.

---

## Build phases

Work through phases in order. Do not skip ahead or implement features
from a later phase while working on an earlier one.

- **Phase 1** ✅ Done — Project setup, models, admin, create-entry form
- **Phase 2** ✅ Done — Scheduling query + day-labeled review sections
- **Phase 3** ✅ Done — Card expand/collapse, Done button, Remind me tomorrow
- **Phase 4** ✅ Done — Comments (async submit, chronological display)
- **Phase 5** ✅ Done — Flagged for review section (reminder_flag=True entries)
- **Phase 6** ✅ Done — Archive page (stage 8 entries, read-only)
- **Phase 7** ✅ Done — Django auth + multi-user (scope all queries to request.user)
- **Phase 8** ✅ Done — Django REST Framework JSON API under `/api/`
- **Phase 9** ✅ Done — React (Vite) SPA: dashboard, optimistic Done, command palette; legacy Django-template frontend removed
- **Phase 10** — Deployment (Railway/Render, whitenoise or static hosting for the SPA build, env vars) — not started

Phases 1–7 originally shipped as server-rendered Django templates. Phase 8/9
replaced that entire frontend with a DRF API + React SPA — see "What Phase 8
& 9 delivered" below for what actually changed. The data-model and
scheduling-invariant decisions made in Phases 1–7 are still authoritative;
only the delivery mechanism (templates+vanilla JS → JSON API+React) changed.

---

## Coding rules

### Django / DRF

- **Business logic belongs in models, not views.** Serializers and API views
  call `entry.advance_stage()`, `entry.flag_for_reminder()`,
  `entry.stage_label()`, `entry.due_date()`, `entry.is_editable()` — they
  never reimplement that logic inline.
- **One API view class per concern, not routers/viewsets.** The entry
  endpoints (`today`, `due`, `flagged`, `archive`, `done`, `remind`,
  `comments`) are different filtered views and actions on Entry, not uniform
  CRUD, so each is its own `APIView`/`generics` class in `api_views.py`
  mirroring the pattern already there. Cross-cutting session concerns (csrf
  bootstrap, login, logout, me) live separately in `api_auth.py`.
- **Every Entry/Comment lookup is scoped to the requesting user.** List
  endpoints filter with `.filter(user=request.user)`; every pk-based endpoint
  uses `get_object_or_404(Entry, pk=pk, user=request.user)`. No exceptions.
- **`ReviewLog` is written before `advance_stage()` mutates state** — see
  `EntryMarkDoneAPIView` in `api_views.py`. This ordering is locked.
- **Never import `datetime` directly.** Always use `django.utils.timezone`:
  `timezone.localdate()` for today's date, `timezone.now()` for current
  datetime. This ensures `USE_TZ = True` is respected correctly.
- **Serializer conventions**: `EntrySerializer`'s computed fields
  (`stage_label`, `due_date`, `is_editable`) are `SerializerMethodField`s
  named `get_<field>`, each a one-line call into the matching model method.
  Only `title`/`body` are writable on `EntrySerializer` — everything else is
  `read_only_fields`. Nested `comments` relies on `Comment.Meta.ordering`
  (chronological) — never manually re-sort in the serializer or view.
- **API views return JSON, never redirects or rendered HTML.** The
  redirect-after-POST rule below is a historical rule for the now-deleted
  template views — it does not apply to `api_views.py`/`api_auth.py`.
- **URL routing**: all API routes live in `journal/api_urls.py`
  (`app_name = 'journal_api'`), mounted at `/api/` in `recall/urls.py`. Name
  every route.
- **Migrations**: after any model change, run `makemigrations journal` then
  `migrate`. Never hand-edit migration files. Never use `--fake` unless
  explicitly recovering from a broken migration state. Commit migration files.

### React / Tailwind (frontend/)

- **One component per file**, organized by feature folder under
  `src/components/` (`dashboard/`, `auth/`, `archive/`, `command-palette/`,
  `entry-input/`, `layout/`) — not by type.
- **`queries/queryKeys.ts` is the only place query-key arrays are literal.**
  Every hook in `useEntries.ts`/`useEntryMutations.ts`/`useAuth.ts` imports
  from it — never write `['entries', 'due']` inline elsewhere.
- **Optimistic-update pattern** (see `useMarkDone`/`useRemindTomorrow` in
  `useEntryMutations.ts`): `onMutate` cancels in-flight queries for the
  affected keys, snapshots the previous cache value, then patches the cache
  optimistically; `onError` restores the snapshot; `onSettled` invalidates
  the affected keys so the server's version of the truth wins once it
  arrives. When an optimistic patch would leave a due-entries stage group
  empty, **delete that key from the map entirely** rather than leaving `[]`
  — the backend never returns empty groups either, and leaving one would
  flash an empty section on screen before the next fetch corrects it.
- **`useAddComment` is deliberately not optimistic** — it patches the cache
  only in `onSuccess`, matching the original vanilla-JS comment behavior
  (append after the server confirms, not before).
- **Tailwind colors are restricted to the `@theme` tokens defined in
  `index.css`** (`bg-bg`, `bg-bg-card`, `text-text-secondary`, `bg-accent`,
  `hover:bg-accent-hover`, etc.) — never a raw Tailwind palette class
  (`bg-blue-500`) or a hardcoded hex value. This is the direct continuation
  of the old "dark blue theme, don't introduce a different accent hue" rule.
- **The CSRF token is read fresh from `document.cookie` on every mutating
  request** (`api/client.ts`'s axios interceptor) — never cached in a JS
  variable, since `django.contrib.auth.login()` rotates the token
  server-side on login.
- **`bootstrapCsrf()` runs once in `main.tsx` before the app renders** —
  every component can assume the `csrftoken` cookie already exists.

---

## Things that must never change without explicit instruction

- The `STAGE_INTERVALS` dict values (2, 4, 8, 14, 28, 56, 90)
- The `current_stage` field type and 0–8 range
- The `created_at` field type (must stay `DateField`, not `DateTimeField`)
- The `advance_stage()` method signature on Entry
- The ReviewLog-written-before-advance_stage ordering in the "done" action
- Every Entry/Comment query and lookup being scoped to `request.user`

---

## What Phase 8 & 9 delivered (already done — do not redo)

**Phase 8 — DRF JSON API**, all under `/api/`:

```
POST   /api/entries/                    create an entry (title, body, tags[])
GET    /api/entries/today/              stage-0 entries created today
GET    /api/entries/due/                {"Day 2": [...], "Day 14": [...]} — non-flagged, due today or earlier
GET    /api/entries/flagged/            reminder_flag=True entries, grouped by reminder_date (Phase 16)
GET    /api/entries/archive/            stage-8 entries, most recently archived first
GET    /api/entries/all/                every entry (Phase 11); ?q= title/body icontains, ?tags=a,b AND-filter
GET    /api/tags/                       the user's tags, for autocomplete (Phase 12)
GET    /api/stats/                      aggregated review/writing stats (Phase 14)
GET    /api/entries/export/             ?format=json|md full-data download (Phase 15)
POST   /api/entries/bulk/               {ids, action: "flag"|"delete"} on many entries at once (Phase 17)
POST   /api/entries/<pk>/done/          write ReviewLog, advance_stage(), return updated entry
POST   /api/entries/<pk>/remind/        flag_for_reminder(date?), default tomorrow (Phase 16), return updated entry
POST   /api/entries/<pk>/comments/      add a comment, return it (201)
GET    /api/auth/csrf/                  force-sets the csrftoken cookie
POST   /api/auth/login/                 session login, {id, username} or 400
POST   /api/auth/logout/                session logout (204)
GET    /api/auth/me/                    {authenticated, id, username} — never 401
```

Auth is Django's existing session-cookie + CSRF machinery (`SessionAuthentication`,
`IsAuthenticated` by default) — not JWT/tokens. `CSRF_TRUSTED_ORIGINS` in
`settings.py` trusts `http://localhost:5173` because the Vite dev-server proxy
forwards the browser's real `Origin` header through to Django unchanged.

**Phase 9 — React SPA** (`frontend/`), replacing the Phase 1–7 Django-template
frontend entirely:

- Dashboard (`/`) composes a "Flagged for review" section, one `ReviewSection`
  per due stage label, and a static "Written today" list, all above a
  fixed-bottom collapsible entry-creation form — the same layout the old
  templates rendered server-side, now client-rendered from the four `/api/entries/*`
  endpoints via React Query.
- `EntryCard` reproduces the old collapsible-card UX (click to expand, body +
  comments + comment form + Done/Remind buttons; `readOnly` hides the
  mutation UI for archived entries).
- **Optimistic Done**: clicking Done removes the card from the cache (and
  deletes its stage group if that empties it) before the server responds —
  see the React/Tailwind coding rules above for the exact pattern.
- **Command palette**: `Cmd/Ctrl+K` opens a modal with quick actions — go to
  Recall, go to Archive, focus the new-entry input, log out (later phases
  added browse-notes, view-stats, and the two export actions — see below and
  `commands.ts`). "Mark the focused card done" (mentioned in the original
  ask) was deliberately left as a future addition — it needs a
  focus-tracking concept the other actions don't, and wasn't worth the scope
  for a first pass. A persistent `NavBar` (added post-Phase-15, see note
  after Phase 15 below) now covers the same routes/export actions visibly,
  so the palette is a keyboard-first shortcut rather than the only way in.
- Dark-blue theme ported 1:1 from the old CSS custom properties into a
  Tailwind v4 `@theme` block in `index.css` (`--color-bg`, `--color-accent`, etc.).

**Removed in the Phase 9 cutover** (once the SPA covered the same ground
end-to-end): `journal/views.py`, `journal/urls.py`, `journal/templates/`
(all four templates), `journal/templates/registration/login.html`,
`journal/static/journal/style.css`, the `path('accounts/', ...)` and
`path('', include('journal.urls'))` lines in `recall/urls.py`, and
`LOGIN_URL`/`LOGIN_REDIRECT_URL`/`LOGOUT_REDIRECT_URL` from `settings.py`.
Verified before deleting: Django's own `admin/login.html` extends
`admin/base_site.html`, not `registration/login.html`, so `/admin/` was
unaffected. `journal/models.py` and `journal/admin.py` were untouched.

---

## Local dev checklist

Two servers run side by side — Django serves `/api/` and `/admin/`, Vite
serves the SPA and proxies `/api/*` through to Django:

```bash
# Ensure the DB exists
createdb recall_db   # only needed once

# Apply any pending migrations
python manage.py migrate

# Terminal 1 — Django API
python manage.py runserver

# Terminal 2 — React SPA
cd frontend && npm install && npm run dev
```

Both are also registered in `.claude/launch.json` as `"django"` (port 8000)
and `"vite"` (port 5173).

Visit the app at `http://localhost:5173/` — not `:8000`, which now only
serves `/api/` and `/admin/`.

DB credentials are in `recall/settings.py` under `DATABASES`.
Default: `NAME=recall_db`, `USER=postgres`, `HOST=localhost`, `PORT=5432`.

Admin is at `http://localhost:8000/admin/` — create a superuser with
`python manage.py createsuperuser` if you haven't already.

Python dependencies are pinned in `requirements.txt` at the repo root
(`pip install -r requirements.txt` into `venv`). Frontend dependencies are
pinned in `frontend/package.json`/`package-lock.json`.

UPDATES_REQUIRED

## Tech stack — no longer locked

The tech stack table above is **open for revision**. Django + DRF + React +
Tailwind + React Query + PostgreSQL remain the default assumption for new
work, but any phase below may propose swapping a piece of the stack
(e.g. a search library, a new frontend primitive, a notification service)
if it's the better tool for that phase's job. Call out the change explicitly
in that phase's notes rather than silently drifting.

---

## Build phases (continued)

- **Phase 11** ✅ Done — Search & Browse ("All Notes" page)
- **Phase 12** ✅ Done — Tags & categorization
- **Phase 13** ✅ Done — Rich text / Markdown entry bodies
- **Phase 14** ✅ Done — Stats & insights dashboard
- **Phase 15** ✅ Done — Export (Markdown/JSON)
- **Phase 16** ✅ Done — Custom snooze (reminder-for-a-specific-date)
- **Phase 17** ✅ Done — Bulk actions on Search/Archive
- **Phase 18** ✅ Done — Light/dark theme toggle
- **Phase 19** — PWA + due-today notifications
- **Phase 20** — Entry linking ("see also")

Work through these in order unless a later phase is explicitly prioritized —
several build on each other (Phase 12's tags are far more useful once
Phase 11's search page exists to filter within).

---

### Phase 11 — Search & Browse ("All Notes" page) ✅ Done

**Delivered:** `GET /api/entries/all/?q=<text>` (`AllEntriesAPIView`,
user-scoped, `title`/`body` `icontains`, empty `q` returns all — most recent
first via `Entry.Meta.ordering`). Frontend: `/notes` route with `NotesPage`
(own `components/notes/` folder), a 300ms-debounced search input, the
`useSearchEntries` hook (`queryKeys.entries.search(q)`), `EntryCard` reused in
`readOnly` mode, distinct "No notes yet" vs. "No results for '<query>'" empty
states, and a "Browse all notes" command-palette action. A Postgres
full-text upgrade remains a reasonable follow-up.

**Original goal:** a dedicated page listing every entry the user has ever written,
with a search bar that filters by title/body text as they type.

- New route, e.g. `/notes`, added to the command palette as a fourth/fifth
  action ("Browse all notes").
- New API endpoint: `GET /api/entries/all/?q=<text>` — scoped to
  `request.user` like every other entry endpoint. Empty `q` returns
  everything, most recent first.
- Start with a simple `icontains` filter across `title` and `body`; a
  Postgres full-text `SearchVector`/`SearchQuery` upgrade is a reasonable
  follow-up once the basic version ships (better ranking, typo tolerance).
- Frontend: new `NotesPage` component (own folder under `components/`,
  matching the existing `archive/`-style pattern), a debounced search input
  (~300ms) so it doesn't fire a request per keystroke, and a
  `useSearchEntries` React Query hook following the existing hook
  conventions in `useEntries.ts`.
- Reuse `EntryCard` in `readOnly` mode for the list items rather than
  building a new card component from scratch.
- Empty state: "No notes yet" vs. "No results for '<query>'" are two
  different messages — don't collapse them into one.

---

### Phase 12 — Tags & categorization ✅ Done

**Delivered:** new `Tag` model (`user`, `name`, `unique_together(user, name)`)
and a `tags` M2M on `Entry` — the documented first change to the "locked" data
model (see the data-model section above). `EntrySerializer.tags` is a
`write_only` `ListField` of strings that get-or-creates `Tag` rows under
`request.user` (deduped, trimmed) in `create`/`update`; the read shape (list of
names) is added back in `to_representation`. `GET /api/tags/` lists the user's
tags for autocomplete. `GET /api/entries/all/?q=&tags=a,b` narrows by every
named tag (AND). Frontend: a shared `components/tags/TagInput` (chips +
autocomplete) on the entry-creation form and as filter pills on the Notes page,
`useTags` hook, tags shown as chips in `EntryCard`. Registered `Tag` in admin
with `filter_horizontal` on the Entry page.

**Original goal:** free-text tags on entries, filterable from the Phase 11 search page.

- Schema change: new `Tag` model (`id`, `user`, `name`, unique per user) and
  a `ManyToManyField` from `Entry` to `Tag`. This is the first change to the
  "locked" data model — document it clearly in the model docstring.
- API: tags are writable on `EntrySerializer` (accept a list of strings,
  get-or-create `Tag` rows server-side). New `GET /api/tags/` for
  autocomplete.
- Frontend: a lightweight tag-input component (chips + autocomplete) on the
  entry-creation form and on the Phase 11 search page as filter pills.
  Combine with the text query (`?q=...&tags=...`) rather than replacing it.

---

### Phase 13 — Rich text / Markdown entry bodies ✅ Done

**Delivered:** `body` unchanged (`TextField` of raw Markdown, no schema change).
Rendered client-side via `react-markdown` in a shared `components/markdown/Markdown`
component used by `EntryCard`. **XSS-safe by construction** — `react-markdown`
does not render embedded raw HTML unless `rehype-raw` is added, which is
deliberately omitted, so no separate sanitizer is needed. Element styling for
the rendered Markdown lives in a `.markdown`-scoped block in `index.css` (no
`@tailwindcss/typography` dependency). Links open in a new tab with
`rel="noreferrer noopener"`. The entry-input form shows a lightweight "Markdown
supported" hint rather than a full toolbar (lowest friction for a "write
naturally" journal).

**Original goal:** entries support basic Markdown (bold, italics, lists, links)
instead of being rendered as plain text.

- `body` stays a `TextField` storing raw Markdown — no schema change needed.
- Render with a small client-side Markdown library (e.g. `marked` or
  `react-markdown`) at display time in `EntryCard`; sanitize output to avoid
  XSS since this is user-authored HTML-adjacent content.
- Entry-input form gets a minimal formatting toolbar or just relies on users
  typing Markdown directly — decide based on how much friction is
  acceptable for a "write naturally" journal.

---

### Phase 14 — Stats & insights dashboard ✅ Done

**Delivered:** `GET /api/stats/` (`StatsAPIView`, a one-liner into
`journal/stats.py`, where all aggregation lives per the "business logic
belongs in models" convention). Returns `entries_per_week` (last 12 Monday
weeks via `TruncWeek`, zero-filled), `stage_distribution` (stages 0–8 with
labels `New`/`Day 2`…`Archived`, zero-filled), `review_activity`
(total/on-time/late/`on_time_rate` — a review is on time when it happened on
the exact due date; stage-0 reviews count toward the total but neither
bucket), and `current_streak` (consecutive days with an entry written or a
review done; a quiet today doesn't break it). Snooze rate was dropped —
"remind me tomorrow" clicks aren't persisted anywhere, so it isn't
computable without a schema change. Frontend: `/stats` route with
`components/stats/StatsPage` — three stat tiles (streak, reviews completed,
on-time rate) and two `recharts` bar charts (per-week, per-stage), a "View
stats" command-palette action, `useStats` hook (`queryKeys.stats.all`).
**recharts is a new frontend dependency** (the phase's called-out stack
addition); chart colors are passed as `var(--color-…)` strings so they stay
on the locked theme tokens.

**Original goal:** a page showing review consistency over time.

- Candidate metrics: entries written per week, on-time review rate vs.
  "remind me tomorrow" snooze rate, current streak, stage distribution
  (how many entries sit at each `current_stage`).
- Backend: a `GET /api/stats/` endpoint aggregating from `Entry` and
  `ReviewLog` — keep aggregation logic in a model manager or a dedicated
  `stats.py` module, not inline in the view, to match the existing
  "business logic belongs in models" convention.
- Frontend: a chart library (e.g. `recharts`) for a simple bar/line view;
  keep it to 2–3 charts for v1 rather than a full analytics suite.

---

### Phase 15 — Export ✅ Done

**Delivered:** `GET /api/entries/export/?format=json|md`
(`EntryExportAPIView`; zip/Markdown assembly lives in `journal/export.py`,
mirroring the `stats.py` split). `json` (the default when `format` is
absent) returns the full `EntrySerializer` tree (comments, tags, computed
fields) with a `Content-Disposition: attachment` filename
`recall-export-<date>.json`; `md` streams a zip of one Markdown file per
entry (`<id>-<slug>.md` — the id prefix keeps duplicate titles from
colliding) with the title as `# heading`, body, a `Tags:` line, and a
`## Comments` trailing section. One subtlety: `?format=` is DRF's reserved
content-negotiation query param, so the view registers a no-op
`MarkdownZipRenderer` (format `'md'`) alongside `JSONRenderer` — without it
DRF 404s the request before the view runs; other `format` values therefore
404. Frontend: two command-palette actions ("Export all notes (Markdown
zip)" / "(JSON)") that hit the URL via `window.location`, so the browser
saves the attachment without leaving the SPA. No schema changes.

**Original goal:** let users download all their data.

- `GET /api/entries/export/?format=json|md` — `json` returns the full
  entry+comment tree; `md` returns a zipped set of one Markdown file per
  entry (title as `# heading`, body, comments as a trailing section).
- Purely additive — no schema changes. Good candidate to ship quickly
  since it builds trust ("my data isn't locked in") independent of other
  phases.

---

### Post-Phase-15 addition — persistent NavBar

**Delivered:** `/notes`, `/archive`, `/stats`, and the two export actions
(Markdown zip / JSON) were command-palette-only with no visible entry point
anywhere in the UI — a discoverability gap for anyone who doesn't know
`Cmd/Ctrl+K`. Added `components/layout/NavBar.tsx`, rendered in `AppShell`
directly below `AccountBar`: text links for Dashboard/Notes/Archive/Stats
(bold when active, via `useLocation().pathname` — the first use of
route-based active-state in the frontend) plus an "Export ▾" dropdown
triggering the same `downloadExport('md' | 'json')` used by the command
palette. Removed the now-redundant inline "View archive →" link from
`Dashboard.tsx`. The command palette is untouched and still works
side-by-side as a keyboard-first shortcut. No backend changes.

---

### Phase 16 — Custom snooze ✅ Done

**Delivered:** nullable `reminder_date` `DateField` on `Entry` (migration
`0004_entry_reminder_date`), set alongside `reminder_flag` and cleared
alongside it in `advance_stage()`. `Entry.flag_for_reminder(date=None)` now
takes an optional date and defaults to tomorrow, matching the original
"remind me tomorrow" behavior when no date is given. `POST
/api/entries/<pk>/remind/` accepts an optional `{"date": "YYYY-MM-DD"}` body
(400 on an unparseable date). `GET /api/entries/flagged/` changed shape from
a flat list to grouped-by-`reminder_date` (`FlaggedEntriesResponse`, same
shape as the due-entries grouping, e.g. `{"2026-07-11": [...], ...}`, key
`"Unscheduled"` for legacy null dates), sorted ascending by date. Frontend:
`Dashboard` renders one `ReviewSection` per reminder-date group, labeled via
`formatReminderLabel` (`lib/formatDate.ts` — "Today"/"Tomorrow" special-cased,
else `Mon 17 Jul`). `CardActions` replaced the single "Remind me tomorrow"
button with that button plus a "Pick a date…" toggle revealing a native
`<input type="date">` + "Set" button. `useRemindTomorrow` now takes
`{id, date?}`; the `removeFromDue` cache helper was generalized to
`removeFromGrouped` and reused for both `due` and `flagged`, since both are
now the same `Record<string, Entry[]>` shape.

**Original goal:** "remind me tomorrow" becomes "remind me on \<date\>".

- Reuses the existing `reminder_flag` mechanism; add a nullable
  `reminder_date` field on `Entry`. If set, the flagged section sorts/groups
  by that date instead of treating all flagged entries the same.
- Frontend: replace the single "Remind me tomorrow" button with a small
  date picker (default preset still offers "tomorrow" as one click).

---

### Phase 17 — Bulk actions on Search/Archive ✅ Done

**Delivered:** `POST /api/entries/bulk/` (`EntryBulkActionAPIView`) accepting
`{ids: [...], action: "flag"|"delete"}`, scoped to `request.user` via
`Entry.objects.filter(user=request.user, pk__in=ids)` like every other entry
lookup; `"flag"` calls `flag_for_reminder()` (default tomorrow) on each
matched entry, `"delete"` calls `.delete()` on the queryset and returns the
count. No schema changes. Frontend: `components/bulk-actions/BulkActionsBar`
(shared by `NotesPage` and `ArchivePage`) shows a "N selected" toolbar with
"Flag for review" / "Delete" once any row is checked; delete requires a
second click ("Delete" → "Confirm delete?" → fires) since it's the one
destructive action in the app. `EntryCard` gained optional
`selected`/`onToggleSelect` props — the header switched from a single
`<button>` wrapping the whole row to a `<div>` containing an optional
checkbox plus the expand `<button>`, since a checkbox can't nest inside a
button. Selection state is local `useState<number[]>` in each page, cleared
on successful bulk action. `useBulkAction` invalidates `due`, `flagged`,
`archive`, and the Phase 11 search-results prefix (`queryKeys.entries.searchAll`,
a new base key `search` builds on).

**Original goal:** select multiple entries and act on them at once.

- Checkbox selection state on the Phase 11 Notes page and the existing
  Archive page (local component state — no need for a global store).
- Bulk actions: re-flag for review, permanently delete. New endpoint
  `POST /api/entries/bulk/` accepting `{ids: [...], action: "flag"|"delete"}`,
  still scoped to `request.user`.
- Delete should require a confirmation step — this is the one destructive
  action in the app so far.

---

### Phase 18 — Light/dark theme toggle ✅ Done

**Delivered:** a `:root[data-theme='light']` block in `index.css` overriding
every color custom property the dark `@theme` block defines (same token
names, so no component changes were needed) — the unset/`dark` case still
falls through to the original dark values. `lib/theme.ts` (`getStoredTheme`,
`applyTheme`, `initTheme`) persists to `localStorage` under `recall-theme`
and stamps `document.documentElement.dataset.theme`; `initTheme()` runs
synchronously in `main.tsx` before the app renders (no flash of the wrong
theme). `lib/useTheme.ts` is the React-facing hook (`{theme, toggleTheme}`),
wired into a new toggle button in `AccountBar`, left of the username.

**Original goal:** a light variant of the existing palette, user-toggleable.

- Extend the `@theme` token block in `index.css` with a light-mode set;
  toggle via a `data-theme` attribute on `<html>` rather than duplicating
  Tailwind classes everywhere.
- Persist preference — since there's no per-user settings table yet, a
  simple `localStorage` value is fine for this one (doesn't need to sync
  across devices).
- Add the toggle to `AccountBar` next to the existing account controls.

---

### Post-Phase-18 addition — FAQ / Guide modal ✅ Done

**Delivered:** a new `components/faq/FaqModal.tsx` (same overlay/panel
pattern as `CommandPalette.tsx` — fixed backdrop, click-outside-to-close,
scrollable panel) explaining the app to users in plain language: what SpRep
is, how to add an entry, what the "Done" button does (writes a `ReviewLog`
and calls `advance_stage()`, walking Day 2 → 4 → 8 → 14 → 28 → 56 → 90 before
landing in the read-only Archive), how "Remind me tomorrow" / "Pick a
date…" work for reviewing on your own schedule, what happens if an entry is
never interacted with (it simply stays in its due section indefinitely —
no penalty, nothing skipped), and a short explanation of Dashboard vs.
Notes vs. Archive plus a mention of tags, Stats, Export, and the
Cmd/Ctrl+K command palette. Wired into `NavBar.tsx` as a "FAQ" text link
immediately after the "Export ▾" dropdown (left-aligned group, before the
`ml-auto` theme/account controls), and into `commands.ts`/`CommandPalette.tsx`
as an "Open FAQ & Guide" action for consistency with how every other NavBar
entry is mirrored in the palette — `CommandPalette` now renders `FaqModal`
as an always-mounted sibling (not nested inside its own `if (!open) return
null` gate) so closing the palette doesn't also unmount the FAQ modal
before it can show. No backend changes.

---

### Post-Phase-18 addition — User profile & password management

**Delivered:** `MeAPIView` (`/api/auth/me/`) now also returns `first_name`,
`last_name`, and `email` alongside the existing `id`/`username` fields, and
two new endpoints follow the same `api_auth.py` pattern as login/logout:
`PATCH /api/auth/profile/` (`UserProfileAPIView`) updates first name, last
name, and email on `request.user`; `POST /api/auth/change-password/`
(`ChangePasswordAPIView`) verifies the old password with
`user.check_password()`, validates the new one with Django's
`password_validation.validate_password()`, calls `set_password()`, and then
calls `logout(request)` so the session is destroyed — password changes
always force a fresh login. `LoginAPIView` was updated to return the same
full user shape so the `me` cache never has stale/missing name fields right
after login.

Frontend: the `NavBar` account button now shows `first_name last_name`
(falling back to `username` if both are blank) instead of the raw username,
and its dropdown gained two entries above "Log out" — **View profile** and
**Change password** — both also mirrored in the command palette per the
existing convention. Two new pages live under
`components/account/`: `ProfilePage.tsx` (`/profile`) shows editable first
name/last name/email with Back/Update buttons and a dismissible success
banner; `ChangePasswordPage.tsx` (`/change-password`) has old/new/confirm
password fields where **Update password** stays disabled until old-password
is non-empty, new matches confirm, and new satisfies a client-side
checklist (8+ chars, one uppercase, one lowercase, one digit) shown live
under the field. A wrong old password surfaces via the new
`components/common/Banner.tsx` — a themed, dismissible (✕ or 5s
auto-dismiss) inline banner, never a native `alert()`. On success, a modal
reads "Password changed successfully — you are required to log in with your
new password now"; its button clears the React Query cache and navigates to
`/login` (the backend already killed the session).

Every password `<input>` app-wide (login, and all three change-password
fields) now uses a shared `components/common/PasswordInput.tsx`, which adds
a show/hide eye-icon toggle button (`EyeIcon`/`EyeSlashIcon` in
`layout/icons.tsx`) so users can verify what they typed instead of guessing
behind masked dots.

---

### Phase 19 — PWA + due-today notifications

**Goal:** the app is installable and can notify the user when entries are
due, since a passive dashboard only works if the user remembers to open it.

- Add a web app manifest + service worker (Vite has PWA plugin support) so
  the app is installable on mobile/desktop.
- Notifications: start with browser Notification API + a scheduled check
  (service worker or a simple client-side check on load) for "you have N
  entries due today." True push notifications (server-triggered, works when
  the app is closed) are a larger follow-up requiring a push service —
  scope that separately if the client-side version isn't enough.

---

### Phase 20 — Entry linking

**Goal:** entries can reference other entries ("see also").

- New `ManyToManyField` on `Entry` pointing to itself
  (`related_entries = models.ManyToManyField('self', symmetrical=False, ...)`).
- Simplest UI: an autocomplete "link an entry" control inside `EntryCard`'s
  expanded view, plus a "Referenced by" reverse list. Keep it optional and
  low-friction — this is a nice-to-have that shouldn't complicate the core
  write/review flow.

---

## Notes on sequencing

- **Phase 11 (search) is the highest-priority item** — it's the one gap
  that actively hurts usability once the entry count grows past what fits
  on the dashboard.
- **Phase 12 (tags) is optional but pairs naturally with 11** — consider
  merging them into one phase if you'd rather ship search+filter together.
- **Phase 15 (export) is cheap and low-risk** — good filler if you want a
  quick win between larger phases.
- **Phase 19 (PWA/notifications) is the most technically involved** — treat
  it as its own multi-step phase rather than something to bolt on quickly.
