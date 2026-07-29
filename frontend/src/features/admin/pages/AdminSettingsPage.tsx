import type { ReactNode } from 'react'
import Input from '@/components/ui/Input'
import AdminPageLayout from '../components/AdminPageLayout'
import { SectionCard } from '../components/TableStates'

const NotWiredNote = () => <p className="text-[11px] text-subtle mt-1">Chưa nối backend — chỉ hiển thị giao diện.</p>

const SettingRow = ({ label, description, children }: { label: string; description: string; children: ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-4 border-b border-hairline last:border-0">
    <div className="max-w-sm">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-subtle mt-0.5">{description}</p>
    </div>
    <div className="w-full sm:w-64 shrink-0">{children}</div>
  </div>
)

/** Toggle switch tĩnh (disabled) — thuần CSS, không thêm dependency. */
const DisabledToggle = ({ checked }: { checked: boolean }) => (
  <div
    aria-disabled
    className={`inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-60 cursor-not-allowed ${
      checked ? 'bg-brand' : 'bg-hairline'
    }`}
  >
    <span className={`h-4.5 w-4.5 rounded-full bg-canvas shadow transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </div>
)

const AdminSettingsPage = () => {
  return (
    <AdminPageLayout title="Cấu hình" subtitle="Cấu hình toàn hệ thống — hiện là bản xem trước giao diện, chưa nối backend.">
      <SectionCard className="p-6 max-w-2xl">
        <SettingRow label="Cho phép đăng ký mới" description="Bật/tắt luồng tự đăng ký tài khoản (/register) trên toàn hệ thống.">
          <DisabledToggle checked />
          <NotWiredNote />
        </SettingRow>

        <SettingRow label="Trần quota AI mặc định" description="Số lượt sinh AI tối đa mỗi user được dùng trong 1 ngày (áp dụng mặc định, có thể chỉnh riêng ở tab Giám sát AI).">
          <Input type="number" defaultValue={15} disabled />
          <NotWiredNote />
        </SettingRow>

        <SettingRow label="Provider &amp; model AI" description="Nhà cung cấp và model đang dùng để sinh epic/task/subtask.">
          <select disabled className="w-full bg-surface border border-hairline rounded-xl py-2 px-3 text-sm text-ink opacity-60 cursor-not-allowed">
            <option>Anthropic — claude-sonnet-5</option>
          </select>
          <NotWiredNote />
        </SettingRow>

        <SettingRow label="Rate-limit email" description="Số email tối đa (xác thực, mời, đặt lại mật khẩu) được gửi cho 1 địa chỉ trong 1 giờ.">
          <Input type="number" defaultValue={5} disabled />
          <NotWiredNote />
        </SettingRow>
      </SectionCard>
    </AdminPageLayout>
  )
}

export default AdminSettingsPage
