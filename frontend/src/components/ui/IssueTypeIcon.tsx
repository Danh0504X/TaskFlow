import { Zap, FileText, Subtitles, Bug } from 'lucide-react'
import type { IssueType } from '@/features/issues/issue.types'

interface IssueTypeIconProps {
  type: IssueType
  size?: number
  className?: string
}

const IssueTypeIcon = ({ type, size = 16, className = '' }: IssueTypeIconProps) => {
  switch (type) {
    case 'EPIC':
      return <Zap className={`text-brand fill-brand ${className}`} size={size} />
    case 'SUBTASK':
      return <Subtitles className={`text-cyan-500 ${className}`} size={size} />
    case 'BUG':
      return <Bug className={`text-red-500 ${className}`} size={size} />
    case 'TASK':
    default:
      return <FileText className={`text-blue-500 ${className}`} size={size} />
  }
}

export default IssueTypeIcon
