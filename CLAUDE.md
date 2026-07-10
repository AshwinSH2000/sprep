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
      layout/             ← AppShell, AccountBar
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
archived_at      DateTimeField (nullable)
```

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
POST   /api/entries/                    create an entry (title, body)
GET    /api/entries/today/              stage-0 entries created today
GET    /api/entries/due/                {"Day 2": [...], "Day 14": [...]} — non-flagged, due today or earlier
GET    /api/entries/flagged/            reminder_flag=True entries
GET    /api/entries/archive/            stage-8 entries, most recently archived first
POST   /api/entries/<pk>/done/          write ReviewLog, advance_stage(), return updated entry
POST   /api/entries/<pk>/remind/        flag_for_reminder(), return updated entry
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
- **Command palette**: `Cmd/Ctrl+K` opens a modal with four actions — go to
  Recall, go to Archive, focus the new-entry input, log out. "Mark the
  focused card done" (mentioned in the original ask) was deliberately left
  as a future addition — it needs a focus-tracking concept the other actions
  don't, and wasn't worth the scope for a first pass.
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
