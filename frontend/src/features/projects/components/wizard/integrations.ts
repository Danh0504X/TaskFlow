import { MessageSquare, Code2, Calendar } from 'lucide-react'

export interface Integration {
  id: string
  name: string
  desc: string
  connected: boolean
  icon: typeof MessageSquare
  iconColor: string
}

export const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'slack', name: 'Slack Communication', desc: 'Báo cáo tiến độ hàng ngày qua kênh trò chuyện.', connected: false, icon: MessageSquare, iconColor: 'bg-indigo-500 text-white' },
  { id: 'github', name: 'GitHub Repository', desc: 'Đồng bộ hóa Commits, Pull Requests lên từng đầu việc.', connected: false, icon: Code2, iconColor: 'bg-zinc-800 text-white' },
  { id: 'calendar', name: 'Google Calendar', desc: 'Đưa lịch Sprint và lịch họp lên lịch cá nhân thành viên.', connected: false, icon: Calendar, iconColor: 'bg-blue-600 text-white' },
]
