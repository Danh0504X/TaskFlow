import { ChevronDown, Check, Clock, Layers } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ConfigurationData {
  estimation: 'STORY_POINTS' | 'HOURS' | 'TASKS_COUNT'
  sprintDuration: '1_WEEK' | '2_WEEKS' | '3_WEEKS' | '4_WEEKS'
}

interface SetupConfigurationProps {
  data: ConfigurationData
  onChange: (data: ConfigurationData) => void
}

const estimationOptions = [
  { value: 'STORY_POINTS', icon: Layers, title: 'Story Points', desc: 'Ước lượng theo độ khó tương đối (Fibonacci).' },
  { value: 'HOURS', icon: Clock, title: 'Thời gian thực tế', desc: 'Ước lượng trực tiếp theo số giờ.' },
  { value: 'TASKS_COUNT', icon: Check, title: 'Số lượng Task', desc: 'Chỉ đếm số lượng công việc hoàn thành.' },
] as const

const SetupConfiguration = ({ data, onChange }: SetupConfigurationProps) => {
  return (
    <div className="space-y-6 max-w-xl mx-auto text-left">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Cấu hình quy trình</h2>
        <p className="text-muted mt-2 text-xs font-semibold">Tùy chỉnh thông số vận hành mặc định cho đội ngũ.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider block">Hình thức ước lượng độ khó</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {estimationOptions.map(({ value, icon: Icon, title, desc }) => (
              <div
                key={value}
                onClick={() => onChange({ ...data, estimation: value })}
                className={cn(
                  'border-2 rounded-2xl p-4 cursor-pointer transition-all',
                  data.estimation === value ? 'border-brand bg-brand/5' : 'border-line/20 hover:border-brand/30',
                )}
              >
                <Icon className="text-brand mb-2" size={20} />
                <h4 className="font-bold text-xs text-ink mb-1">{title}</h4>
                <p className="text-[9px] text-muted leading-tight font-semibold">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider block">Độ dài Sprint mặc định</label>
          <div className="relative">
            <select
              value={data.sprintDuration}
              onChange={(e) => onChange({ ...data, sprintDuration: e.target.value as ConfigurationData['sprintDuration'] })}
              className="w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3.5 text-xs font-bold text-ink focus:ring-2 focus:ring-brand/20 outline-none appearance-none cursor-pointer"
            >
              <option value="1_WEEK">1 Tuần</option>
              <option value="2_WEEKS">2 Tuần (khuyên dùng)</option>
              <option value="3_WEEKS">3 Tuần</option>
              <option value="4_WEEKS">4 Tuần / 1 Tháng</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupConfiguration
