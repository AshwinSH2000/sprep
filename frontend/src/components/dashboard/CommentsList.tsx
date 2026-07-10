import type { Comment } from '../../api/types'
import { formatCommentDate } from '../../lib/formatDate'

interface CommentsListProps {
  comments: Comment[]
}

export function CommentsList({ comments }: CommentsListProps) {
  if (comments.length === 0) return null

  return (
    <div className="mt-3 flex flex-col gap-2">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-md bg-bg-input px-3 py-2">
          <div className="text-sm text-text">{comment.body}</div>
          <div className="mt-1 text-xs text-text-muted">
            {formatCommentDate(comment.created_at)}
          </div>
        </div>
      ))}
    </div>
  )
}
