// Beta/Demo — AI Lab. Luật máy kiểm được sau khi AI trả JSON — trả về mảng lỗi (rỗng = hợp lệ).
// aiRunner dùng mảng lỗi này để quyết định retry (gửi lại lỗi cho AI, tối đa 2 lần).

const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
// Khớp với "tối đa 20 từ" trong prompt/prompts.js — đổi cả 2 chỗ cùng lúc nếu cần nới thêm.
const MAX_TITLE_WORDS = 20

// Bỏ dấu tiếng Việt + hạ chữ thường + bỏ ký tự đặc biệt -> so khớp mờ ổn định hơn.
const normalize = (value = '') =>
  value
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')

// Levenshtein distance thuần JS (không thêm dependency).
const levenshtein = (a, b) => {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

const similarityRatio = (a, b) => {
  const na = normalize(a)
  const nb = normalize(b)
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(na, nb) / maxLen
}

const countWords = (text = '') => text.trim().split(/\s+/).filter(Boolean).length

/**
 * Kiểm 1 mẻ draft AI vừa sinh. `context.existingTitles`: tên issue hiện có trong project (chống
 * trùng); `context.domainKeys`: danh sách domainKey chuẩn (xem config/domains.js).
 */
export const validateDraftBatch = (items, generationType, context = {}) => {
  const existingTitles = context.existingTitles || []
  const domainKeys = context.domainKeys || []
  const errors = []

  if (!Array.isArray(items) || items.length === 0) {
    return ['AI không trả về issue nào']
  }

  const tempIdCounts = new Map()
  for (const item of items) {
    const key = item?.tempId
    tempIdCounts.set(key, (tempIdCounts.get(key) || 0) + 1)
  }

  for (const item of items) {
    const label = `[${item?.tempId ?? '?'}]`

    if (!item.tempId || tempIdCounts.get(item.tempId) > 1) {
      errors.push(`${label} tempId thiếu hoặc bị trùng trong mẻ`)
    }

    if (!item.title || !item.title.trim() || countWords(item.title) > MAX_TITLE_WORDS) {
      errors.push(`${label} title phải có nội dung và tối đa ${MAX_TITLE_WORDS} từ`)
    }

    if (!item.description || !item.description.trim()) {
      errors.push(`${label} description không được rỗng`)
    }

    const expectedType = generationType === 'REQ_TO_EPIC' ? 'EPIC' : 'TASK'
    if (item.type !== expectedType) {
      errors.push(`${label} type phải là ${expectedType}`)
    }

    if (!ISSUE_PRIORITIES.includes(item.priority)) {
      errors.push(`${label} priority không hợp lệ`)
    }

    if (generationType === 'REQ_TO_EPIC') {
      if (item.parentTempId) {
        errors.push(`${label} REQ_TO_EPIC không được có parentTempId`)
      }
      const scope = item.scopePreview
      if (!Array.isArray(scope) || scope.length < 3 || scope.length > 8) {
        errors.push(`${label} scopePreview phải có 3–8 dòng`)
      }
    }

    if (generationType === 'EPIC_TO_TASK' && item.parentTempId) {
      errors.push(`${label} EPIC_TO_TASK không dùng parentTempId (cha là issue thật)`)
    }

    const isCustomDomain = item.domainKey === 'custom' || (item.domainKey && !domainKeys.includes(item.domainKey))
    if (isCustomDomain && !item.sourceQuote?.trim()) {
      errors.push(`${label} miền đặc thù (domainKey="${item.domainKey}") cần sourceQuote không rỗng`)
    }

    const dupTitle = existingTitles.find((t) => similarityRatio(t, item.title || '') >= 0.8)
    if (dupTitle) {
      errors.push(`${label} trùng (hoặc gần trùng) với issue đã có: "${dupTitle}"`)
    }
  }

  // So trùng CHÉO giữa các item trong CÙNG 1 mẻ AI vừa sinh (existingTitles ở trên chỉ so với
  // issue đã có sẵn trong project, không bắt được trường hợp AI tự sinh 2 item trùng ý nhau).
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (similarityRatio(items[i]?.title || '', items[j]?.title || '') >= 0.8) {
        errors.push(
          `[${items[i]?.tempId ?? '?'}] trùng (hoặc gần trùng) với [${items[j]?.tempId ?? '?'}] trong cùng mẻ: "${items[j]?.title}"`,
        )
      }
    }
  }

  if (generationType === 'EPIC_TO_TASK' && (items.length < 3 || items.length > 8)) {
    errors.push(`EPIC_TO_TASK phải sinh 3–8 task, hiện là ${items.length}`)
  }

  const knownTempIds = new Set(items.map((i) => i.tempId))
  for (const item of items) {
    if (item.parentTempId && !knownTempIds.has(item.parentTempId)) {
      errors.push(`[${item.tempId}] parentTempId "${item.parentTempId}" không tồn tại trong mẻ`)
    }
  }

  return errors
}

/**
 * Kiểm mẻ entity AI trích ra ở Stage A của REQ_TO_EPIC (xem aiRunner.js) — trước khi dùng làm
 * nguyên liệu cho Stage B (gom epic). sourceQuote bắt buộc không rỗng cho MỌI entity (khác với
 * draft issue, ở đây luôn cần trích dẫn để ép AI bám requirement, không suy diễn/bịa thực thể).
 */
export const validateEntityBatch = (entities) => {
  if (!Array.isArray(entities) || entities.length === 0) {
    return ['AI không trích được thực thể nào từ requirement']
  }

  const errors = []
  const keyCounts = new Map()
  for (const e of entities) {
    const key = e?.key
    keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
  }

  for (const e of entities) {
    const label = `[${e?.key ?? '?'}]`

    if (!e.key || keyCounts.get(e.key) > 1) {
      errors.push(`${label} key thiếu hoặc bị trùng trong mẻ`)
    }
    if (!e.name || !e.name.trim()) {
      errors.push(`${label} name không được rỗng`)
    }
    if (!e.sourceQuote || !e.sourceQuote.trim()) {
      errors.push(`${label} sourceQuote không được rỗng (bắt buộc trích nguyên văn từ requirement)`)
    }
  }

  return errors
}

/**
 * Kiểm câu hỏi làm rõ AI sinh trước REQ_TO_EPIC. Mảng rỗng là HỢP LỆ (nghĩa là requirement đã
 * đủ rõ, AI không cần hỏi thêm) — khác các batch khác vốn coi mảng rỗng là lỗi.
 */
export const validateClarifyQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return ['AI trả về questions không hợp lệ (phải là mảng, có thể rỗng)']
  }

  const errors = []
  if (questions.length > 5) {
    errors.push(`Tối đa 5 câu hỏi, hiện là ${questions.length}`)
  }

  const keyCounts = new Map()
  for (const q of questions) {
    const key = q?.key
    keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
  }

  for (const q of questions) {
    const label = `[${q?.key ?? '?'}]`

    if (!q.key || keyCounts.get(q.key) > 1) {
      errors.push(`${label} key thiếu hoặc bị trùng`)
    }
    if (!q.question || !q.question.trim()) {
      errors.push(`${label} question không được rỗng`)
    }
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
      errors.push(`${label} options phải có 2–6 lựa chọn`)
    } else if (q.options.some((o) => !o || !o.trim())) {
      errors.push(`${label} options không được có lựa chọn rỗng`)
    }
  }

  return errors
}
