import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Layers, Plus, X } from 'lucide-react'
import { useDropdownPosition } from '@/lib/useDropdownPosition'
import { useCreateIssue } from '../hooks/useIssueMutations'
import { ISSUE_TYPE, type Issue } from '../issue.types'

interface EpicPickerProps {
    projectId: string
    /** Danh sách issue đầy đủ của project (đã cache sẵn) — dùng để lọc ra các Epic. */
    issues: Issue[]
    /** epicId đang gán (parentIssueId của issue hiện tại), hoặc null = chưa có epic. */
    value: string | null
    onChange: (epicId: string | null) => void
    /** Issue hiện tại — loại khỏi danh sách để tránh tự chọn chính nó làm epic. */
    excludeIssueId: string
    onOpenChange?: (open: boolean) => void
    /** Chỉ hiển thị, không cho bấm đổi — đổi epic đi qua PUT /issues/:id, chỉ OWNER. */
    readOnly?: boolean
}

const DROPDOWN_WIDTH = 240

/**
 * Chọn Epic cho 1 Task/Bug — cùng cơ chế portal với AssigneePicker/StatusPicker. Khi project
 * chưa có Epic nào (hoặc muốn tạo thêm), có thể tạo Epic mới ngay trong dropdown thay vì phải
 * thoát ra màn hình khác.
 */
const EpicPicker = ({
    projectId,
    issues,
    value,
    onChange,
    excludeIssueId,
    onOpenChange,
    readOnly = false,
}: EpicPickerProps) => {
    const [creating, setCreating] = useState(false)
    const [newEpicTitle, setNewEpicTitle] = useState('')
    const createMutation = useCreateIssue(projectId, { silent: true })
    const { open, coords, triggerRef, dropdownRef, toggle, close } = useDropdownPosition({
        width: DROPDOWN_WIDTH,
        estimatedHeight: 240,
        onOpenChange: (next) => {
            onOpenChange?.(next)
            if (!next) {
                setCreating(false)
                setNewEpicTitle('')
            }
        },
    })

    const epics = issues.filter((i) => i.type === ISSUE_TYPE.EPIC && i._id !== excludeIssueId)
    const selected = epics.find((e) => e._id === value)

    const handleSelect = (epicId: string | null) => {
        onChange(epicId)
        close()
    }

    const handleCreateEpic = () => {
        const title = newEpicTitle.trim()
        if (!title || createMutation.isPending) return
        createMutation.mutate(
            { title, type: ISSUE_TYPE.EPIC },
            {
                onSuccess: (created) => {
                    onChange(created._id)
                    close()
                },
            },
        )
    }

    if (readOnly) {
        return selected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                <Layers size={12} className="text-brand shrink-0" />
                <span className="truncate">{selected.title}</span>
            </span>
        ) : (
            <span className="text-xs font-semibold text-subtle">Không có epic</span>
        )
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    toggle()
                }}
                className="w-full flex items-center gap-1.5 text-xs font-bold text-ink hover:text-brand transition-all"
            >
                {selected ? (
                    <>
                        <Layers size={12} className="text-brand shrink-0" />
                        <span className="truncate">{selected.title}</span>
                    </>
                ) : (
                    <span className="text-subtle font-semibold">Không có epic</span>
                )}
            </button>

            {open &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'fixed', top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
                        className="z-50 bg-surface border border-line/20 rounded-2xl shadow-lg py-1.5 max-h-72 overflow-y-auto"
                    >
                        {creating ? (
                            <div className="p-2.5 space-y-2">
                                <input
                                    autoFocus
                                    value={newEpicTitle}
                                    onChange={(e) => setNewEpicTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleCreateEpic()
                                        } else if (e.key === 'Escape') {
                                            setCreating(false)
                                            setNewEpicTitle('')
                                        }
                                    }}
                                    placeholder="Tên epic mới..."
                                    disabled={createMutation.isPending}
                                    className="w-full bg-surface border border-brand/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
                                />
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleCreateEpic}
                                        disabled={!newEpicTitle.trim() || createMutation.isPending}
                                        className="flex-1 px-2.5 py-1.5 bg-brand text-canvas rounded-lg text-xs font-bold hover:bg-brand-light transition-all disabled:opacity-50"
                                    >
                                        Tạo epic
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreating(false)
                                            setNewEpicTitle('')
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface rounded-lg transition-all"
                                    >
                                        Huỷ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(null)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted hover:bg-surface transition-all"
                                >
                                    <div className="w-6 h-6 rounded-full border border-dashed border-line/50 flex items-center justify-center shrink-0">
                                        <X size={12} />
                                    </div>
                                    <span className="flex-1 text-left">Không có epic</span>
                                    {value === null && <Check size={14} className="text-brand" />}
                                </button>

                                {epics.length > 0 && <div className="my-1 border-t border-line/10" />}

                                {epics.map((epic) => (
                                    <button
                                        key={epic._id}
                                        type="button"
                                        onClick={() => handleSelect(epic._id)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface transition-all"
                                    >
                                        <Layers size={14} className="text-brand shrink-0" />
                                        <span className="flex-1 text-left truncate">{epic.title}</span>
                                        {value === epic._id && <Check size={14} className="text-brand shrink-0" />}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-line/10" />

                                <button
                                    type="button"
                                    onClick={() => setCreating(true)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-brand hover:bg-brand/5 transition-all"
                                >
                                    <Plus size={14} className="shrink-0" />
                                    <span className="flex-1 text-left">Tạo epic mới</span>
                                </button>
                            </>
                        )}
                    </div>,
                    document.body,
                )}
        </>
    )
}

export default EpicPicker