from datetime import timedelta

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Entry, ReviewLog, STAGE_INTERVALS, STAGE_LABELS
from .serializers import CommentSerializer, EntrySerializer


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
        entries = Entry.objects.filter(user=request.user, reminder_flag=True)
        return Response(EntrySerializer(entries, many=True).data)


class ArchiveAPIView(APIView):
    def get(self, request):
        entries = Entry.objects.filter(
            user=request.user, current_stage=8,
        ).order_by('-archived_at')
        return Response(EntrySerializer(entries, many=True).data)


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
        entry.flag_for_reminder()
        entry.save()
        return Response(EntrySerializer(entry).data)


class EntryAddCommentAPIView(APIView):
    def post(self, request, pk):
        entry = get_object_or_404(Entry, pk=pk, user=request.user)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(entry=entry, user=request.user)
        return Response(CommentSerializer(comment).data, status=201)
