/** Định dạng ngày kiểu Việt Nam (dd/MM/yyyy). Trả '—' nếu rỗng/không hợp lệ. */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Tách ngày ISO thành { day: '24', month: 'TH07' } cho các badge lịch dạng ô vuông. */
export const formatDayMonth = (value: string | null | undefined): { day: string; month: string } => {
  if (!value) return { day: '—', month: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '—', month: '' }
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: `TH${String(date.getMonth() + 1).padStart(2, '0')}`,
  }
}

/** Thời gian tương đối kiểu "5 phút trước" — quá 7 ngày thì trả về ngày cụ thể (formatDate). */
export const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Vừa xong'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} phút trước`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} ngày trước`

  return formatDate(value)
}

/** Số ngày còn lại tới 1 mốc thời gian, tính theo ngày lịch (âm nếu đã qua). */
export const daysUntil = (value: string | null | undefined): number | null => {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - startOfToday.getTime()) / 86400000)
}

/** Đổi chuỗi ISO/Date sang 'YYYY-MM-DD' để đổ vào <input type="date">. */
export const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
