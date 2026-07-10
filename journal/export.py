"""
Phase 15 — export rendering behind GET /api/entries/export/.

Like stats.py, this keeps the non-trivial work (Markdown rendering, zip
assembly) out of the view: EntryExportAPIView just picks a format and
hands the queryset to one of these builders.
"""
import io
import zipfile

from django.utils import timezone
from django.utils.text import slugify


def entry_markdown(entry):
    """One entry as a standalone Markdown document: title heading, body,
    then tags and comments as trailing sections."""
    parts = [f'# {entry.title}', '', entry.body.strip(), '']
    tag_names = [tag.name for tag in entry.tags.all()]
    if tag_names:
        parts += [f'Tags: {", ".join(tag_names)}', '']
    comments = list(entry.comments.all())
    if comments:
        parts += ['## Comments', '']
        for comment in comments:
            stamp = timezone.localtime(comment.created_at).strftime('%Y-%m-%d %H:%M')
            parts.append(f'- **{stamp}** — {comment.body.strip()}')
        parts.append('')
    return '\n'.join(parts)


def entry_filename(entry):
    """Unique, filesystem-safe name — the id prefix guarantees no collision
    between entries whose titles slugify identically."""
    slug = slugify(entry.title) or 'untitled'
    return f'{entry.id}-{slug}.md'


def build_markdown_zip(entries):
    """Zip of one Markdown file per entry, as bytes."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for entry in entries:
            archive.writestr(entry_filename(entry), entry_markdown(entry))
    return buffer.getvalue()


def export_filename(extension):
    return f'recall-export-{timezone.localdate().isoformat()}.{extension}'
