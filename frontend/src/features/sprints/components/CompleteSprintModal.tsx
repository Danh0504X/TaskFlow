import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { toDateInputValue } from '@/lib/format'
import { useCompleteSprint } from '../hooks/useSprintMutations'
import { SPRINT_COMPLETE_RESOLUTION, type Sprint, type SprintCompleteResolution } from '../sprint.types'

interface CompleteSprintModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  sprint: Sprint
  /** Số task chưa DONE trong sprint này — quyết định có cần hỏi resolution hay không. */
  incompleteCount: number
  /** Các sprint PLANNED khác trong project (không gồm sprint đang hoàn thành) — cho lựa chọn MOVE_TO_SPRINT. */
  plannedSprints: Sprint[]
}

/** Modal xác nhận kết thúc sprint — nếu còn task chưa DONE, bắt buộc chọn nơi chuyển chúng tới. */
const CompleteSprintModal = ({
  open,
  onClose,
  projectId,
  sprint,
  incompleteCount,
  plannedSprints,
}: CompleteSprintModalProps) => {
  const completeMutation = useCompleteSprint(projectId)

  const [resolution, setResolution] = useState<SprintCompleteResolution>(
    SPRINT_COMPLETE_RESOLUTION.BACKLOG,
  )
  const [targetSprintId, setTargetSprintId] = useState('')
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintStart, setNewSprintStart] = useState(toDateInputValue(new Date().toISOString()))
  const [newSprintEnd, setNewSprintEnd] = useState('')

  const hasIncomplete = incompleteCount > 0

  const canSubmit =
    !hasIncomplete ||
    resolution === SPRINT_COMPLETE_RESOLUTION.BACKLOG ||
    (resolution === SPRINT_COMPLETE_RESOLUTION.MOVE_TO_SPRINT && !!targetSprintId) ||
    (resolution === SPRINT_COMPLETE_RESOLUTION.NEW_SPRINT &&
      !!newSprintName.trim() &&
      !!newSprintStart &&
      !!newSprintEnd)

  const handleSubmit = () => {
    if (!hasIncomplete) {
      completeMutation.mutate({ sprintId: sprint._id, payload: {} }, { onSuccess: onClose })
      return
    }

    if (resolution === SPRINT_COMPLETE_RESOLUTION.BACKLOG) {
      completeMutation.mutate(
        { sprintId: sprint._id, payload: { resolution } },
        { onSuccess: onClose },
      )
      return
    }

    if (resolution === SPRINT_COMPLETE_RESOLUTION.MOVE_TO_SPRINT) {
      completeMutation.mutate(
        { sprintId: sprint._id, payload: { resolution, targetSprintId } },
        { onSuccess: onClose },
      )
      return
    }

    completeMutation.mutate(
      {
        sprintId: sprint._id,
        payload: {
          resolution,
          newSprint: {
            name: newSprintName.trim(),
            startDate: newSprintStart,
            endDate: newSprintEnd,
          },
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kết thúc sprint"
      tone="danger"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={completeMutation.isPending}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            loading={completeMutation.isPending}
            disabled={!canSubmit}
          >
            Kết thúc sprint
          </Button>
        </>
      }
    >
      {!hasIncomplete ? (
        <p className="text-sm text-muted">
          Sprint <span className="font-bold text-ink">{sprint.name}</span> không còn task nào dở. Xác nhận kết thúc?
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Sprint <span className="font-bold text-ink">{sprint.name}</span> còn{' '}
            <span className="font-bold text-red-600">{incompleteCount} task chưa hoàn thành</span>. Chọn cách xử lý:
          </p>

          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 p-3 border border-line/25 rounded-xl cursor-pointer hover:bg-surface/60 transition-all">
              <input
                type="radio"
                className="mt-0.5"
                checked={resolution === SPRINT_COMPLETE_RESOLUTION.BACKLOG}
                onChange={() => setResolution(SPRINT_COMPLETE_RESOLUTION.BACKLOG)}
              />
              <div>
                <p className="text-xs font-bold text-ink">Đẩy về Backlog</p>
                <p className="text-[11px] text-muted mt-0.5">Giữ nguyên trạng thái từng task, chỉ gỡ khỏi sprint.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 border border-line/25 rounded-xl cursor-pointer hover:bg-surface/60 transition-all">
              <input
                type="radio"
                className="mt-0.5"
                checked={resolution === SPRINT_COMPLETE_RESOLUTION.MOVE_TO_SPRINT}
                onChange={() => setResolution(SPRINT_COMPLETE_RESOLUTION.MOVE_TO_SPRINT)}
                disabled={plannedSprints.length === 0}
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-ink">
                  Chuyển sang sprint khác {plannedSprints.length === 0 && '(chưa có sprint PLANNED nào)'}
                </p>
                {resolution === SPRINT_COMPLETE_RESOLUTION.MOVE_TO_SPRINT && (
                  <select
                    value={targetSprintId}
                    onChange={(e) => setTargetSprintId(e.target.value)}
                    className="mt-2 w-full bg-surface border border-line/25 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="">-- Chọn sprint đích --</option>
                    {plannedSprints.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 border border-line/25 rounded-xl cursor-pointer hover:bg-surface/60 transition-all">
              <input
                type="radio"
                className="mt-0.5"
                checked={resolution === SPRINT_COMPLETE_RESOLUTION.NEW_SPRINT}
                onChange={() => setResolution(SPRINT_COMPLETE_RESOLUTION.NEW_SPRINT)}
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-ink">Tạo sprint mới và chuyển vào</p>
                {resolution === SPRINT_COMPLETE_RESOLUTION.NEW_SPRINT && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Tên sprint mới"
                      value={newSprintName}
                      onChange={(e) => setNewSprintName(e.target.value)}
                      className="w-full bg-surface border border-line/25 rounded-lg px-3 py-2 text-xs font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newSprintStart}
                        onChange={(e) => setNewSprintStart(e.target.value)}
                        className="w-full bg-surface border border-line/25 rounded-lg px-3 py-2 text-xs font-semibold"
                      />
                      <input
                        type="date"
                        value={newSprintEnd}
                        onChange={(e) => setNewSprintEnd(e.target.value)}
                        className="w-full bg-surface border border-line/25 rounded-lg px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default CompleteSprintModal