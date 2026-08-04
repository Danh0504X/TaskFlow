import { AI_DOMAINS } from '../config/domains.js'

// Beta/Demo — AI Lab. Provider tất định (không gọi mạng) — dùng khi thiếu API key hoặc
// AI_PROVIDER=stub, để demo luôn chạy được. Trả cùng SHAPE với provider AI thật
// (xem provider/aiProvider.js) nên phần còn lại của hệ thống không phân biệt được nguồn.

const truncateWords = (text, maxWords) => {
  const words = text.trim().split(/\s+/)
  return words.length <= maxWords ? text.trim() : words.slice(0, maxWords).join(' ')
}

const buildScopePreview = (hint) => {
  const parts = hint
    .split(/,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))

  const fallback = ['Xử lý lỗi & thông báo cho người dùng', 'Kiểm tra quyền truy cập', 'Ghi log thao tác']
  const lines = [...parts]
  let i = 0
  while (lines.length < 3 && i < fallback.length) {
    lines.push(fallback[i])
    i += 1
  }
  return lines.slice(0, 6)
}

// Nội dung requirement chứa từ khoá nào trong hint của miền -> coi như miền đó khớp.
const matchDomain = (text, domain) => {
  const keywords = domain.hint.split(/,|;/).map((k) => k.trim().toLowerCase())
  return keywords.some((k) => k && text.includes(k))
}

/** REQ_TO_EPIC: mỗi miền khớp từ khoá (hoặc luôn có auth + core_crud) sinh 1 epic. */
export const stubGenerateReqToEpic = ({ inputPrompt = '' }) => {
  const text = inputPrompt.toLowerCase()
  const matched = AI_DOMAINS.filter((d) => matchDomain(text, d))

  const forcedKeys = ['auth', 'core_crud']
  const byKey = new Map()
  for (const key of forcedKeys) {
    const domain = AI_DOMAINS.find((d) => d.key === key)
    if (domain) byKey.set(domain.key, domain)
  }
  for (const domain of matched) byKey.set(domain.key, domain)

  const domains = Array.from(byKey.values())

  return domains.map((domain, idx) => ({
    tempId: `E${idx + 1}`,
    title: truncateWords(`Xây dựng ${domain.label.toLowerCase()}`, 12),
    description: `Đáp ứng yêu cầu về ${domain.label.toLowerCase()}: ${domain.hint}.`,
    type: 'EPIC',
    priority: idx === 0 ? 'HIGH' : 'MEDIUM',
    parentTempId: null,
    scopePreview: buildScopePreview(domain.hint),
    sourceQuote: '',
    domainKey: domain.key,
  }))
}

const TASK_FACETS = [
  { title: 'Triển khai luồng chính', domainKey: 'core_crud', priority: 'HIGH' },
  { title: 'Kiểm tra dữ liệu đầu vào', domainKey: 'core_crud', priority: 'MEDIUM' },
  { title: 'Xử lý lỗi và trường hợp biên', domainKey: 'core_crud', priority: 'MEDIUM' },
  { title: 'Kiểm soát phân quyền truy cập', domainKey: 'rbac', priority: 'MEDIUM' },
  { title: 'Viết test', domainKey: 'testing', priority: 'LOW' },
]

/** EPIC_TO_TASK: sinh 5 task theo các mặt cố định (happy path/validate/lỗi/quyền/test) của epic. */
export const stubGenerateEpicToTask = ({ sourceEpic }) => {
  const shortTitle = truncateWords(sourceEpic?.title || 'tính năng', 3)

  return TASK_FACETS.map((facet, idx) => ({
    tempId: `T${idx + 1}`,
    title: truncateWords(`${facet.title} — ${shortTitle}`, 12),
    description: `${facet.title} thuộc epic "${sourceEpic?.title || ''}".`,
    type: 'TASK',
    priority: facet.priority,
    parentTempId: null,
    scopePreview: [],
    sourceQuote: '',
    domainKey: facet.domainKey,
  }))
}
