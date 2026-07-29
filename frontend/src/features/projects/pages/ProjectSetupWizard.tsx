import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ArrowRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { easeOut } from '@/lib/motion'
import SelectProjectType from '../components/wizard/SelectProjectType'
import ScrumIntro from '../components/wizard/ScrumIntro'
import KanbanIntro from '../components/wizard/KanbanIntro'
import SetupBasicInfo, { type BasicInfoData, isProjectKeyValid } from '../components/wizard/SetupBasicInfo'
import InviteTeam, { type TeamInvite } from '../components/wizard/InviteTeam'
import { useCreateProject, useInviteMembers } from '../hooks/useProjectMutations'
import { PROJECT_METHODOLOGY, type ProjectMethodology } from '../project.types'

type StepId = 'TYPE' | 'INTRO' | 'BASIC_INFO' | 'INVITE'

// Sprint được cấu hình sau khi vào trong dự án (không cấu hình trước ở wizard nữa).
const getSteps = (): StepId[] => ['TYPE', 'INTRO', 'BASIC_INFO', 'INVITE']

const getStepLabel = (step: StepId, methodology: ProjectMethodology): string => {
  switch (step) {
    case 'TYPE': return 'Lựa chọn mô hình'
    case 'INTRO': return methodology === PROJECT_METHODOLOGY.SCRUM ? 'Giới thiệu Scrum' : 'Giới thiệu Kanban'
    case 'BASIC_INFO': return 'Thông tin cơ bản'
    case 'INVITE': return 'Mời thành viên'
  }
}

// Hướng trượt của nội dung step: 1 = tiến (Next) trượt vào từ phải, -1 = lùi (Back) trượt
// vào từ trái — người dùng cảm nhận được chiều di chuyển thay vì nội dung chỉ đổi đột ngột.
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -24 : 24 }),
}

const ProjectSetupWizard = () => {
  const navigate = useNavigate()
  const createMutation = useCreateProject()
  const inviteMutation = useInviteMembers()

  const [methodology, setMethodology] = useState<ProjectMethodology>(PROJECT_METHODOLOGY.SCRUM)
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({ name: '', key: '', description: '' })
  const [invites, setInvites] = useState<TeamInvite[]>([])

  const steps = useMemo(() => getSteps(), [])
  const currentStepId = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  const handleCancel = () => navigate('/projects')

  const handleFinish = () => {
    createMutation.mutate(
      { name: basicInfo.name, key: basicInfo.key, methodology, description: basicInfo.description },
      {
        onSuccess: (project) => {
          if (invites.length > 0) {
            inviteMutation.mutate({ projectId: project._id, invites })
          }
          navigate(`/projects/${project._id}`)
        },
      },
    )
  }

  const handleNext = () => {
    if (isLastStep) {
      handleFinish()
    } else {
      setDirection(1)
      setStepIndex(stepIndex + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      setDirection(-1)
      setStepIndex(stepIndex - 1)
    } else {
      handleCancel()
    }
  }

  const isNextDisabled =
    (currentStepId === 'BASIC_INFO' &&
      (!basicInfo.name || !basicInfo.key || !isProjectKeyValid(basicInfo.key))) ||
    createMutation.isPending

  return (
    <div className="min-h-screen flex flex-col justify-between py-10 px-6 max-w-3xl mx-auto">
      <div>
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Khởi tạo không gian dự án</span>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-surface border border-transparent hover:border-hairline rounded-md text-muted hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper: số thứ tự đổi thành dấu check khi hoàn tất (pop nhẹ), đoạn nối "lấp đầy"
            bằng motion khi bước trước đó xong — thay cho line tĩnh + chấm màu cứng trước đây. */}
        <div className="flex items-start justify-between gap-2.5 mb-10">
          {steps.map((step, idx) => {
            const isActive = idx === stepIndex
            const isCompleted = idx < stepIndex

            return (
              <div key={step} className="flex items-start gap-2.5 flex-grow">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 transition-colors',
                      isCompleted
                        ? 'bg-ink text-canvas'
                        : isActive
                          ? 'bg-ink text-canvas ring-4 ring-ink/20'
                          : 'bg-surface text-subtle border border-hairline',
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isCompleted ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check size={13} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="num"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {idx + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={cn('text-[10px] font-semibold text-center whitespace-nowrap', isActive ? 'text-ink' : 'text-subtle')}>
                    {getStepLabel(step, methodology)}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div className="h-px flex-grow bg-hairline overflow-hidden mt-3.5">
                    <motion.div
                      className="h-full bg-ink origin-left"
                      initial={false}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-grow py-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepId}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: easeOut }}
            className="w-full"
          >
            {currentStepId === 'TYPE' && <SelectProjectType selectedType={methodology} onSelect={setMethodology} />}
            {currentStepId === 'INTRO' && (methodology === PROJECT_METHODOLOGY.SCRUM ? <ScrumIntro /> : <KanbanIntro />)}
            {currentStepId === 'BASIC_INFO' && <SetupBasicInfo data={basicInfo} onChange={setBasicInfo} />}
            {currentStepId === 'INVITE' && <InviteTeam invites={invites} onChange={setInvites} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-hairline mt-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-hairline rounded-lg text-xs font-semibold text-ink hover:border-ink/20 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Quay lại</span>
        </button>

        <motion.button
          onClick={handleNext}
          disabled={isNextDisabled}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-ink text-canvas hover:bg-[#e4e4e5] rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>{isLastStep ? 'Khởi tạo không gian' : 'Tiếp tục'}</span>
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  )
}

export default ProjectSetupWizard
