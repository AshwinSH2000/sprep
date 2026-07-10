from rest_framework import serializers

from .models import Comment, Entry, Tag


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'body', 'created_at']
        read_only_fields = ['id', 'created_at']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        read_only_fields = ['id', 'name']


class EntrySerializer(serializers.ModelSerializer):
    stage_label = serializers.SerializerMethodField()
    due_date = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    # Tags are written as a plain list of strings; the read shape (also a list
    # of strings) is added back in to_representation. write_only keeps the raw
    # M2M manager out of super().to_representation.
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Entry
        fields = [
            'id', 'title', 'body', 'created_at', 'current_stage',
            'reminder_flag', 'archived_at', 'stage_label', 'due_date',
            'is_editable', 'comments', 'tags',
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['tags'] = [tag.name for tag in instance.tags.all()]
        return data

    def _resolve_tags(self, names):
        """Get-or-create Tag rows under the requesting user, deduped."""
        user = self.context['request'].user
        tags = []
        seen = set()
        for raw in names:
            name = raw.strip()
            if not name or name in seen:
                continue
            seen.add(name)
            tag, _ = Tag.objects.get_or_create(user=user, name=name)
            tags.append(tag)
        return tags

    def create(self, validated_data):
        tag_names = validated_data.pop('tags', [])
        entry = super().create(validated_data)
        entry.tags.set(self._resolve_tags(tag_names))
        return entry

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tags', None)
        entry = super().update(instance, validated_data)
        if tag_names is not None:
            entry.tags.set(self._resolve_tags(tag_names))
        return entry
