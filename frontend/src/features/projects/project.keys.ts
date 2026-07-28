// Query key factory cho React Query.
// Gom tất cả key của domain project về 1 chỗ -> tránh gõ sai chuỗi rải rác,
// và dễ invalidate theo nhóm (vd huỷ cache toàn bộ list khi tạo/sửa/xoá).
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  invitations: () => [...projectKeys.all, 'invitations'] as const,
}
