import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { generateFromRequirementSchema } from '../ai.schema'
import { AI_GENERATION_TYPE } from '../ai.types'
import { useClarifyRequirement } from '../hooks/useClarifyRequirement'
import { useCreateGeneration } from '../hooks/useCreateGeneration'
import { useGenerationPolling } from '../hooks/useGenerationPolling'
import type { ClarifyingQuestion } from '../ai.types'
import GenerationStatus from './GenerationStatus'
import DraftTable from './DraftTable'
import AiGenerationHistoryPanel from './AiGenerationHistoryPanel'

interface AiGenerateEpicModalProps {
  open: boolean
  onClose: () => void
  projectId: string
}

const fieldInputClass =
  'w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle'
const fieldErrorClass = 'text-[10px] text-pastel-red-ink font-medium'

type WizardStep = 'INPUT' | 'QUESTIONS' | 'RESULT'

/** Modal "Sinh Epic bằng AI" — 2 cột: trái là lịch sử các lượt REQ_TO_EPIC đã sinh của project
 * (AiGenerationHistoryPanel), phải là khu vực làm việc chính: nhập yêu cầu -> AI hỏi làm rõ (nếu
 * cần) -> trả lời từng câu -> xem trạng thái sinh -> duyệt (sửa/xoá/chấp nhận) draft — TẤT CẢ
 * ngay trong modal này, không điều hướng sang trang nào khác (không còn phụ thuộc /ai-lab).
 * Bấm 1 mục lịch sử bên trái tái dùng đúng bước RESULT để xem lại prompt + draft cũ. */
const AiGenerateEpicModal = ({ open, onClose, projectId }: AiGenerateEpicModalProps) => {
  const [step, setStep] = useState<WizardStep>('INPUT')
  const [inputPrompt, setInputPrompt] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [resultGenerationId, setResultGenerationId] = useState<string | null>(null)
  // Mặc định TẮT — bấm "Tạo" là sinh epic thẳng, không qua bước hỏi-đáp (PM tự quyết đánh đổi
  // tốc độ vs độ sát yêu cầu, xem text cạnh switch trong bước INPUT).
  const [clarifyEnabled, setClarifyEnabled] = useState(false)

  const clarifyMutation = useClarifyRequirement(projectId)
  const createMutation = useCreateGeneration(projectId)
  const { data: resultGeneration } = useGenerationPolling(projectId, resultGenerationId)

  // Dùng chung cho "Đóng hẳn modal" lẫn "+ Sinh yêu cầu mới" (khác nhau đúng 1 chỗ: có gọi
  // onClose() hay không) — reset toàn bộ wizard + kết quả đang xem.
  const resetWizardState = () => {
    setStep('INPUT')
    setInputPrompt('')
    setInputError(null)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers({})
    setResultGenerationId(null)
    setClarifyEnabled(false)
  }

  const handleClose = () => {
    resetWizardState()
    onClose()
  }

  const handleStartNew = () => {
    resetWizardState()
  }

  const handleSelectHistory = (generationId: string) => {
    setResultGenerationId(generationId)
    setStep('RESULT')
  }

  const submitGeneration = (rawAnswers: Record<string, string>) => {
    const clarifications = Object.fromEntries(
      Object.entries(rawAnswers).filter(([, value]) => value.trim() !== ''),
    )

    createMutation.mutate(
      {
        generationType: AI_GENERATION_TYPE.REQ_TO_EPIC,
        inputPrompt,
        clarifications: Object.keys(clarifications).length > 0 ? clarifications : null,
      },
      {
        onSuccess: (res) => {
          setResultGenerationId(res.generationId)
          setStep('RESULT')
        },
      },
    )
  }

  // Bấm "Tạo" ở bước INPUT: bật switch làm rõ -> qua clarify trước (như cũ, có thể tự bỏ qua
  // hỏi nếu AI thấy req đã đủ rõ); tắt switch -> bỏ qua clarify hoàn toàn, sinh epic thẳng.
  const handleCreateFromInput = () => {
    const parsed = generateFromRequirementSchema.safeParse({ inputPrompt })
    if (!parsed.success) {
      setInputError(parsed.error.issues[0]?.message ?? 'Yêu cầu không hợp lệ')
      return
    }
    setInputError(null)

    if (!clarifyEnabled) {
      submitGeneration({})
      return
    }

    clarifyMutation.mutate(
      { inputPrompt: parsed.data.inputPrompt },
      {
        onSuccess: (res) => {
          if (res.questions.length === 0) {
            // Requirement đã đủ rõ -> AI không cần hỏi thêm, tạo epic luôn.
            submitGeneration({})
            return
          }
          setQuestions(res.questions)
          setCurrentIndex(0)
          setAnswers({})
          setStep('QUESTIONS')
        },
      },
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const currentAnswer = currentQuestion ? (answers[currentQuestion.key] ?? '') : ''

  const handleNext = () => {
    if (isLastQuestion) {
      submitGeneration(answers)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Sinh Epic bằng AI" icon={<Sparkles size={18} />} layout="wide" footer={
      step === 'INPUT' ? (
        <>
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateFromInput}
            loading={clarifyEnabled ? clarifyMutation.isPending : createMutation.isPending}
          >
            Tạo
          </Button>
        </>
      ) : step === 'QUESTIONS' ? (
        <>
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleNext} loading={createMutation.isPending}>
            {isLastQuestion ? 'Tạo' : 'Tiếp theo'}
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      )
    }>
      {/* Khung cố định (h-[65vh]) — không co giãn theo lượng nội dung mỗi cột, để modal luôn
          cùng 1 kích thước dù đang ở bước nào / có bao nhiêu lịch sử hay draft. Mỗi cột tự cuộn
          riêng bên trong (`overflow-y-auto` + `h-full`), không đụng tới cột còn lại. */}
      <div className="grid h-[65vh] grid-cols-[220px_1fr] gap-5">
        <div className="flex h-full flex-col gap-3">
          <Button variant="secondary" size="sm" className="w-full shrink-0" onClick={handleStartNew}>
            + Sinh yêu cầu mới
          </Button>
          <div className="min-h-0 flex-1">
            <AiGenerationHistoryPanel
              projectId={projectId}
              activeGenerationId={resultGenerationId}
              onSelect={handleSelectHistory}
            />
          </div>
        </div>

        <div className="h-full overflow-y-auto pr-1">
          {step === 'INPUT' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink">Yêu cầu nghiệp vụ</label>
              <div className="relative">
                <textarea
                  rows={6}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={
                    'Mô tả yêu cầu nghiệp vụ (càng chi tiết, AI càng đề xuất sát)...\n' +
                    'VD: Xây dựng hệ thống đặt lịch khám bệnh trực tuyến — người dùng đăng ký/đăng nhập, ' +
                    'đặt lịch khám, bác sĩ xác nhận, có thông báo nhắc lịch qua email.'
                  }
                  className={`${fieldInputClass} resize-none pb-6`}
                />
                <span className="absolute bottom-3 right-3.5 text-[9px] font-semibold text-muted">
                  {inputPrompt.length}/5000
                </span>
              </div>
              {inputError && <p className={fieldErrorClass}>{inputError}</p>}

              <div className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-canvas/40 p-3">
                <div>
                  <p className="text-xs font-semibold text-ink">Làm rõ yêu cầu trước khi tạo</p>
                  <p className="mt-0.5 text-[10px] italic text-subtle">
                    AI sẽ hỏi thêm khi cần để kết quả sát với yêu cầu hơn. Tắt để tạo ngay.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={clarifyEnabled}
                  aria-label="Làm rõ yêu cầu trước khi tạo"
                  onClick={() => setClarifyEnabled((v) => !v)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                    clarifyEnabled ? 'bg-ink' : 'bg-hairline',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-surface transition-transform',
                      clarifyEnabled ? 'translate-x-4' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {step === 'QUESTIONS' &&
            currentQuestion && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                  Câu hỏi {currentIndex + 1}/{questions.length}
                </span>
                <p className="text-sm font-semibold text-ink">{currentQuestion.question}</p>

                {currentQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [currentQuestion.key]: option }))}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                          currentAnswer === option
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-hairline text-muted hover:border-ink/30 hover:text-ink',
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-subtle">Câu trả lời của bạn (có thể để trống)</label>
                  <textarea
                    rows={2}
                    value={currentAnswer}
                    onChange={(e) => setAnswers((a) => ({ ...a, [currentQuestion.key]: e.target.value }))}
                    placeholder="Chọn 1 gợi ý ở trên, hoặc tự nhập câu trả lời..."
                    className={`${fieldInputClass} resize-none`}
                  />
                </div>
              </div>
            )}

          {step === 'RESULT' &&
            (!resultGeneration ? (
              <div className="flex items-center gap-2 text-xs text-subtle">
                <Spinner /> Đang tải...
              </div>
            ) : (
              <div className="space-y-4">
                {resultGeneration.inputPrompt && (
                  <p className="rounded-lg border border-hairline bg-canvas/50 px-3 py-2 text-xs italic text-muted">
                    "{resultGeneration.inputPrompt}"
                  </p>
                )}

                <GenerationStatus
                  status={resultGeneration.status}
                  errorMessage={resultGeneration.errorMessage}
                  onRetry={() => submitGeneration(answers)}
                  retrying={createMutation.isPending}
                />

                {resultGeneration.status === 'COMPLETED' && (
                  <DraftTable
                    projectId={projectId}
                    generationId={resultGeneration._id}
                    drafts={resultGeneration.drafts}
                  />
                )}
              </div>
            ))}
        </div>
      </div>
    </Modal>
  )
}

export default AiGenerateEpicModal
