"""
Phase 14 — aggregation logic behind GET /api/stats/.

Lives in its own module (not inline in the view) to match the "business
logic belongs in models, not views" rule: StatsAPIView is a one-liner
calling build_stats(request.user).
"""
from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncWeek
from django.utils import timezone

from .models import Entry, ReviewLog, STAGE_INTERVALS, STAGE_LABELS

# How many weekly buckets the entries-per-week chart shows (current week last).
WEEKS_SHOWN = 12

# current_stage values 0 and 8 fall outside STAGE_LABELS.
STAGE_DISTRIBUTION_LABELS = {0: 'New', **STAGE_LABELS, 8: 'Archived'}


def _week_start(day):
    """Monday of the week containing `day`."""
    return day - timedelta(days=day.weekday())


def entries_per_week(user, today):
    """Last WEEKS_SHOWN weeks of writing volume, zero-filled, oldest first."""
    first_week = _week_start(today) - timedelta(weeks=WEEKS_SHOWN - 1)
    rows = (
        Entry.objects.filter(user=user, created_at__gte=first_week)
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(n=Count('id'))
    )
    counts = {row['week']: row['n'] for row in rows}
    result = []
    for i in range(WEEKS_SHOWN):
        week = first_week + timedelta(weeks=i)
        result.append({'week_start': week.isoformat(), 'count': counts.get(week, 0)})
    return result


def stage_distribution(user):
    """How many entries sit at each current_stage, zero-filled for 0-8."""
    counts = dict(
        Entry.objects.filter(user=user)
        .values_list('current_stage')
        .annotate(n=Count('id'))
    )
    return [
        {'stage': stage, 'label': label, 'count': counts.get(stage, 0)}
        for stage, label in STAGE_DISTRIBUTION_LABELS.items()
    ]


def review_activity(user):
    """
    On-time vs. late Done clicks. A review is on time when it happened on the
    exact day the entry became due (created_at + the stage's interval); any
    later day is late. Reviews of stages without an interval (a flagged
    stage-0 entry marked Done) count toward the total but neither bucket.
    """
    logs = ReviewLog.objects.filter(entry__user=user).select_related('entry')
    total = on_time = late = 0
    for log in logs:
        total += 1
        interval = STAGE_INTERVALS.get(log.stage_reviewed)
        if interval is None:
            continue
        due = log.entry.created_at + timedelta(days=interval)
        if timezone.localtime(log.reviewed_at).date() <= due:
            on_time += 1
        else:
            late += 1
    graded = on_time + late
    return {
        'total_reviews': total,
        'on_time': on_time,
        'late': late,
        'on_time_rate': round(on_time / graded, 3) if graded else None,
    }


def current_streak(user, today):
    """
    Consecutive days of activity (an entry written or a review done) ending
    today — or ending yesterday, since a quiet morning hasn't broken the
    streak yet.
    """
    active_days = set(
        Entry.objects.filter(user=user).values_list('created_at', flat=True)
    )
    active_days.update(
        timezone.localtime(reviewed_at).date()
        for reviewed_at in ReviewLog.objects.filter(
            entry__user=user
        ).values_list('reviewed_at', flat=True)
    )
    day = today if today in active_days else today - timedelta(days=1)
    streak = 0
    while day in active_days:
        streak += 1
        day -= timedelta(days=1)
    return streak


def build_stats(user):
    today = timezone.localdate()
    return {
        'entries_per_week': entries_per_week(user, today),
        'stage_distribution': stage_distribution(user),
        'review_activity': review_activity(user),
        'current_streak': current_streak(user, today),
    }
