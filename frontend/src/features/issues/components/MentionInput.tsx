import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { useProject } from '@/features/projects/hooks/useProject'

interface MentionMember {
  _id: string
  fullName: string
  avatarUrl?: string | null
}

interface MentionInputProps {
  value: string
  onChange: (val: string) => void
  projectId: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  isSingleLine?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  className?: string
}

export const MentionInput = ({
  value,
  onChange,
  projectId,
  placeholder,
  rows = 2,
  disabled = false,
  isSingleLine = false,
  onKeyDown,
  className,
}: MentionInputProps) => {
  const { data: project } = useProject(projectId)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // US 2 - Rule 1 & 6: Chỉ gợi ý các thành viên đang ACTIVE trong dự án
  const members: MentionMember[] = (project?.members || [])
    .filter((m) => m.status === 'ACTIVE')
    .map((m) => {
      const user = typeof m.userId === 'object' && m.userId !== null ? m.userId : (m.user ?? null)
      return {
        _id: user?._id || (typeof m.userId === 'string' ? m.userId : ''),
        fullName: user?.fullName || 'Thành viên',
        avatarUrl: user?.avatarUrl || null,
      }
    })
    .filter((m) => !!m._id)

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(mentionQuery.toLowerCase()),
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newVal = e.target.value
    const cursor = e.target.selectionStart ?? newVal.length
    onChange(newVal)

    // Lắng nghe ký tự @ trước con trỏ
    const textBeforeCursor = newVal.slice(0, cursor)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')

    if (lastAtPos !== -1) {
      const query = textBeforeCursor.slice(lastAtPos + 1)
      if (!query.includes(' ') && query.length < 25) {
        setMentionIndex(lastAtPos)
        setMentionQuery(query)
        setShowSuggestions(true)
        setSelectedIndex(0)
        return
      }
    }

    setShowSuggestions(false)
  }

  const selectMember = (member: MentionMember) => {
    if (mentionIndex === -1) return
    const beforeAt = value.slice(0, mentionIndex)
    const afterMention = value.slice(inputRef.current?.selectionStart ?? value.length)
    const inserted = `${beforeAt}@${member.fullName} ${afterMention}`
    onChange(inserted)
    setShowSuggestions(false)
    setMentionIndex(-1)
  }

  const handleCustomKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectMember(filteredMembers[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }
    }

    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  return (
    <div className="relative flex-1 min-w-0 w-full">
      {isSingleLine ? (
        <input
          ref={inputRef as any}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleCustomKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('w-full block', className)}
        />
      ) : (
        <textarea
          ref={inputRef as any}
          value={value}
          onChange={handleChange}
          onKeyDown={handleCustomKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn('w-full block', className)}
        />
      )}

      {showSuggestions && filteredMembers.length > 0 && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-1 w-64 bg-surface border border-hairline rounded-xl shadow-xl py-1.5 z-50 max-h-48 overflow-y-auto"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-hairline mb-1">
            Gợi ý thành viên (@)
          </div>
          {filteredMembers.map((member, idx) => (
            <button
              key={member._id}
              type="button"
              onClick={() => selectMember(member)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${
                idx === selectedIndex ? 'bg-brand/10 text-brand font-bold' : 'hover:bg-canvas text-ink'
              }`}
            >
              <Avatar src={member.avatarUrl} name={member.fullName} size={22} />
              <span className="truncate">{member.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
