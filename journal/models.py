from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# Interval schedule (locked in PRD §2)
# Index = current_stage value. Value = days after created_at when that review is due.
STAGE_INTERVALS = {
    1: 2,
    2: 4,
    3: 8,
    4: 14,
    5: 28,
    6: 56,
    7: 90,
}

# Human-readable label for each stage, used in templates
STAGE_LABELS = {
    1: 'Day 2',
    2: 'Day 4',
    3: 'Day 8',
    4: 'Day 14',
    5: 'Day 28',
    6: 'Day 56',
    7: 'Day 90',
}


class Tag(models.Model):
    """
    Free-text label attached to entries (Phase 12).
    Tags are per-user — the same name can exist independently for two users,
    but is unique within a single user's set.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tags',
    )
    name = models.CharField(max_length=50)

    class Meta:
        ordering = ['name']
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name


class Entry(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='entries',
    )

    # ── Core fields ───────────────────────────────────────────────────────────
    title = models.CharField(max_length=255)
    body = models.TextField()

    # Phase 12 — the first change to the "locked" data model: free-text tags.
    # Many-to-many so an entry can carry several tags and a tag many entries.
    # Always scoped to the entry's own user (Tag.user == Entry.user); the
    # serializer get-or-creates Tag rows under request.user, never crossing users.
    tags = models.ManyToManyField(Tag, related_name='entries', blank=True)

    # stored as date (not datetime) — scheduling compares against today's date
    created_at = models.DateField(default=timezone.localdate)

    # ── Review state ──────────────────────────────────────────────────────────
    # 0 = just created (not yet surfaced for review)
    # 1–7 = awaiting review at the corresponding interval
    # 8 = archived
    current_stage = models.PositiveSmallIntegerField(default=0)

    # True while the user has asked to be reminded again on a given date.
    # Cleared automatically when Done is clicked on the flagged card.
    reminder_flag = models.BooleanField(default=False)

    # The date the user asked to be reminded on (Phase 16 — custom snooze).
    # Set whenever reminder_flag is set True; cleared alongside it.
    reminder_date = models.DateField(null=True, blank=True)

    # Set when current_stage reaches 8. Null until then.
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.title} (stage {self.current_stage})'

    # ── Helpers ───────────────────────────────────────────────────────────────

    def is_editable(self):
        """Entry can only be edited on the day it was created (PRD §6)."""
        return self.created_at == timezone.localdate()

    def due_date(self):
        """
        Returns the calendar date this entry is next due for review.
        Returns None if stage is 0 (not yet due) or 8 (archived).
        """
        if self.current_stage in STAGE_INTERVALS:
            from datetime import timedelta
            return self.created_at + timedelta(days=STAGE_INTERVALS[self.current_stage])
        return None

    def stage_label(self):
        """Returns the human-readable label for the current stage, e.g. 'Day 14'."""
        return STAGE_LABELS.get(self.current_stage, '')

    def advance_stage(self):
        """
        Call this when the user clicks Done.
        Increments current_stage. If it reaches 8, archives the entry.
        Does NOT save — caller is responsible for .save().
        """
        self.current_stage += 1
        if self.current_stage >= 8:
            self.current_stage = 8
            self.archived_at = timezone.now()
        self.reminder_flag = False  # always clear flag on Done
        self.reminder_date = None

    def flag_for_reminder(self, date=None):
        """
        Call this when the user clicks 'Remind me on <date>'.
        Defaults to tomorrow when no date is given (Phase 16).
        Does NOT save — caller is responsible for .save().
        """
        from datetime import timedelta
        self.reminder_flag = True
        self.reminder_date = date or (timezone.localdate() + timedelta(days=1))


class ReviewLog(models.Model):
    """
    Immutable audit trail. One row written each time the user clicks Done.
    Never edited or deleted — only appended.
    """
    entry = models.ForeignKey(
        Entry,
        on_delete=models.CASCADE,
        related_name='review_logs',
    )
    # The stage the user was reviewing (before the increment)
    stage_reviewed = models.PositiveSmallIntegerField()
    reviewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['reviewed_at']

    def __str__(self):
        return f'Entry {self.entry_id} — stage {self.stage_reviewed} reviewed at {self.reviewed_at}'


class Comment(models.Model):
    """
    User notes added while reviewing an entry.
    Comments are append-only (no edit/delete in Phase 1).
    """
    entry = models.ForeignKey(
        Entry,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment on entry {self.entry_id} at {self.created_at}'