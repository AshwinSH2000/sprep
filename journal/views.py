from datetime import timedelta

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.template.defaultfilters import date as date_filter
from django.utils import timezone
from .models import Entry, ReviewLog, Comment, STAGE_INTERVALS, STAGE_LABELS


@login_required
def home(request):
    """
    - POST: save a new entry (title + body), redirect back.
    - GET: render the home page with today's new entries and any
      day-labeled review sections that are due.
    """
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        body = request.POST.get('body', '').strip()

        if title and body:
            Entry.objects.create(
                title=title,
                body=body,
                current_stage=0,   # starts at 0 — not yet due for review
                user=request.user,
            )
        return redirect('journal:home')

    # Show entries created today so the user can verify saves are working
    today = timezone.localdate()
    todays_entries = Entry.objects.filter(user=request.user, created_at=today, current_stage=0)

    # Build day-labeled review sections, one query per stage.
    # Flagged entries (reminder_flag=True) are excluded here — shown separately below.
    review_sections = {}
    for stage, interval in STAGE_INTERVALS.items():
        due_entries = Entry.objects.filter(
            user=request.user,
            current_stage=stage,
            reminder_flag=False,
            created_at__lte=today - timedelta(days=interval),
        )
        if due_entries.exists():
            review_sections[STAGE_LABELS[stage]] = due_entries

    # Entries snoozed via "Remind me tomorrow" (Phase 5). Shown until Done is
    # clicked, regardless of due date — advance_stage() clears the flag.
    flagged_entries = Entry.objects.filter(user=request.user, reminder_flag=True)

    return render(request, 'journal/home.html', {
        'todays_entries': todays_entries,
        'today': today,
        'review_sections': review_sections,
        'flagged_entries': flagged_entries,
    })


@login_required
def archive(request):
    """Read-only list of archived (stage 8) entries, most recently archived first."""
    archived_entries = Entry.objects.filter(user=request.user, current_stage=8).order_by('-archived_at')
    return render(request, 'journal/archive.html', {
        'archived_entries': archived_entries,
        'read_only': True,
    })


@login_required
def mark_done(request, pk):
    entry = get_object_or_404(Entry, pk=pk, user=request.user)
    if request.method == 'POST':
        ReviewLog.objects.create(
            entry=entry,
            stage_reviewed=entry.current_stage,
        )
        entry.advance_stage()
        entry.save()
    return redirect('journal:home')


@login_required
def remind_tomorrow(request, pk):
    entry = get_object_or_404(Entry, pk=pk, user=request.user)
    if request.method == 'POST':
        entry.flag_for_reminder()
        entry.save()
    return redirect('journal:home')


# Shared with the `comment.created_at` rendering in home.html so AJAX-appended
# comments look identical to server-rendered ones.
COMMENT_DATE_FORMAT = 'j M, g:i A'


@login_required
def add_comment(request, pk):
    """AJAX-only endpoint: create a Comment and return it as JSON."""
    entry = get_object_or_404(Entry, pk=pk, user=request.user)
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    body = request.POST.get('body', '').strip()
    if not body:
        return JsonResponse({'error': 'Comment cannot be empty.'}, status=400)

    comment = Comment.objects.create(entry=entry, user=request.user, body=body)
    return JsonResponse({
        'body': comment.body,
        'created_at': date_filter(comment.created_at, COMMENT_DATE_FORMAT),
    })

