import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import type { AuditLogQuery } from '../admin.types'
import { appendAuditEntry, fetchAuditLog } from '../mock/audit.mock'

export const useAuditLog = (query: AuditLogQuery) => {
  return useQuery({
    queryKey: adminKeys.auditList(query),
    queryFn: () => fetchAuditLog(query),
  })
}

/** Ghi 1 dòng nhật ký cho hành động nhạy cảm chưa có mutation riêng (vd mở nội dung prompt AI). */
export const useAppendAuditEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entry: Parameters<typeof appendAuditEntry>[0]) => {
      appendAuditEntry(entry)
      return entry
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.audit() }),
  })
}
