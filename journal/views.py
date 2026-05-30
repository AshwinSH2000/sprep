from django.shortcuts import render, redirect
from django.utils import timezone
from .models import Entry, STAGE_INTERVALS
import datetime


def home(request):
    """
    Phase 1 stub:
    - POST: save a new entry (title + body), redirect back.
    - GET: render the home page with today's new entries listed.

    Scheduling query and review sections are added in Phase 2.
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

    return render(request, 'journal/home.html', {
        'todays_entries': todays_entries,
        'today': today,
    })


