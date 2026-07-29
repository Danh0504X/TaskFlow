/**
 * Motion variants dùng chung cho hiệu ứng "xuất hiện" của danh sách/lưới (stat card,
 * task row, project row...) — theo tinh thần minimalist-ui: chỉ animate transform/opacity,
 * dịch chuyển nhẹ (12px), cascade delay giữa các item thay vì bung cùng lúc.
 * Dùng: <motion.div variants={staggerContainer} initial="hidden" animate="show"> bọc ngoài,
 * mỗi item con là <motion.div variants={fadeUpItem}>.
 */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

/** Easing "quiet sophistication" dùng cho mọi transition tuỳ chỉnh (fade-up, crossfade, collapse...). */
export const easeOut = [0.16, 1, 0.3, 1] as const

export const fadeUpItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}
