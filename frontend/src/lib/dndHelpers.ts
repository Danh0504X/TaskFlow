import type { Issue } from '@/features/issues/issue.types'

/**
 * Tính toán orderIndex mới dựa trên vị trí chèn vào danh sách đích.
 * @param sortedDestinationItems Danh sách các issue trong container đích (đã sắp xếp theo orderIndex tăng dần)
 * @param targetIndex Vị trí index (0-based) muốn chèn issue vào
 * @returns orderIndex mới (kiểu số)
 */
export const calculateNewOrderIndex = (
  sortedDestinationItems: Issue[],
  targetIndex: number
): number => {
  const length = sortedDestinationItems.length

  // Trường hợp 1: Thả vào danh sách trống
  if (length === 0) {
    return 1000
  }

  // Trường hợp 2: Thả vào đầu danh sách (index = 0)
  if (targetIndex <= 0) {
    const firstItem = sortedDestinationItems[0]
    return (firstItem.orderIndex ?? 0) - 1000
  }

  // Trường hợp 3: Thả vào cuối danh sách (index >= length)
  if (targetIndex >= length) {
    const lastItem = sortedDestinationItems[length - 1]
    return (lastItem.orderIndex ?? 0) + 1000
  }

  // Trường hợp 4: Thả vào giữa hai phần tử
  const prevItem = sortedDestinationItems[targetIndex - 1]
  const nextItem = sortedDestinationItems[targetIndex]
  const prevOrder = prevItem.orderIndex ?? 0
  const nextOrder = nextItem.orderIndex ?? 0

  return (prevOrder + nextOrder) / 2
}
