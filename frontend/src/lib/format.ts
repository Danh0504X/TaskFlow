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

/** Đổi chuỗi ISO/Date sang 'YYYY-MM-DD' để đổ vào <input type="date">. */
export const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
