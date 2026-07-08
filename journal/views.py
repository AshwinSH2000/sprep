from datetime import timedelta

from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from .models import Entry, ReviewLog, STAGE_INTERVALS, STAGE_LABELS


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
                # Phase 2: user=request.user
            )
        return redirect('journal:home')

    # Show entries created today so the user can verify saves are working
    today = timezone.localdate()
    todays_entries = Entry.objects.filter(created_at=today, current_stage=0)

    # Build day-labeled review sections, one query per stage.
    # Flagged entries (reminder_flag=True) are handled separately in Phase 5.
    review_sections = {}
    for stage, interval in STAGE_INTERVALS.items():
        due_entries = Entry.objects.filter(
            current_stage=stage,
            reminder_flag=False,
            created_at__lte=today - timedelta(days=interval),
        )
        if due_entries.exists():
            review_sections[STAGE_LABELS[stage]] = due_entries

    return render(request, 'journal/home.html', {
        'todays_entries': todays_entries,
        'today': today,
        'review_sections': review_sections,
    })


def mark_done(request, pk):
    entry = get_object_or_404(Entry, pk=pk)
    if request.method == 'POST':
        ReviewLog.objects.create(
            entry=entry,
            stage_reviewed=entry.current_stage,
        )
        entry.advance_stage()
        entry.save()
    return redirect('journal:home')


def remind_tomorrow(request, pk):
    entry = get_object_or_404(Entry, pk=pk)
    if request.method == 'POST':
        entry.flag_for_reminder()
        entry.save()
    return redirect('journal:home')

