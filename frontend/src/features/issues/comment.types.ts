export interface CommentAuthor {
  _id: string
  fullName: string
  avatarUrl?: string | null
}

export interface CommentItem {
  _id: string
  projectId: string
  issueId: string
  authorId: string
  author?: CommentAuthor
  content: string
  isEdited?: boolean
  editedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCommentPayload {
  content: string
}

export interface UpdateCommentPayload {
  content: string
}
