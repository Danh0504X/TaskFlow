// Class dùng chung cho các form auth (register/login/verify) để giữ giao diện đồng bộ.
// Đặt tập trung ở đây giúp chỉnh một chỗ là cả 3 trang đổi theo.
// Theo tinh thần minimalist-ui: phẳng, viền mảnh (hairline), không blur/gradient/shadow nặng.

export const inputClass =
  'h-12 w-full rounded-lg border border-hairline bg-surface px-4 text-[15px] text-ink transition-colors placeholder:text-subtle outline-none focus:border-ink/25 focus:ring-2 focus:ring-brand/20'

export const labelClass = 'ml-1 block text-xs font-semibold text-ink uppercase tracking-wider'

export const errorClass = 'ml-1 mt-1.5 text-xs font-medium text-pastel-red-ink'

// Nút chính: phẳng, đồng bộ với Button.tsx dùng chung toàn app (nền sáng trung tính, chữ tối).
export const primaryButtonClass =
  'h-12 w-full rounded-lg text-[15px] font-semibold bg-ink text-canvas border-none transition-colors duration-200 hover:bg-[#e4e4e5] active:scale-[0.99]'

// Nút phụ (Google...): viền mảnh, nền surface, cùng chiều cao với nút chính.
export const ghostButtonClass =
  'h-12 w-full gap-3 rounded-lg text-[15px] font-semibold text-ink border border-hairline bg-surface transition-colors duration-200 hover:border-ink/25 active:scale-[0.99]'
