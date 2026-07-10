import Badge from '@/components/ui/Badge'
import { PROJECT_STATUS, type ProjectStatus } from '../project.types'

// Map status -> màu badge + nhãn tiếng Việt.
const statusConfig: Record<
  ProjectStatus,
  { color: 'green' | 'blue' | 'red'; label: string }
> = {
  [PROJECT_STATUS.ACTIVE]: { color: 'green', label: 'Đang hoạt động' },
  [PROJECT_STATUS.COMPLETED]: { color: 'blue', label: 'Hoàn thành' },
  [PROJECT_STATUS.CANCELLED]: { color: 'red', label: 'Đã huỷ' },
}

const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => {
  // Dữ liệu cũ có thể thiếu/không khớp enum -> fallback ACTIVE thay vì crash cả trang.
  const config = statusConfig[status] ?? statusConfig[PROJECT_STATUS.ACTIVE]
  return <Badge color={config.color}>{config.label}</Badge>
}

export default ProjectStatusBadge
