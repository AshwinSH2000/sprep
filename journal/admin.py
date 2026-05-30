from django.contrib import admin
from .models import Entry, ReviewLog, Comment


class ReviewLogInline(admin.TabularInline):
    """Show the review history directly inside an Entry's admin page."""
    model = ReviewLog
    extra = 0
    readonly_fields = ('stage_reviewed', 'reviewed_at')
    can_delete = False


class CommentInline(admin.TabularInline):
    """Show comments directly inside an Entry's admin page."""
    model = Comment
    extra = 0
    readonly_fields = ('body', 'created_at')
    can_delete = False


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'current_stage', 'reminder_flag', 'archived_at')
    list_filter = ('current_stage', 'reminder_flag')
    search_fields = ('title', 'body')
    readonly_fields = ('archived_at',)
    inlines = [ReviewLogInline, CommentInline]


@admin.register(ReviewLog)
class ReviewLogAdmin(admin.ModelAdmin):
    list_display = ('entry', 'stage_reviewed', 'reviewed_at')
    readonly_fields = ('entry', 'stage_reviewed', 'reviewed_at')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('entry', 'created_at', 'body')
    readonly_fields = ('entry', 'created_at')