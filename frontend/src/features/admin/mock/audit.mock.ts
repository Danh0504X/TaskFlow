import type { AuditAction, AuditLogItem, AuditLogQuery, AuditLogResponse } from '../admin.types'

let seed = 2026
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
const daysAgoIso = (days: number, extraMin = 0) => new Date(Date.now() - days * 86_400_000 - extraMin * 60_000).toISOString()

const ADMINS = [
  { name: 'System Admin', email: 'admin@gmail.com' },
  { name: 'Lê Quản Trị', email: 'quantri.phu2@gmail.com' },
]

const TEMPLATES: { action: AuditAction; targetLabel: string; detail: string }[] = [
  { action: 'USER_LOCK', targetLabel: 'nguyen.van.an12@gmail.com', detail: 'Khoá tài khoản do báo cáo spam từ 3 người dùng khác.' },
  { action: 'USER_UNLOCK', targetLabel: 'tran.thi.binh8@gmail.com', detail: 'Mở khoá sau khi xác minh lại danh tính qua email.' },
  { action: 'USER_ROLE_CHANGE', targetLabel: 'quantri.phu2@gmail.com', detail: 'Nâng quyền user -> admin.' },
  { action: 'USER_DELETE', targetLabel: 'le.hoang.chi21@gmail.com', detail: 'Xoá tài khoản theo yêu cầu người dùng (GDPR).' },
  { action: 'PROJECT_OWNER_TRANSFER', targetLabel: 'Dự án "Website bán hàng"', detail: 'Bàn giao quyền owner từ le.hoang.chi21@gmail.com sang pham.minh.dung5@gmail.com trước khi xoá tài khoản cũ.' },
  { action: 'AI_PROMPT_VIEW', targetLabel: 'log #gen-42', detail: 'Xem nội dung inputPrompt/rawOutput để điều tra khiếu nại chất lượng gợi ý AI.' },
  { action: 'SETTINGS_CHANGE', targetLabel: 'Cấu hình hệ thống', detail: 'Đổi trần quota AI mặc định mỗi user/ngày từ 10 -> 15.' },
  { action: 'AI_GLOBAL_TOGGLE', targetLabel: 'Công tắc AI toàn hệ thống', detail: 'Tạm tắt AI toàn hệ thống để xử lý sự cố chi phí tăng bất thường.' },
]

const buildItems = (): AuditLogItem[] => {
  const items: AuditLogItem[] = []
  for (let i = 0; i < 64; i++) {
    const tpl = TEMPLATES[i % TEMPLATES.length]
    const admin = ADMINS[Math.floor(rand() * ADMINS.length)]
    items.push({
      _id: `audit-${i + 1}`,
      createdAt: daysAgoIso(Math.floor(rand() * 45), Math.floor(rand() * 1440)),
      adminName: admin.name,
      adminEmail: admin.email,
      action: tpl.action,
      targetLabel: tpl.targetLabel,
      detail: tpl.detail,
    })
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const allItems = buildItems()

export const fetchAuditLog = (query: AuditLogQuery = {}): Promise<AuditLogResponse> => {
  const { page = 1, limit = 20, action, adminEmail, dateFrom, dateTo } = query

  let filtered = allItems
  if (action) filtered = filtered.filter((i) => i.action === action)
  if (adminEmail) filtered = filtered.filter((i) => i.adminEmail === adminEmail)
  if (dateFrom) filtered = filtered.filter((i) => i.createdAt >= dateFrom)
  if (dateTo) filtered = filtered.filter((i) => i.createdAt <= dateTo)

  const start = (page - 1) * limit
  const response: AuditLogResponse = {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  }
  return new Promise((resolve) => setTimeout(() => resolve(response), 350))
}

export const appendAuditEntry = (entry: Omit<AuditLogItem, '_id' | 'createdAt'>) => {
  allItems.unshift({ ...entry, _id: `audit-live-${allItems.length + 1}`, createdAt: new Date().toISOString() })
}
