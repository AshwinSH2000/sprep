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

| Layer     | Choice                        | Notes                                          |
|-----------|-------------------------------|------------------------------------------------|
| Backend   | Django                        | ORM + built-in admin                           |
| Frontend  | Django templates + Vanilla JS | No React, no Vue, no build step                |
| Database  | PostgreSQL                    | Local dev on localhost:5432                    |
| Styling   | Plain CSS                     | No Tailwind, no Bootstrap, no CSS framework    |
| JS        | Vanilla only                  | Only for expand/collapse and async comment submit |

---

## Directory structure

```
recall/               ← Django project config
  settings.py
  urls.py
  wsgi.py

journal/              ← main app (all domain logic lives here)
  models.py           ← Entry, ReviewLog, Comment — single source of truth
  views.py
  admin.py
  urls.py
  templates/
    journal/          ← all HTML templates go here
      home.html
      _review_card.html  ← shared collapsible card partial (day-labeled + flagged sections)
manage.py
CLAUDE.md             ← this file
```

---

## The data model (locked — do not alter field names or types)

### Entry
```
id               BigAutoField (PK)
user             FK → User (nullable in Phase 1, required in Phase 2)
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
interval numbers in views or templates.

---

## Build phases

Work through phases in order. Do not skip ahead or implement features
from a later phase while working on an earlier one.

- **Phase 1** ✅ Done — Project setup, models, admin, create-entry form
- **Phase 2** ✅ Done — Scheduling query + day-labeled review sections on home page
- **Phase 3** ✅ Done — Card expand/collapse, Done button, Remind me tomorrow
- **Phase 4** ✅ Done — Comments (AJAX submit, chronological display)
- **Phase 5** ✅ Done — Flagged for review section (reminder_flag=True entries)
- **Phase 6** — Archive page (/archive — stage 8 entries, read-only)
- **Phase 7** — Django auth + multi-user (scope all queries to request.user)
- **Phase 8** — Deployment (Railway/Render, whitenoise, env vars)

---

## Coding rules

### Django

- **Always use `app_name` namespacing** in `journal/urls.py` (`app_name = 'journal'`)
  and reference URLs as `journal:home`, `journal:mark_done`, etc. in templates
  and `redirect()` calls.

- **Redirect after POST, always.** Every view that handles a POST must end with
  `return redirect(...)`, never `return render(...)`. This prevents duplicate
  submissions on refresh.

- **Business logic belongs in models, not views.** If logic operates on a single
  model instance (e.g. advancing stage, checking edit eligibility), it's a model
  method. Views orchestrate; models contain domain rules.

- **Keep views thin.** A view should: validate input, call model methods,
  write to DB, return response. No scheduling math, no interval lookups inline.

- **Never import `datetime` directly.** Always use `django.utils.timezone`:
  - `timezone.localdate()` for today's date
  - `timezone.now()` for current datetime
  This ensures `USE_TZ = True` is respected correctly.

- **Use `get_object_or_404`** in any view that fetches an Entry by PK from the URL.
  Never use `.get(pk=...)` in views — it raises an unhandled exception on missing rows.

- **Phase 2 auth pattern** — all Entry queries will gain `.filter(user=request.user)`.
  To make this easy: write queries in views so the user filter can be appended in
  one place. Do not scatter Entry.objects.filter() calls across helper functions
  that would all need updating.

### URL routing

- Project `recall/urls.py` routes `/admin/` and hands everything else to `journal/`.
- App `journal/urls.py` owns all named routes with `app_name = 'journal'`.
- Name every URL. Never hardcode `/` or `/archive/` in templates — use `{% url %}`.

### Migrations

- After any model change, run `makemigrations journal` then `migrate`.
- Never hand-edit migration files.
- Never use `--fake` unless explicitly recovering from a broken migration state.
- Commit migration files to version control — they are part of the source of truth.

### Scheduling query (Phase 2+)

The correct query to fetch entries due today is:

```python
from datetime import timedelta
from django.utils import timezone
from .models import Entry, STAGE_INTERVALS

today = timezone.localdate()

due_entries = Entry.objects.filter(
    current_stage__in=STAGE_INTERVALS.keys(),  # stages 1–7 only
    reminder_flag=False,                        # flagged entries handled separately
    created_at__lte=today - timedelta(days=...)
)
```

Each stage has a different interval, so query per stage and group them.
The home view will build a dict like `{'Day 2': [...], 'Day 14': [...]}` and
pass it to the template. Empty stages are not included — the template should
only render a section if its list is non-empty.

### Templates

- All templates go in `journal/templates/journal/`.
- Use `{% url 'journal:name' %}` everywhere — never hardcode paths.
- Use `{% csrf_token %}` in every `<form>` tag.
- The fixed-bottom input area (title + body + Save) is always visible on the
  home page. Scrollable review sections sit above it.
- Empty review sections must be hidden entirely — no "nothing here" placeholders.
- `{% if entry.is_editable %}` gates the edit button — never check the date in templates.

### JavaScript

- Vanilla JS only. No jQuery, no Alpine, no HTMX.
- JS is used for two things only:
  1. Expand/collapse card click behaviour
  2. Async comment submission (fetch POST to a comment endpoint)
- **Comments are the only fetch/AJAX case.** Every other state change (Save entry,
  Done, Remind me tomorrow) is a plain `<form method="post">` that does a full
  page redirect, per the redirect-after-POST rule. Do not convert those to fetch
  calls — comments get AJAX specifically so adding a note doesn't collapse the
  card the user is looking at.
- Async comment submit pattern:
  - POST to `/entry/<pk>/comment/` with `fetch()`
  - Include the CSRF token from the cookie (`getCookie('csrftoken')`)
  - On success, append the new comment to the DOM without a page reload
  - On failure, show an inline error message — never silently swallow errors

### CSS

- Plain CSS, no framework.
- CSS lives in `<style>` blocks inside templates for now (Phase 1/2).
- If a shared style is needed across multiple templates, introduce a
  `base.html` and a `static/journal/style.css` — do not duplicate rules.
- Color palette (established in Phase 1):
  - Background: `#f9f9f7`
  - Cards: `#ffffff` with `1px solid #e8e8e6`
  - Body text: `#1a1a1a`
  - Secondary text: `#666`
  - Border/dividers: `#e8e8e6`
  - Primary button: `#1a1a1a` background, `#fff` text

---

## Things that must never change without explicit instruction

- The `STAGE_INTERVALS` dict values (2, 4, 8, 14, 28, 56, 90)
- The `current_stage` field type and 0–8 range
- The `created_at` field type (must stay `DateField`, not `DateTimeField`)
- The `advance_stage()` method signature on Entry
- The redirect-after-POST pattern in any view

---

## Phase 2 migration path (for when auth is added)

The user FK on Entry is already present as `null=True, blank=True`.
When Phase 7 begins, the only changes needed are:

1. `Entry.user` → remove `null=True, blank=True`
2. Add `user=request.user` to `Entry.objects.create(...)` calls
3. Add `.filter(user=request.user)` to all Entry queries
4. Add `Comment.user` FK (same pattern)
5. Generate and apply one migration

No model redesign, no data restructuring.

---

## Local dev checklist

Before running the server:

```bash
# Ensure the DB exists
createdb recall_db   # only needed once

# Apply any pending migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

DB credentials are in `recall/settings.py` under `DATABASES`.
Default: `NAME=recall_db`, `USER=postgres`, `HOST=localhost`, `PORT=5432`.

Admin is at `http://localhost:8000/admin/` — create a superuser with
`python manage.py createsuperuser` if you haven't already.

---

## What Phase 1 delivered (already done — do not redo)

- Django project `recall` + app `journal`
- PostgreSQL connection configured in `settings.py`
- `Entry`, `ReviewLog`, `Comment` models with all fields
- `advance_stage()` model method
- `STAGE_INTERVALS` and `STAGE_LABELS` dicts
- Admin registered with inline ReviewLog + Comment
- Project and app URL routing
- `home` view with POST (create entry) and GET (list today's entries)
- `home.html` template with fixed-bottom input area and today's entries list

---

## What Phase 2 & 3 delivered (already done — do not redo)

- `home` view now builds `review_sections`, an ordered dict of
  `{STAGE_LABELS[stage]: queryset}` (Day 2 → Day 90), one filtered query per
  stage per the Scheduling query pattern above. Only non-empty stages are
  included — the template does no filtering of its own.
- `Entry.flag_for_reminder()` model method (mirrors `advance_stage()`): sets
  `reminder_flag = True`, does not save — caller saves. Add any future
  single-instance mutations as model methods the same way, not inline in views.
- `mark_done` and `remind_tomorrow` views, both `entry/<int:pk>/<action>/`,
  named `journal:mark_done` / `journal:remind_tomorrow`. Both: `get_object_or_404`,
  gate the mutation on `request.method == 'POST'`, redirect to `journal:home`
  unconditionally. `mark_done` writes the `ReviewLog` (`stage_reviewed=entry.current_stage`)
  **before** calling `advance_stage()`, since that method mutates stage in place.
- Card markup in `home.html` is now `.card.collapsible` wrapping `.card-summary`
  (always visible — title only) and `.card-detail` (body + action forms, hidden
  until expanded). One JS listener toggles an `expanded` class on the `.card`
  by adding it to `.card-summary`'s click handler — reuse this same structure
  for any new per-card content. Comments (Phase 4) render inside `.card-detail`,
  below the body, above the action buttons.
- Done/Remind me tomorrow are plain `<form method="post">` submits, not fetch —
  see the JavaScript section above for why comments are the exception.
- This card structure only exists in the day-labeled review sections; the
  "Written today" (stage 0) cards are still static, no expand/collapse or actions.

---

## What Phase 4 & 5 delivered (already done — do not redo)

Phases 1–5 are complete. Conventions a fresh session needs before starting Phase 6:

- **Partial pattern**: shared per-card markup lives in
  `journal/templates/journal/_review_card.html` (underscore prefix = partial,
  not a routable page), `{% include %}`-ed from every section that renders a
  collapsible entry card (flagged section, day-labeled sections). Extend this
  partial for new per-card content instead of duplicating markup inline.
- **fetch vs form-POST**: comments are the *only* fetch/AJAX case, specifically
  so adding a note doesn't collapse the card the user is looking at. Every
  other mutation — Done, Remind me tomorrow, and anything added later — is a
  plain `<form method="post">` with redirect-after-POST. `add_comment` is the
  one view that returns `JsonResponse` instead of `redirect()`; that exception
  does not extend to other views.
- **Comment timestamp formatting**: `COMMENT_DATE_FORMAT` in `views.py` and the
  `|date:"..."` filter in `_review_card.html` must be kept in sync — one
  formats AJAX-appended comments, the other formats server-rendered ones.
- **Flagged entries**: a separate query with no date filtering
  (`Entry.objects.filter(reminder_flag=True)`), rendered above the
  day-labeled sections. Only cleared by `advance_stage()` (i.e. Done) — the
  schedule itself never clears it.
