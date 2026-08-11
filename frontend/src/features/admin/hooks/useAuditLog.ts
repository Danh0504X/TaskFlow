import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import type { AuditLogQuery } from '../admin.types'
import { adminApi } from '../admin.api'

/** Nhật ký hệ thống — dữ liệu thật từ MongoDB (AuditLog), backend tự ghi ở các thao tác nhạy
 * cảm (vd cấp/gỡ PRO thủ công trong paymentService.js). */
export const useAuditLog = (query: AuditLogQuery) => {
  return useQuery({
    queryKey: adminKeys.auditList(query),
    queryFn: () => adminApi.getAuditLogs(query),
  })
}

/** Ghi 1 dòng nhật ký cho hành động nhạy cảm của Admin — chỉ dùng cho thao tác chưa có log tự
 * động ở backend. Không gọi trùng với các action backend đã tự ghi (khoá/mở khoá, đổi vai trò,
 * xoá tài khoản, cấp/gỡ PRO — xem userService.js / paymentService.js). */
export const useAppendAuditEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: { action: string; targetId?: string; targetLabel: string; detail?: string }) =>
      adminApi.createAuditLog(entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.audit() }),
  })
}
