import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/format'
import type { CommentItem as CommentItemType } from '../comment.types'

interface CommentItemProps {
  comment: CommentItemType
  currentUserId?: string
  isProjectOwner?: boolean
  onUpdate: (commentId: string, content: string) => Promise<void> | void
  onDelete: (commentId: string) => Promise<void> | void
  isUpdating?: boolean
  isDeleting?: boolean
}

export const CommentItem = ({
  comment,
  currentUserId,
  isProjectOwner = false,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const authorName = comment.author?.fullName ?? 'Người dùng'
  const authorAvatar = comment.author?.avatarUrl ?? null

  const isAuthor = currentUserId === comment.authorId
  // Yêu cầu 2: Chỉ người viết mới sửa được bình luận của mình; chủ sở hữu dự án xoá được bình luận bất kỳ nhưng không sửa được.
  const canEdit = isAuthor
  const canDelete = isAuthor || isProjectOwner

  // Click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setShowMenu(false)
    setEditContent(comment.content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim()
    if (!trimmed || isUpdating) return
    await onUpdate(comment._id, trimmed)
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      handleCancelEdit()
    }
  }

  const handleConfirmDelete = async () => {
    await onDelete(comment._id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className="group relative flex gap-3 items-start p-3 hover:bg-canvas rounded-xl transition-all duration-150 border border-transparent hover:border-hairline">
        <Avatar src={authorAvatar} name={authorName} size={32} />

        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-center gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-ink">{authorName}</span>
              <span className="text-[10px] text-muted font-medium">
                {formatDateTime(comment.createdAt)}
              </span>
              {/* Yêu cầu 4: Bình luận đã sửa hiển thị nhãn phân biệt kèm thời điểm sửa gần nhất */}
              {comment.isEdited && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand">
                  (Đã sửa lúc {formatDateTime(comment.editedAt ?? comment.updatedAt)})
                </span>
              )}
            </div>

            {/* Yêu cầu 1: Menu thao tác gồm Sửa và Xoá */}
            {(canEdit || canDelete) && !isEditing && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-1 hover:bg-surface text-subtle hover:text-ink rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Thao tác"
                >
                  <MoreVertical size={14} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-hairline rounded-lg shadow-lg py-1 z-30 text-xs">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="w-full text-left px-3 py-1.5 hover:bg-canvas text-ink flex items-center gap-2 font-medium"
                      >
                        <Pencil size={13} className="text-muted" />
                        Sửa
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          setShowDeleteConfirm(true)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                      >
                        <Trash2 size={13} className="text-red-500" />
                        Xoá
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Yêu cầu 3: Chỉnh nội dung tại chỗ, huỷ được để giữ nguyên bản cũ; nội dung rỗng thì chặn lưu */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isUpdating}
                placeholder="Nhập nội dung bình luận..."
                className="w-full bg-surface border border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15 rounded-lg p-2.5 text-xs text-ink outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="px-2.5 py-1 text-xs text-muted hover:text-ink font-medium rounded-md transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isUpdating}
                  className="px-3 py-1 text-xs bg-ink text-canvas hover:bg-[#e4e4e5] font-semibold rounded-md transition-colors disabled:opacity-40"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink/90 leading-relaxed whitespace-pre-wrap font-normal">
              {comment.content}
            </p>
          )}
        </div>
      </div>

      {/* Yêu cầu 5: Xoá -> có hộp thoại xác nhận */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xoá bình luận"
        message="Bạn có chắc chắn muốn xoá bình luận này? Hành động này sẽ xoá bình luận khỏi danh sách."
        confirmText="Xoá bình luận"
        cancelText="Huỷ"
        danger={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
