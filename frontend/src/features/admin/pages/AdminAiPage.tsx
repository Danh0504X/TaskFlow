import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'
import AdminPageLayout from '../components/AdminPageLayout'

type AiSubTab = 'overview' | 'quota'

const subTabItems: { value: AiSubTab; label: string }[] = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'quota', label: 'Hạn mức & xếp hạng' },
]

const pathToSubTab = (pathname: string): AiSubTab => {
  if (pathname.endsWith('/quota')) return 'quota'
  return 'overview'
}

/** Trang chủ tab "Giám sát AI" — dùng chung AdminPageLayout như mọi trang admin khác, chỉ khác
 * ở chỗ có thêm 1 tầng tab con gắn URL thật (/admin/ai, /admin/ai/logs, /admin/ai/quota) chèn
 * qua prop `headerExtra`. Nội dung từng tab con render qua <Outlet />.
 * layoutGroupId ("ai-subtabs-pill") là tầng tab DUY NHẤT trong khu Admin hiện dùng component
 * Tabs — điều hướng cấp cao nằm ở sidebar (AdminLayout.tsx), không phải Tabs, nên không có
 * nguy cơ 2 pill animation dính vào nhau. */
const AdminAiPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const current = pathToSubTab(location.pathname)

  const handleChange = (tab: AiSubTab) => {
    navigate(tab === 'overview' ? '/admin/ai' : `/admin/ai/${tab}`)
  }

  return (
    <AdminPageLayout
      title="Giám sát AI"
      subtitle="Chi phí, chất lượng gợi ý và kiểm soát hạn mức sinh nội dung bằng AI."
      headerExtra={<Tabs items={subTabItems} value={current} onChange={handleChange} layoutGroupId="ai-subtabs-pill" className="w-fit" />}
    >
      <Outlet />
    </AdminPageLayout>
  )
}

export default AdminAiPage
