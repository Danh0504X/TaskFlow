// Class dùng chung cho các form auth (register/login/verify) để giữ giao diện đồng bộ.
// Đặt tập trung ở đây giúp chỉnh một chỗ là cả 3 trang đổi theo.

export const inputClass =
  'h-12 w-full rounded-xl border border-line/80 bg-surface/50 px-4 text-[15px] text-ink backdrop-blur-md transition placeholder:text-subtle focus:border-transparent focus:ring-2 focus:ring-brand/70'

export const labelClass = 'ml-1 block text-[13px] font-semibold text-muted'

export const errorClass = 'ml-1 mt-1.5 text-xs text-red-500'

// Nút chính: nền sáng trung tính (không dùng tím — tím trên nền tối kém tương phản), bóng mềm, hover nhấc nhẹ.
export const primaryButtonClass =
  'h-12 w-full rounded-xl text-[15px] font-semibold bg-gradient-to-br from-brand-light to-brand text-canvas border-none shadow-[0_10px_25px_-8px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(0,0,0,0.55)] active:translate-y-0 active:scale-[0.99]'

// Nút phụ (Google...): nền trắng mờ, viền nhẹ, cùng chiều cao với nút chính.
export const ghostButtonClass =
  'h-12 w-full gap-3 rounded-xl text-[15px] font-semibold text-ink border border-line/60 bg-surface/70 backdrop-blur-md transition-all duration-200 hover:bg-surface hover:shadow-sm active:scale-[0.99]'
