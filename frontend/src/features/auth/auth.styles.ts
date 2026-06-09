// Class dùng chung cho các form auth (register/login/verify) để giữ giao diện đồng bộ.
// Đặt tập trung ở đây giúp chỉnh một chỗ là cả 3 trang đổi theo.

export const inputClass =
  'h-12 w-full rounded-xl border border-[#cbc3d7]/80 bg-white/50 px-4 text-[15px] text-[#0b1c30] backdrop-blur-md transition placeholder:text-[#a89db8] focus:border-transparent focus:ring-2 focus:ring-[#6b38d4]/70'

export const labelClass = 'ml-1 block text-[13px] font-semibold text-[#494454]'

export const errorClass = 'ml-1 mt-1.5 text-xs text-red-500'

// Nút chính: gradient tím, bóng mềm, hover nhấc nhẹ.
export const primaryButtonClass =
  'h-12 w-full rounded-xl text-[15px] font-semibold bg-gradient-to-br from-[#8455ef] to-[#6b38d4] text-white border-none shadow-[0_10px_25px_-8px_rgba(107,56,212,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(107,56,212,0.7)] active:translate-y-0 active:scale-[0.99]'

// Nút phụ (Google...): nền trắng mờ, viền nhẹ, cùng chiều cao với nút chính.
export const ghostButtonClass =
  'h-12 w-full gap-3 rounded-xl text-[15px] font-semibold text-[#0b1c30] border border-[#cbc3d7]/60 bg-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white hover:shadow-sm active:scale-[0.99]'
