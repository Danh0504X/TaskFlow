import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDropdownPositionOptions {
  /** Chiều rộng dropdown (px) — dùng để tránh tràn phải màn hình. */
  width: number
  /** Chiều cao ước lượng (px) — dùng để quyết định mở lên hay xuống. */
  estimatedHeight?: number
  onOpenChange?: (open: boolean) => void
}

/**
 * Dùng chung cho mọi dropdown dạng "portal ra document.body, định vị theo toạ độ thật của
 * nút bấm" (AssigneePicker, PriorityPicker, StatusPicker...) — tránh lặp lại 3 lần cùng 1
 * logic portal + tính toạ độ + đóng khi click ra ngoài.
 */
export const useDropdownPosition = ({ width, estimatedHeight = 260, onOpenChange }: UseDropdownPositionOptions) => {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Luôn đi qua đây để đóng/mở -> component cha luôn được báo đúng lúc (cần thiết vì dropdown
  // ở portal nên các cách kiểm tra dựa trên DOM containment như blur/relatedTarget không
  // nhận diện đúng lúc đang tương tác với nó).
  const updateOpen = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  const openDropdown = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight
      setCoords({
        top: openUpward ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - width - 8),
      })
    }
    updateOpen(true)
  }, [estimatedHeight, width, updateOpen])

  const toggle = useCallback(() => {
    if (open) updateOpen(false)
    else openDropdown()
  }, [open, openDropdown, updateOpen])

  const close = useCallback(() => updateOpen(false), [updateOpen])

  useEffect(() => {
    if (!open) return
    // Dropdown ở portal (không phải con DOM của trigger) -> phải check cả 2 ref riêng.
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        updateOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, updateOpen])

  return { open, coords, triggerRef, dropdownRef, toggle, close }
}