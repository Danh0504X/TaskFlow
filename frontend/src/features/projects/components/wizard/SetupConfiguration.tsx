import { ChevronDown } from 'lucide-react'

export interface ConfigurationData {
  sprintDuration: '1_WEEK' | '2_WEEKS' | '3_WEEKS' | '4_WEEKS'
}

interface SetupConfigurationProps {
  data: ConfigurationData
  onChange: (data: ConfigurationData) => void
}

/** Chỉ áp dụng cho Scrum — Kanban không có khái niệm Sprint nên bỏ qua bước này. */
const SetupConfiguration = ({ data, onChange }: SetupConfigurationProps) => {
  return (
    <div className="space-y-6 max-w-xl mx-auto text-left">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Cấu hình Sprint</h2>
        <p className="text-muted mt-2 text-xs font-semibold">Độ dài mặc định mỗi Sprint — dùng để tự điền ngày khi tạo Sprint sau này.</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-extrabold text-ink uppercase tracking-wider block">Độ dài Sprint mặc định</label>
        <div className="relative">
          <select
            value={data.sprintDuration}
            onChange={(e) => onChange({ sprintDuration: e.target.value as ConfigurationData['sprintDuration'] })}
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
  )
}

export default SetupConfiguration
