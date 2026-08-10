import type { BadgeColor } from '@/components/ui/Badge'
import type { AuditAction } from './admin.types'

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  USER_LOCK: 'Khoá tài khoản',
  USER_UNLOCK: 'Mở khoá tài khoản',
  USER_ROLE_CHANGE: 'Đổi vai trò',
  USER_DELETE: 'Xoá tài khoản',
  USER_PRO_GRANT: 'Cấp gói PRO thủ công',
  USER_PRO_REVOKE: 'Gỡ gói PRO thủ công',
  PROJECT_OWNER_TRANSFER: 'Bàn giao owner',
  AI_PROMPT_VIEW: 'Xem nội dung prompt AI',
  SETTINGS_CHANGE: 'Đổi cấu hình',
  AI_GLOBAL_TOGGLE: 'Bật/tắt AI toàn hệ thống',
}

export const AUDIT_ACTION_COLOR: Record<AuditAction, BadgeColor> = {
  USER_LOCK: 'red',
  USER_UNLOCK: 'green',
  USER_ROLE_CHANGE: 'blue',
  USER_DELETE: 'red',
  USER_PRO_GRANT: 'blue',
  USER_PRO_REVOKE: 'amber',
  PROJECT_OWNER_TRANSFER: 'amber',
  AI_PROMPT_VIEW: 'amber',
  SETTINGS_CHANGE: 'slate',
  AI_GLOBAL_TOGGLE: 'red',
}
