import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import { adminApi } from '../admin.api'

/** Dữ liệu tab "Tổng quan" — người dùng, doanh thu SePay, cảnh báo AI (dữ liệu thật từ /admin/overview). */
export const useAdminOverview = () => {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: adminApi.getOverview,
  })
}
