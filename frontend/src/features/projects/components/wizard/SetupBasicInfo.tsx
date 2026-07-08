import type { ChangeEvent } from 'react'

export interface BasicInfoData {
  name: string
  key: string
  description: string
}

interface SetupBasicInfoProps {
  data: BasicInfoData
  onChange: (data: BasicInfoData) => void
}

/** Tự sinh Key viết tắt từ tên dự án (chữ cái đầu mỗi từ, tối đa 5 ký tự). */
const deriveKey = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 5)

const SetupBasicInfo = ({ data, onChange }: SetupBasicInfoProps) => {
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    onChange({ ...data, name, key: data.key || deriveKey(name) })
  }

  const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, key: e.target.value.toUpperCase().slice(0, 5) })
  }

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, description: e.target.value })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-left">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Thông tin dự án</h2>
        <p className="text-muted mt-2 text-xs font-semibold">Cung cấp thông tin cơ bản để khởi tạo không gian làm việc.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Tên dự án <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={handleNameChange}
            placeholder="Ví dụ: Website Revamp Q3, TaskFlow Core Engine..."
            className="w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Mã khoá dự án (Key) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.key}
            onChange={handleKeyChange}
            placeholder="Ví dụ: WEB, TFC, OPS (tối đa 5 ký tự)"
            className="w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
          />
          <p className="text-[10px] text-muted font-semibold">Dùng làm tiền tố đánh số công việc (vd: WEB-1, WEB-2...).</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider">Mô tả chi tiết</label>
          <textarea
            value={data.description}
            onChange={handleDescriptionChange}
            rows={4}
            placeholder="Tóm tắt mục tiêu dự án, phạm vi công việc và kết quả đầu ra mong đợi..."
            className="w-full bg-slate-50 border border-line/20 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle resize-none"
          />
        </div>
      </div>
    </div>
  )
}

export default SetupBasicInfo
