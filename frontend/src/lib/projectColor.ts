// Bảng màu cố định dùng làm dấu nhận diện dự án (chấm màu, ô vuông icon) ở những nơi
// gộp issue từ nhiều project cùng lúc (Dashboard, trang "Việc của tôi").
const PALETTE = ['#0e8a7f', '#e2634f', '#c98a1f', '#2f7fd1', '#c94f8c', '#5b8c3e']

/** Sinh 1 màu ổn định theo projectId — cùng 1 project luôn ra cùng 1 màu, mọi lúc mọi nơi. */
export const getProjectColor = (projectId: string): string => {
  let hash = 0
  for (let i = 0; i < projectId.length; i += 1) {
    hash = (hash << 5) - hash + projectId.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
