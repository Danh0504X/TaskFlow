import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import { fetchAdminOverview } from '../mock/overview.mock'

/** Dữ liệu tab "Tổng quan". Khi có backend thật, chỉ cần đổi `queryFn` sang gọi API. */
export const useAdminOverview = () => {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: fetchAdminOverview,
  })
}
