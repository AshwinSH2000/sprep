from rest_framework import serializers

from .models import Comment, Entry


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'body', 'created_at']
        read_only_fields = ['id', 'created_at']


class EntrySerializer(serializers.ModelSerializer):
    stage_label = serializers.SerializerMethodField()
    due_date = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Entry
        fields = [
            'id', 'title', 'body', 'created_at', 'current_stage',
            'reminder_flag', 'archived_at', 'stage_label', 'due_date',
            'is_editable', 'comments',
        ]
        read_only_fields = [
            'id', 'created_at', 'current_stage', 'reminder_flag', 'archived_at',
        ]

    def get_stage_label(self, obj):
        return obj.stage_label()

    def get_due_date(self, obj):
        return obj.due_date()

    def get_is_editable(self, obj):
        return obj.is_editable()
