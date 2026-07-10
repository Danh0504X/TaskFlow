import { useState } from 'react'
import type { Issue } from '../issue.types'

/** Lọc issue theo từ khoá (khớp tiêu đề hoặc mã việc) — dùng chung cho Board/List/Backlog. */
export const useIssueSearch = (issues: Issue[] | undefined) => {
  const [query, setQuery] = useState('')

  const normalized = query.trim().toLowerCase()
  const filtered = (issues ?? []).filter(
    (issue) =>
      issue.title.toLowerCase().includes(normalized) ||
      issue.key.toLowerCase().includes(normalized),
  )

  return { query, setQuery, filtered }
}
