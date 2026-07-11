from datetime import datetime, timedelta

from rest_framework import generics
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .export import build_markdown_zip, export_filename
from .models import Entry, ReviewLog, Tag, STAGE_INTERVALS, STAGE_LABELS
from .serializers import CommentSerializer, EntrySerializer, TagSerializer
from .stats import build_stats


class EntryCreateAPIView(generics.CreateAPIView):
    serializer_class = EntrySerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, current_stage=0)


class TodaysEntriesAPIView(APIView):
    def get(self, request):
        today = timezone.localdate()
        entries = Entry.objects.filter(
            user=request.user,
            created_at=today,
            current_stage=0,
        )
        return Response(EntrySerializer(entries, many=True).data)


class DueEntriesAPIView(APIView):
    def get(self, request):
        today = timezone.localdate()
        result = {}
        for stage, interval in STAGE_INTERVALS.items():
            entries = Entry.objects.filter(
                user=request.user,
                current_stage=stage,
                reminder_flag=False,
                created_at__lte=today - timedelta(days=interval),
            )
            if entries.exists():
                result[STAGE_LABELS[stage]] = EntrySerializer(entries, many=True).data
        return Response(result)


class FlaggedEntriesAPIView(APIView):
    def get(self, request):
        entries = Entry.objects.filter(
            user=request.user, reminder_flag=True,
        ).order_by('reminder_date', '-created_at')
        # Grouped by reminder_date (Phase 16) rather than one flat list, so
        # entries snoozed for different days surface as separate sections —
        # same shape as DueEntriesAPIView's stage grouping.
        grouped = {}
        for entry in entries:
            label = entry.reminder_date.isoformat() if entry.reminder_date else 'Unscheduled'
            grouped.setdefault(label, []).append(entry)
        return Response({
            label: EntrySerializer(group, many=True).data
            for label, group in grouped.items()
        })


class ArchiveAPIView(APIView):
    def get(self, request):
        entries = Entry.objects.filter(
            user=request.user, current_stage=8,
        ).order_by('-archived_at')
        return Response(EntrySerializer(entries, many=True).data)


class AllEntriesAPIView(APIView):
    def get(self, request):
        entries = Entry.objects.filter(user=request.user)
        query = request.query_params.get('q', '').strip()
        if query:
            entries = entries.filter(
                Q(title__icontains=query) | Q(body__icontains=query)
            )
        # ?tags=a,b narrows to entries carrying every named tag (AND).
        tags_param = request.query_params.get('tags', '')
        tag_names = [t.strip() for t in tags_param.split(',') if t.strip()]
        for name in tag_names:
            entries = entries.filter(tags__name=name)
        return Response(EntrySerializer(entries.distinct(), many=True).data)


class TagListAPIView(APIView):
    def get(self, request):
        tags = Tag.objects.filter(user=request.user)
        return Response(TagSerializer(tags, many=True).data)


class StatsAPIView(APIView):
    def get(self, request):
        return Response(build_stats(request.user))


class MarkdownZipRenderer(BaseRenderer):
    """
    Exists only to satisfy DRF's content negotiation: ?format= is DRF's
    reserved format-override query param, so ?format=md would 404 during
    negotiation unless a renderer claims the 'md' format. The export view
    returns a raw HttpResponse for zips, so render() is never invoked.
    """
    media_type = 'application/zip'
    format = 'md'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class EntryExportAPIView(APIView):
    renderer_classes = [JSONRenderer, MarkdownZipRenderer]

    def get(self, request):
        # Content negotiation has already 404'd any ?format= value other
        # than 'json' or 'md' (or absent, which defaults to JSON).
        entries = Entry.objects.filter(user=request.user).prefetch_related(
            'comments', 'tags',
        )
        if request.query_params.get('format') == 'md':
            response = HttpResponse(
                build_markdown_zip(entries), content_type='application/zip',
            )
            response['Content-Disposition'] = (
                f'attachment; filename="{export_filename("zip")}"'
            )
            return response
        return Response(
            EntrySerializer(entries, many=True).data,
            headers={
                'Content-Disposition':
                    f'attachment; filename="{export_filename("json")}"',
            },
        )


class EntryMarkDoneAPIView(APIView):
    def post(self, request, pk):
        entry = get_object_or_404(Entry, pk=pk, user=request.user)
        ReviewLog.objects.create(
            entry=entry,
            stage_reviewed=entry.current_stage,
        )
        entry.advance_stage()
        entry.save()
        return Response(EntrySerializer(entry).data)


class EntryRemindTomorrowAPIView(APIView):
    def post(self, request, pk):
        entry = get_object_or_404(Entry, pk=pk, user=request.user)
        date_str = request.data.get('date')
        date = None
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'date': 'Invalid date, expected YYYY-MM-DD.'}, status=400,
                )
        entry.flag_for_reminder(date)
        entry.save()
        return Response(EntrySerializer(entry).data)


class EntryAddCommentAPIView(APIView):
    def post(self, request, pk):
        entry = get_object_or_404(Entry, pk=pk, user=request.user)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(entry=entry, user=request.user)
        return Response(CommentSerializer(comment).data, status=201)


class EntryBulkActionAPIView(APIView):
    """
    Phase 17 — act on multiple entries at once from Search/Archive.
    {ids: [...], action: "flag"|"delete"}, scoped to request.user like every
    other entry endpoint. "delete" is permanent — the frontend is responsible
    for confirming with the user before calling this.
    """
    def post(self, request):
        ids = request.data.get('ids', [])
        action = request.data.get('action')
        if action not in ('flag', 'delete'):
            return Response({'action': 'Must be "flag" or "delete".'}, status=400)
        entries = Entry.objects.filter(user=request.user, pk__in=ids)
        if action == 'delete':
            deleted = entries.count()
            entries.delete()
            return Response({'deleted': deleted})
        for entry in entries:
            entry.flag_for_reminder()
            entry.save()
        return Response({'flagged': entries.count()})
