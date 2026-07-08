import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowRight, CheckCircle2, X } from 'lucide-react'
import SelectProjectType, { type ProjectMethodology } from '../components/wizard/SelectProjectType'
import ScrumIntro from '../components/wizard/ScrumIntro'
import KanbanIntro from '../components/wizard/KanbanIntro'
import SetupBasicInfo, { type BasicInfoData } from '../components/wizard/SetupBasicInfo'
import SetupConfiguration, { type ConfigurationData } from '../components/wizard/SetupConfiguration'
import InviteTeam, { type TeamInvite } from '../components/wizard/InviteTeam'
import ConnectWork from '../components/wizard/ConnectWork'
import { DEFAULT_INTEGRATIONS } from '../components/wizard/integrations'
import { useCreateProject } from '../hooks/useProjectMutations'

const TOTAL_STEPS = 6

const stepTitle = (step: number, methodology: ProjectMethodology): string => {
  switch (step) {
    case 1: return 'Lựa chọn mô hình'
    case 2: return methodology === 'SCRUM' ? 'Giới thiệu Scrum' : 'Giới thiệu Kanban'
    case 3: return 'Thông tin cơ bản'
    case 4: return 'Cấu hình thông số'
    case 5: return 'Mời thành viên'
    case 6: return 'Tích hợp công cụ'
    default: return ''
  }
}

/**
 * Wizard khởi tạo project nhiều bước (giao diện đã gen từ Stitch).
 * Chỉ { name, description } được gửi lên backend thật (POST /projects) —
 * phương pháp luận, cấu hình sprint, lời mời và tích hợp CHƯA có API tương ứng
 * nên chỉ tồn tại trong trải nghiệm wizard, chưa được lưu lại.
 */
const ProjectSetupWizard = () => {
  const navigate = useNavigate()
  const createMutation = useCreateProject()

  const [currentStep, setCurrentStep] = useState(1)
  const [methodology, setMethodology] = useState<ProjectMethodology>('SCRUM')
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({ name: '', key: '', description: '' })
  const [configuration, setConfiguration] = useState<ConfigurationData>({ estimation: 'STORY_POINTS', sprintDuration: '2_WEEKS' })
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS)

  const handleCancel = () => navigate('/projects')

  const handleFinish = () => {
    createMutation.mutate(
      { name: basicInfo.name, description: basicInfo.description },
      {
        onSuccess: (project) => navigate(`/projects/${project._id}`),
      },
    )
  }

  const handleNext = () => {
    if (currentStep === 1 && methodology === 'CUSTOM') {
      setCurrentStep(3)
      return
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentStep === 3 && methodology === 'CUSTOM') {
      setCurrentStep(1)
      return
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      handleCancel()
    }
  }

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => prev.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item)))
  }

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
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
            const stepNum = idx + 1
            if (stepNum === 2 && methodology === 'CUSTOM') return null
            const isActive = currentStep === stepNum
            const isCompleted = currentStep > stepNum

            return (
              <div key={stepNum} className="flex items-center gap-2 flex-grow min-w-[100px]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                    isCompleted ? 'bg-green-600 text-white' : isActive ? 'bg-brand text-white shadow-md' : 'bg-slate-100 text-muted border border-line/20'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : stepNum}
                </div>
                <span className={`text-[10px] font-bold truncate ${isActive ? 'text-brand' : 'text-muted'}`}>
                  {stepTitle(stepNum, methodology)}
                </span>
                {stepNum < TOTAL_STEPS && <div className="h-px bg-line/20 flex-grow" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-grow py-6 flex items-center justify-center">
        <div className="w-full">
          {currentStep === 1 && <SelectProjectType selectedType={methodology} onSelect={setMethodology} />}
          {currentStep === 2 && methodology === 'SCRUM' && <ScrumIntro />}
          {currentStep === 2 && methodology === 'KANBAN' && <KanbanIntro />}
          {currentStep === 3 && <SetupBasicInfo data={basicInfo} onChange={setBasicInfo} />}
          {currentStep === 4 && <SetupConfiguration data={configuration} onChange={setConfiguration} />}
          {currentStep === 5 && <InviteTeam invites={invites} onChange={setInvites} />}
          {currentStep === 6 && <ConnectWork integrations={integrations} onToggle={toggleIntegration} />}
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
          disabled={(currentStep === 3 && (!basicInfo.name || !basicInfo.key)) || createMutation.isPending}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-brand text-white hover:bg-brand-light rounded-xl text-xs font-bold shadow-lg shadow-brand/15 transition-all disabled:opacity-45 disabled:pointer-events-none"
        >
          <span>{currentStep === TOTAL_STEPS ? 'Khởi tạo không gian' : 'Tiếp tục'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default ProjectSetupWizard
