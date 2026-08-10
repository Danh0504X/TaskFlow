import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Pencil, Trash2, MoreVertical, History } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/format'
import { useProject } from '@/features/projects/hooks/useProject'
import { MentionInput } from './MentionInput'
import type { CommentItem as CommentItemType, CommentEditRecord } from '../comment.types'

interface CommentItemProps {
  comment: CommentItemType
  projectId: string
  currentUserId?: string
  isProjectOwner?: boolean
  onUpdate: (commentId: string, content: string) => Promise<void> | void
  onDelete: (commentId: string) => Promise<void> | void
  isUpdating?: boolean
  isDeleting?: boolean
}

export const CommentItem = ({
  comment,
  projectId,
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
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const authorName = comment.author?.fullName ?? 'Người dùng'
  const authorAvatar = comment.author?.avatarUrl ?? null

  const isAuthor = currentUserId === comment.authorId
  // Yêu cầu 2: Chỉ người viết mới sửa được bình luận của mình; chủ sở hữu dự án xoá được bình luận bất kỳ nhưng không sửa được.
  const canEdit = isAuthor
  const canDelete = isAuthor || isProjectOwner

  const isExceededOneHour = (createdAtStr: string): boolean => {
    const createdTime = new Date(createdAtStr).getTime()
    if (Number.isNaN(createdTime)) return false
    return Date.now() - createdTime > 60 * 60 * 1000
  }

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      handleCancelEdit()
    }
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    if (isExceededOneHour(comment.createdAt)) {
      setShowExpiredModal(true)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = async () => {
    await onDelete(comment._id)
    setShowDeleteConfirm(false)
  }

  const { data: project } = useProject(projectId)
  const memberNames = (project?.members || [])
    .map((m) => {
      const user = typeof m.userId === 'object' && m.userId !== null ? m.userId : (m.user ?? null)
      return user?.fullName
    })
    .filter((name): name is string => !!name)

  const renderFormattedContent = (content: string) => {
    if (!content) return null

    // Nếu có danh sách tên thành viên dự án: khớp chính xác và đầy đủ họ tên từng thành viên
    if (memberNames && memberNames.length > 0) {
      const sortedNames = [...memberNames].sort((a, b) => b.length - a.length)
      const escapedNames = sortedNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const pattern = new RegExp(`(@(?:${escapedNames.join('|')}))`, 'gi')

      const parts = content.split(pattern)
      return parts.map((part, idx) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={idx}
              className="inline-block font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded text-[11px] mr-0.5"
            >
              {part}
            </span>
          )
        }
        return part
      })
    }

    // Fallback: Tách theo @Tên cho đến mốc từ khoá/dấu câu
    const parts = content.split(/(@[A-Za-z0-9_À-ỹ\s]+?(?=\s*(?:nhắc|cmt|bình luận|về|vào|cho|ở|tại|[.,!?:;]|$)))/gi)
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="inline-block font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded text-[11px] mr-0.5"
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  const historyRecords: CommentEditRecord[] = (comment.editHistory && comment.editHistory.length > 0)
    ? comment.editHistory
    : comment.isEdited
    ? [
        { content: '(Bản gốc trước khi chỉnh sửa)', editedAt: comment.createdAt },
        { content: comment.content, editedAt: comment.editedAt || comment.updatedAt },
      ]
    : [{ content: comment.content, editedAt: comment.createdAt }]

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
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  title="Bấm để xem lịch sử chỉnh sửa bình luận"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors cursor-pointer"
                >
                  (Đã sửa lúc {formatDateTime(comment.editedAt ?? comment.updatedAt)})
                </button>
              )}
            </div>

            {/* Menu thao tác gồm Sửa, Xem lịch sử chỉnh sửa và Xoá */}
            {!isEditing && (
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
                  <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-hairline rounded-xl shadow-xl py-1 z-30 text-xs">
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

                    {/* Nút bổ sung ngay bên dưới nút Sửa */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        setShowHistoryModal(true)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-canvas text-ink flex items-center gap-2 font-medium"
                    >
                      <History size={13} className="text-muted" />
                      Xem lịch sử chỉnh sửa
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={handleDeleteClick}
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

          {/* US 2: Hiển thị nổi bật tên người được nhắc tên trong nội dung và dùng MentionInput khi sửa */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <MentionInput
                value={editContent}
                onChange={setEditContent}
                projectId={projectId}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isUpdating}
                placeholder="Nhập nội dung bình luận... (gõ @ để nhắc tên)"
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
              {renderFormattedContent(comment.content)}
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

      {/* Modal thông báo khi quá 1 giờ từ thời điểm tạo */}
      <Modal
        open={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        title="Không thể xoá bình luận"
        tone="info"
        layout="compact"
        footer={
          <Button variant="secondary" onClick={() => setShowExpiredModal(false)}>
            Đã hiểu
          </Button>
        }
      >
        <p className="text-sm text-muted">
          Bình luận chỉ có thể xoá trong vòng 1 giờ kể từ khi tạo lần đầu. Đã quá thời hạn 1 giờ nên bạn không thể xoá bình luận này nữa.
        </p>
      </Modal>

      {/* Modal hiển thị lịch sử chỉnh sửa bình luận theo trình tự thời gian */}
      {showHistoryModal && (
        <Modal
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Lịch sử chỉnh sửa bình luận"
          layout="center"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(false)}>
              Đóng
            </Button>
          }
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
              <Avatar src={authorAvatar} name={authorName} size={30} />
              <div>
                <h5 className="text-xs font-bold text-ink">{authorName}</h5>
                <p className="text-[10px] text-muted font-medium">
                  {historyRecords.length > 1
                    ? `Đã chỉnh sửa ${historyRecords.length - 1} lần`
                    : 'Bình luận chưa qua chỉnh sửa'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
              {historyRecords.map((record, index) => {
                const isOriginal = index === 0
                const isLatest = index === historyRecords.length - 1
                const versionLabel = isOriginal
                  ? 'Bản gốc'
                  : isLatest
                  ? `Lần chỉnh sửa ${index} (Mới nhất)`
                  : `Lần chỉnh sửa ${index}`

                return (
                  <div key={index} className="relative pl-7 space-y-1.5">
                    <div
                      className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-surface shadow-sm transform -translate-x-1/2 ${
                        isLatest ? 'bg-brand' : 'bg-muted'
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        {versionLabel}
                      </span>
                      <span className="text-[10px] font-medium text-muted">
                        {formatDateTime(record.editedAt)}
                      </span>
                    </div>
                    <div className="bg-canvas p-3 rounded-xl border border-hairline text-xs text-ink leading-relaxed whitespace-pre-wrap">
                      {renderFormattedContent(record.content)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
