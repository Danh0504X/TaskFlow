import type { ChangeEvent } from 'react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

export interface BasicInfoData {
  name: string
  key: string
  description: string
}

interface SetupBasicInfoProps {
  data: BasicInfoData
  onChange: (data: BasicInfoData) => void
}

/** Bỏ dấu tiếng Việt để lấy chữ cái ASCII chuẩn */
export const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
}

/** Tự sinh Key từ tên dự án (lấy 2 chữ cái đầu tiên của 2 chữ đầu trên tên dự án). */
export const deriveKey = (name: string): string => {
  const cleanName = removeVietnameseTones(name.trim()).replace(/[^a-zA-Z0-9\s]/g, '')
  if (!cleanName) return ''

  const words = cleanName.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return words[0].slice(0, 2).toUpperCase()
}

/** Chuẩn hoá key: chỉ giữ chữ/số viết hoa — khớp quy tắc backend (projectService.js). */
export const normalizeProjectKey = (key: string): string =>
  key.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Key rỗng thì hợp lệ (backend tự sinh từ tên); có nhập thì phải còn ≥ 2 ký tự chữ/số. */
export const isProjectKeyValid = (key: string): boolean =>
  key.trim() === '' || normalizeProjectKey(key).length >= 2

const SetupBasicInfo = ({ data, onChange }: SetupBasicInfoProps) => {
  const [isKeyCustom, setIsKeyCustom] = useState<boolean>(() => {
    if (!data.key.trim()) return false
    return data.key !== deriveKey(data.name)
  })

  const dataRef = useRef(data)
  dataRef.current = data

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Tự động gợi ý Key sau khi người dùng dừng nhập tên (debounce 500ms)
  useEffect(() => {
    if (isKeyCustom) return

    const timer = setTimeout(() => {
      const currentName = dataRef.current.name
      if (currentName.trim()) {
        const suggestedKey = deriveKey(currentName)
        if (suggestedKey && suggestedKey !== dataRef.current.key) {
          onChangeRef.current({ ...dataRef.current, key: suggestedKey })
        }
      } else if (dataRef.current.key) {
        onChangeRef.current({ ...dataRef.current, key: '' })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [data.name, isKeyCustom])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    onChange({ ...data, name })
  }

  const handleNameBlur = () => {
    if (!isKeyCustom && data.name.trim()) {
      const suggestedKey = deriveKey(data.name)
      if (suggestedKey && suggestedKey !== data.key) {
        onChange({ ...data, key: suggestedKey })
      }
    }
  }

  const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value.toUpperCase().slice(0, 5)
    if (newKey === '') {
      setIsKeyCustom(false)
    } else {
      setIsKeyCustom(true)
    }
    onChange({ ...data, key: newKey })
  }

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, description: e.target.value })
  }

  const showKeyError = data.key.trim() !== '' && !isProjectKeyValid(data.key)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 max-w-xl mx-auto text-left">
      <motion.div variants={fadeUpItem} className="text-center mb-8">
        <h2 className="font-editorial text-2xl font-medium text-ink tracking-tight">Thông tin dự án</h2>
        <p className="text-muted mt-2 text-xs">Cung cấp thông tin cơ bản để khởi tạo không gian làm việc.</p>
      </motion.div>

      <div className="space-y-4">
        <motion.div variants={fadeUpItem} className="space-y-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">
            Tên dự án <span className="text-pastel-red-ink">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder="Ví dụ: Website Revamp Q3, TaskFlow Core Engine..."
            className="w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle"
          />
        </motion.div>

        <motion.div variants={fadeUpItem} className="space-y-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">
            Mã khoá dự án (Key) <span className="text-pastel-red-ink">*</span>
          </label>
          <input
            type="text"
            value={data.key}
            onChange={handleKeyChange}
            placeholder="Ví dụ: WEB, TFC, OPS (tối đa 5 ký tự)"
            aria-invalid={showKeyError}
            className={`w-full bg-surface border rounded-lg px-4 py-3 text-xs font-medium outline-none transition-all placeholder:text-subtle ${
              showKeyError
                ? 'border-red-300 focus:ring-2 focus:ring-red-300/40'
                : 'border-hairline focus:ring-2 focus:ring-brand/15 focus:border-ink/20'
            }`}
          />
          {showKeyError ? (
            <p className="text-[10px] text-pastel-red-ink font-medium">
              Mã khoá phải còn ít nhất 2 ký tự chữ/số sau khi bỏ ký tự đặc biệt.
            </p>
          ) : (
            <p className="text-[10px] text-subtle">Dùng làm tiền tố đánh số công việc (vd: WEB-1, WEB-2...).</p>
          )}
        </motion.div>

        <motion.div variants={fadeUpItem} className="space-y-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">Mô tả chi tiết</label>
          <textarea
            value={data.description}
            onChange={handleDescriptionChange}
            rows={4}
            placeholder="Tóm tắt mục tiêu dự án, phạm vi công việc và kết quả đầu ra mong đợi..."
            className="w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle resize-none"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SetupBasicInfo
