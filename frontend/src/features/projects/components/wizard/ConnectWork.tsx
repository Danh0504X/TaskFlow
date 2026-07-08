import { Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Integration } from './integrations'

interface ConnectWorkProps {
  integrations: Integration[]
  onToggle: (id: string) => void
}

/** Tích hợp bên thứ ba — chỉ là UI bật/tắt cục bộ, backend chưa có endpoint tích hợp. */
const ConnectWork = ({ integrations, onToggle }: ConnectWorkProps) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto text-left">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider mb-3">
          <Sparkles size={12} />
          <span>Tích hợp</span>
        </span>
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Đồng bộ môi trường làm việc</h2>
        <p className="text-muted mt-2 text-xs font-semibold">Tích hợp các công cụ làm việc để tự động hóa theo dõi tiến trình.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {integrations.map((app) => (
          <div key={app.id} className="flex items-center justify-between p-4.5 border border-line/15 hover:border-brand/35 rounded-3xl bg-white hover:bg-slate-50/50 transition-all shadow-sm">
            <div className="flex items-start gap-4">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', app.iconColor)}>
                <app.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink leading-tight">{app.name}</h4>
                <p className="text-[10px] text-muted font-medium leading-relaxed mt-1.5 max-w-md">{app.desc}</p>
              </div>
            </div>

            <button
              onClick={() => onToggle(app.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
                app.connected
                  ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                  : 'bg-brand text-white hover:bg-brand-light shadow-md shadow-brand/10',
              )}
            >
              {app.connected ? (
                <span className="flex items-center gap-1.5">
                  <Check size={14} />
                  <span>Đã liên kết</span>
                </span>
              ) : (
                <span>Liên kết</span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConnectWork
