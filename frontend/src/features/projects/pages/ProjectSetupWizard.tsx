import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowRight, CheckCircle2, X } from 'lucide-react'
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

/**
 * Wizard khởi tạo project nhiều bước (giao diện đã gen từ Stitch).
 * { name, key, description } gửi thật lên backend (POST /projects).
 * Sau khi tạo project thành công, danh sách mời (nếu có) được gửi tiếp qua
 * POST /projects/:id/members/invite — lỗi mời (email không tồn tại, đã là thành
 * viên...) không chặn việc điều hướng vào project vừa tạo.
 */
const ProjectSetupWizard = () => {
  const navigate = useNavigate()
  const createMutation = useCreateProject()
  const inviteMutation = useInviteMembers()

  const [methodology, setMethodology] = useState<ProjectMethodology>(PROJECT_METHODOLOGY.SCRUM)
  const [stepIndex, setStepIndex] = useState(0)
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
      setStepIndex(stepIndex + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-6 max-w-4xl mx-auto">
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Khởi tạo không gian dự án</span>
          <button onClick={handleCancel} className="p-1.5 hover:bg-slate-100 rounded-xl text-muted hover:text-ink transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2.5 mb-10 overflow-x-auto pb-2">
          {steps.map((step, idx) => {
            const isActive = idx === stepIndex
            const isCompleted = idx < stepIndex

            return (
              <div key={step} className="flex items-center gap-2 flex-grow min-w-[100px]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                    isCompleted ? 'bg-green-600 text-white' : isActive ? 'bg-brand text-white shadow-md' : 'bg-slate-100 text-muted border border-line/20'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold truncate ${isActive ? 'text-brand' : 'text-muted'}`}>
                  {getStepLabel(step, methodology)}
                </span>
                {idx < steps.length - 1 && <div className="h-px bg-line/20 flex-grow" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-grow py-6 flex items-center justify-center">
        <div className="w-full">
          {currentStepId === 'TYPE' && <SelectProjectType selectedType={methodology} onSelect={setMethodology} />}
          {currentStepId === 'INTRO' && (methodology === PROJECT_METHODOLOGY.SCRUM ? <ScrumIntro /> : <KanbanIntro />)}
          {currentStepId === 'BASIC_INFO' && <SetupBasicInfo data={basicInfo} onChange={setBasicInfo} />}
          {currentStepId === 'INVITE' && <InviteTeam invites={invites} onChange={setInvites} />}
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-line/10 mt-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2.5 hover:bg-slate-100 border border-line/30 rounded-xl text-xs font-bold text-muted hover:text-ink transition-all"
        >
          <ChevronLeft size={16} />
          <span>Quay lại</span>
        </button>

        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-brand text-white hover:bg-brand-light rounded-xl text-xs font-bold shadow-lg shadow-brand/15 transition-all disabled:opacity-45 disabled:pointer-events-none"
        >
          <span>{isLastStep ? 'Khởi tạo không gian' : 'Tiếp tục'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default ProjectSetupWizard
