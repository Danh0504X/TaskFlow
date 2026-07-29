import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { toDateInputValue } from '@/lib/format'
import { useStartSprint, useUpdateSprint } from '../hooks/useSprintMutations'
import type { Sprint, UpdateSprintPayload } from '../sprint.types'

interface SprintFormModalProps {
    projectId: string
    sprint: Sprint
    /** 'edit': chỉ lưu thay đổi. 'start': lưu (nếu có đổi) rồi bắt đầu sprint luôn. */
    mode: 'edit' | 'start'
    onClose: () => void
}

const WEEK_PRESETS = [1, 2, 3, 4]
const MS_PER_DAY = 24 * 60 * 60 * 1000

const addDays = (value: string | Date, days: number): Date => {
    const date = new Date(value)
    date.setDate(date.getDate() + days)
    return date
}

/** Số tuần tròn giữa 2 ngày nếu khớp đúng 1 trong các mốc — null nếu lệch (đã "tuỳ chỉnh" tay). */
const matchWeekPreset = (startInput: string, endInput: string): number | null => {
    const days = Math.round((new Date(endInput).getTime() - new Date(startInput).getTime()) / MS_PER_DAY)
    if (days <= 0 || days % 7 !== 0) return null
    const weeks = days / 7
    return WEEK_PRESETS.includes(weeks) ? weeks : null
}

const fieldClass =
    'w-full bg-surface border border-line/25 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/20'

/**
 * Modal sửa 1 sprint PLANNED — dùng chung cho 2 luồng:
 * - mode="edit": bấm bút chì ở khung sprint -> sửa tên/ngày/mục tiêu rồi Lưu, không đổi trạng thái.
 * - mode="start": bấm "Bắt đầu" -> cho sửa lại thông tin lần cuối trước khi chuyển ACTIVE. Ngày
 *   bắt đầu tự GỢI Ý = hôm nay (chỉ hiển thị, chưa lưu) vì đang start ngay bây giờ.
 *
 * Lưu (cả 2 mode): PUT /sprints/:id nếu có field đổi. Riêng mode="start" sau khi PUT xong (hoặc
 * không có gì đổi) mới PATCH .../start — backend không nhận body cho start nên phải tuần tự.
 * Đóng modal (X, Escape, click nền, nút Huỷ/Thoát): không gọi API nào, sprint giữ nguyên như cũ.
 */
const SprintFormModal = ({ projectId, sprint, mode, onClose }: SprintFormModalProps) => {
    const updateMutation = useUpdateSprint(projectId)
    const startMutation = useStartSprint(projectId)

    const isStart = mode === 'start'
    const todayInput = toDateInputValue(new Date().toISOString())
    const originalWeeks = matchWeekPreset(toDateInputValue(sprint.startDate), toDateInputValue(sprint.endDate))
    const initialStartDate = isStart ? todayInput : toDateInputValue(sprint.startDate)
    const initialWeekPreset = isStart ? (originalWeeks ?? 2) : originalWeeks
    const initialEndDate = isStart
        ? toDateInputValue(addDays(todayInput, (originalWeeks ?? 2) * 7).toISOString())
        : toDateInputValue(sprint.endDate)

    const [name, setName] = useState(sprint.name)
    const [goal, setGoal] = useState(sprint.goal)
    const [startDate, setStartDate] = useState(initialStartDate)
    const [endDate, setEndDate] = useState(initialEndDate)
    const [weekPreset, setWeekPreset] = useState<number | null>(initialWeekPreset)
    const [dateError, setDateError] = useState<string | null>(null)

    const validateDates = (start: string, end: string): string | null => {
        if (!start || !end) return 'Vui lòng chọn đủ ngày bắt đầu và kết thúc'
        if (new Date(end) <= new Date(start)) return 'Ngày kết thúc phải sau ngày bắt đầu'
        return null
    }

    const handleStartDateChange = (value: string) => {
        setStartDate(value)
        const nextEnd = weekPreset ? toDateInputValue(addDays(value, weekPreset * 7).toISOString()) : endDate
        if (weekPreset) setEndDate(nextEnd)
        setDateError(validateDates(value, nextEnd))
    }

    const handleEndDateChange = (value: string) => {
        setEndDate(value)
        setWeekPreset(null) // sửa tay ngày kết thúc -> coi như tuỳ chỉnh, bỏ mốc đang chọn
        setDateError(validateDates(startDate, value))
    }

    const handleWeekPreset = (weeks: number) => {
        setWeekPreset(weeks)
        const nextEnd = toDateInputValue(addDays(startDate, weeks * 7).toISOString())
        setEndDate(nextEnd)
        setDateError(validateDates(startDate, nextEnd))
    }

    const isPending = updateMutation.isPending || startMutation.isPending
    const canSubmit = !!name.trim() && !validateDates(startDate, endDate)

    const handleConfirm = () => {
        const trimmedName = name.trim()
        const err = validateDates(startDate, endDate)
        if (!trimmedName || err) {
            setDateError(err ?? 'Tên sprint không được để trống')
            return
        }

        const payload: UpdateSprintPayload = {}
        if (trimmedName !== sprint.name) payload.name = trimmedName
        if (goal !== sprint.goal) payload.goal = goal
        if (startDate !== toDateInputValue(sprint.startDate)) payload.startDate = startDate
        if (endDate !== toDateInputValue(sprint.endDate)) payload.endDate = endDate
        const hasChanges = Object.keys(payload).length > 0

        if (!isStart) {
            if (hasChanges) {
                updateMutation.mutate({ sprintId: sprint._id, payload }, { onSuccess: onClose })
            } else {
                onClose()
            }
            return
        }

        const doStart = () => startMutation.mutate(sprint._id, { onSuccess: onClose })
        if (hasChanges) {
            updateMutation.mutate({ sprintId: sprint._id, payload }, { onSuccess: doStart })
        } else {
            doStart()
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={isStart ? 'Bắt đầu sprint' : 'Sửa sprint'}
            tone={isStart ? 'success' : 'brand'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isPending}>
                        {isStart ? 'Thoát' : 'Huỷ'}
                    </Button>
                    <Button variant="primary" onClick={handleConfirm} loading={isPending} disabled={!canSubmit}>
                        {isStart ? 'Bắt đầu' : 'Lưu thay đổi'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink">Tên sprint</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={fieldClass}
                        placeholder="Tên sprint"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">Ngày bắt đầu</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">Ngày kết thúc</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink">Mốc sprint</label>
                    <div className="flex gap-1.5">
                        {WEEK_PRESETS.map((weeks) => (
                            <button
                                key={weeks}
                                type="button"
                                onClick={() => handleWeekPreset(weeks)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${weekPreset === weeks
                                        ? 'bg-brand text-canvas border-brand shadow-sm'
                                        : 'bg-surface text-muted border-line/25 hover:border-brand/30 hover:text-brand'
                                    }`}
                            >
                                {weeks} tuần
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink">Sprint goal</label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={2}
                        className={`${fieldClass} resize-none`}
                        placeholder="Mục tiêu (không bắt buộc)"
                    />
                </div>

                {dateError && <p className="text-[11px] text-red-500 font-semibold">{dateError}</p>}
            </div>
        </Modal>
    )
}

export default SprintFormModal