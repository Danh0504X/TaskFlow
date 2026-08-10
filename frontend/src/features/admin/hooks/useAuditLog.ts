import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import type { AuditLogQuery } from '../admin.types'
import { adminApi } from '../admin.api'
import { fetchAuditLog } from '../mock/audit.mock'

export const useAuditLog = (query: AuditLogQuery) => {
  return useQuery({
    queryKey: adminKeys.auditList(query),
    queryFn: async () => {
      try {
        const data = await adminApi.getAuditLogs(query)
        if (data && Array.isArray(data.items)) {
          return data
        }
      } catch (err) {
        console.warn('Real audit API failed, falling back to mock:', err)
      }
      return fetchAuditLog(query)
    },
  })
}

/** Ghi 1 dòng nhật ký cho hành động nhạy cảm của Admin vào MongoDB. */
export const useAppendAuditEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entry: { adminName?: string; adminEmail?: string; action: string; targetLabel: string; detail?: string }) => {
      try {
        return await adminApi.createAuditLog(entry)
      } catch (err) {
        console.error('Failed to persist audit entry to backend:', err)
        return entry
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.audit() }),
  })
}
