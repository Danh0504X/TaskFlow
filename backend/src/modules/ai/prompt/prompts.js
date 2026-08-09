import { AI_DOMAINS } from '../config/domains.js'

// Beta/Demo — AI Lab. Prompt viết cứng trong code (không lưu DB) — 1 phần nền chung
// (vai trò, quy tắc độ hạt, quy tắc BÁM DỰ ÁN, few-shot khác miền) + 2 biến thể.
//
// THAY ĐỔI CỐT LÕI:
//  1. Checklist miền: từ "máy sinh epic" -> "bộ soát sót CUỐI CÙNG". Rút epic từ nội dung THẬT
//     của requirement trước, rồi mới dùng checklist kiểm mảng bị bỏ sót.
//  2. Thêm BƯỚC TIẾP ĐẤT: bắt model liệt kê thực thể/tính năng cụ thể trong req trước khi gom epic.
//  3. Few-shot đổi sang ví dụ KHÁC MIỀN (phòng khám) để dạy PHONG CÁCH & độ hạt, không rò rỉ
//     nội dung TaskFlow vào output.
//  4. Ép title & scopePreview nhắc THỰC THỂ CỤ THỂ lấy từ requirement.
//  5. Giới hạn title: 20 từ (trước là 12).

const domainChecklistText = () =>
  AI_DOMAINS.map((d) => `- ${d.key} (${d.label}): ${d.hint}`).join('\n')

const basePrompt = () => `
Bạn là trợ lý phân rã yêu cầu phần mềm cho TaskFlow — công cụ quản lý dự án kiểu Jira
(Epic > Task, board Kanban/Scrum). Nhiệm vụ: ĐỌC KỸ requirement/epic được cung cấp và đề xuất
các issue (Epic hoặc Task) BÁM SÁT nghiệp vụ trong đề bài, dưới dạng JSON đúng schema đã cho —
KHÔNG trả văn xuôi tự do, KHÔNG markdown.

NGUYÊN TẮC QUAN TRỌNG NHẤT — BÁM DỰ ÁN:
- Epic/Task phải bắt nguồn từ NỘI DUNG CỤ THỂ của requirement và đặt tên theo NGHIỆP VỤ của
  dự án đó. TUYỆT ĐỐI KHÔNG đặt tên epic theo tên miền chung (không đặt "Xác thực", "Phân quyền",
  "Thông báo", "Báo cáo" trơ trọi).
- Nếu requirement nói về "khóa học", "đơn hàng", "bệnh nhân", "hợp đồng"... thì epic phải nhắc
  đúng những thực thể đó. Người đọc phải đoán được đây là dự án gì chỉ qua danh sách epic.

QUY TẮC ĐỘ HẠT (bắt buộc):
- title là "động từ + đối tượng NGHIỆP VỤ cụ thể", tối đa 20 từ.
- Epic nên đủ lớn để bóc thành 3–8 task; nếu một mục to như cả tầng kiến trúc ("Backend") thì
  chia theo nghiệp vụ; nếu vụn như "Thêm nút Lưu" thì gộp thành việc có ý nghĩa nghiệp vụ.

QUY TẮC MIỀN (domainKey) — miền là NHÃN PHÂN LOẠI, KHÔNG phải nguồn sinh:
- Sau khi đã đặt tên epic theo nghiệp vụ, gán "domainKey" khớp 1 mục trong checklist bên dưới.
- Việc đặc thù không thuộc miền chuẩn nào: domainKey = "custom" và BẮT BUỘC trích 1 câu/cụm từ
  gốc trong requirement vào "sourceQuote" — không suy diễn, không bịa nhu cầu ngoài đề bài.

VÍ DỤ (few-shot — DỰ ÁN KHÁC MIỀN, chỉ để học PHONG CÁCH & độ hạt, KHÔNG sao chép nội dung):
Giả sử requirement là "phần mềm đặt lịch khám cho phòng khám tư":
  TỐT (bám thực thể trong đề: lịch khám, bệnh nhân, bác sĩ):
    - Epic "Đặt và quản lý lịch khám bệnh nhân" (domainKey: core_crud)
    - Epic "Quản lý hồ sơ bệnh nhân và lịch sử khám" (domainKey: core_crud)
    - Epic "Nhắc lịch hẹn qua email/SMS cho bệnh nhân" (domainKey: notify)
  XẤU (chung chung, đọc không biết là dự án gì — KHÔNG được làm vậy):
    - "Xác thực người dùng" · "Thông báo" · "Quản lý dữ liệu" · "Báo cáo thống kê"

VÍ DỤ PHẢN DIỆN (không được làm):
- "Backend" / "Frontend" (cả một tầng kiến trúc, không phải 1 việc).
- "Thêm nút Lưu ở form" (quá vụn).
- "Cải thiện hiệu năng" (mơ hồ, không đo được).
- Epic đặt tên bằng ĐÚNG tên miền ("Thông báo", "Phân quyền") mà không gắn thực thể của dự án.

CHECKLIST MIỀN (dùng ở BƯỚC SOÁT SÓT CUỐI, KHÔNG phải để sinh 1 epic cho mỗi miền —
miền nào requirement KHÔNG chạm tới thì BỎ QUA):
${domainChecklistText()}

Chỉ trả JSON đúng schema, không thêm field ngoài schema, không thêm giải thích.
`.trim()

const formatExisting = (titles = []) =>
  titles.length > 0 ? titles.map((t) => `- ${t}`).join('\n') : '(chưa có)'

const formatErrors = (errors = []) => {
  if (!errors.length) return ''
  return `\n\nLƯU Ý: Lượt sinh trước bị từ chối vì các lỗi sau — hãy sửa đúng các lỗi này ở lượt này:\n${errors
    .map((e) => `- ${e}`)
    .join('\n')}`
}

const formatEntities = (entities = []) =>
  entities.length > 0
    ? entities.map((e) => `- ${e.name}: ${e.description} (trích: "${e.sourceQuote}")`).join('\n')
    : '(không có)'

// Stage A của REQ_TO_EPIC — trích thực thể/tính năng TRƯỚC khi gom epic (gọi AI riêng, xem
// aiRunner.js runEntityExtractionStage). Tách khỏi buildReqToEpicUserPrompt để bước "tiếp đất"
// có kết quả XUẤT RA thật (kiểm/lưu/hiển thị được), không còn là chỉ dẫn "nghĩ thầm" ẩn trong
// 1 lệnh gọi gộp chung với bước gom epic.
const buildEntityExtractionUserPrompt = (context) => {
  const { inputPrompt, clarifications } = context

  return `
NHIỆM VỤ: TRÍCH THỰC THỂ — đọc requirement, liệt kê các THỰC THỂ và TÍNH NĂNG nghiệp vụ cụ thể
được nhắc tới, làm nguyên liệu cho bước gom Epic ở lệnh gọi SAU (bước này KHÔNG sinh Epic).

REQUIREMENT CỦA PM:
"""
${inputPrompt}
"""

CÂU TRẢ LỜI LÀM RÕ CỦA PM (object câu hỏi đóng — có thể rỗng):
${clarifications ? JSON.stringify(clarifications) : '(không có)'}

CÁCH LÀM:
- Đọc kỹ requirement (và câu trả lời làm rõ nếu có), liệt kê từng THỰC THỂ/TÍNH NĂNG nghiệp vụ
  cụ thể (danh từ nghiệp vụ: ví dụ "khóa học", "bài giảng", "quiz", "thanh toán", "chứng chỉ",
  "doanh thu giảng viên"...).
- MỖI thực thể BẮT BUỘC kèm "sourceQuote" — trích NGUYÊN VĂN câu/cụm từ trong requirement chứng
  minh thực thể đó có thật trong đề. KHÔNG suy diễn, KHÔNG bịa thực thể không có trong đề.
- KHÔNG gom nhóm thành epic ở bước này — chỉ liệt kê thực thể/tính năng rời rạc, càng đầy đủ
  càng tốt, bước sau sẽ tự gom.

YÊU CẦU OUTPUT:
- Mỗi thực thể: "key" duy nhất (vd "EN1","EN2"...), "name" ngắn gọn, "description" giải thích
  1 câu, "sourceQuote" trích nguyên văn không rỗng.
- Nếu requirement quá ngắn/mơ hồ: chỉ liệt kê những gì THỰC SỰ có trong đề, không bịa thêm.`.trim()
}

export const buildEntityExtractionPrompt = (context, previousErrors = []) => ({
  system: basePrompt(),
  user: buildEntityExtractionUserPrompt(context) + formatErrors(previousErrors),
})

const buildReqToEpicUserPrompt = (context, previousErrors) => {
  const { inputPrompt, clarifications, existingTitles, entities } = context

  return `
NHIỆM VỤ: REQ_TO_EPIC — từ danh sách thực thể/tính năng đã trích ở bước trước, đề xuất các EPIC
bám sát nghiệp vụ của dự án.

REQUIREMENT GỐC CỦA PM (tham khảo ngữ cảnh/giọng văn — thực thể đã được trích sẵn ở dưới, KHÔNG
cần tự đọc lại requirement để tìm thực thể nữa):
"""
${inputPrompt}
"""

CÂU TRẢ LỜI LÀM RÕ CỦA PM (object câu hỏi đóng — có thể rỗng):
${clarifications ? JSON.stringify(clarifications) : '(không có)'}

THỰC THỂ/TÍNH NĂNG ĐÃ TRÍCH TỪ REQUIREMENT (nguyên liệu chính để gom epic — DÙNG NGUYÊN danh
sách này, không tự trích thêm thực thể khác ngoài danh sách):
${formatEntities(entities)}

EPIC ĐÃ CÓ SẴN (KHÔNG đề xuất trùng hoặc gần trùng ý nghĩa):
${formatExisting(existingTitles)}

CÁCH LÀM — theo đúng 2 bước, chỉ XUẤT RA kết quả bước 2:
1) GOM THÀNH EPIC: nhóm các thực thể/tính năng ở trên thành epic, ĐẶT TÊN THEO NGHIỆP VỤ đó
   (nhắc đúng thực thể). Số lượng epic tùy độ lớn của danh sách thực thể — danh sách ngắn thì ít
   epic nhưng phải sát, KHÔNG độn thêm epic chung chung cho đủ số.
2) SOÁT SÓT bằng checklist miền: kiểm xem danh sách thực thể có NGỤ Ý mảng nào (đăng nhập? phân
   quyền? thông báo?) mà bước 1 bỏ sót không. CHỈ thêm epic cho mảng thật sự ngụ ý; mảng không
   liên quan thì bỏ. Epic thêm ở bước này vẫn phải gắn thực thể của dự án, không đặt tên trần.

YÊU CẦU OUTPUT:
- Mỗi epic: type="EPIC", parentTempId=null, tempId duy nhất (vd "E1","E2"...), domainKey hợp lệ.
- title nhắc THỰC THỂ CỤ THỂ của dự án (không phải tên miền trơ trọi).
- scopePreview: 3–8 dòng, MỖI dòng nhắc một thực thể/tính năng cụ thể lấy từ danh sách thực thể
  ở trên (không viết chung chung kiểu "tạo, sửa, xoá dữ liệu").
- Nếu danh sách thực thể quá ít/mơ hồ: KHÔNG bịa nhu cầu. Sinh ít epic bám đúng thực thể đã có,
  và với mỗi epic ghi ở đầu description một dòng "Giả định:" nêu rõ giả định tối thiểu bạn đã dùng.
${formatErrors(previousErrors)}`.trim()
}

// AI hỏi làm rõ TRƯỚC khi PM tạo lượt REQ_TO_EPIC thật (xem clarifyRequirement trong
// aiGeneration.service.js) — chỉ hỏi khi requirement thật sự thiếu dữ kiện trọng yếu.
const buildClarifyUserPrompt = (inputPrompt) => `
NHIỆM VỤ: HỎI LÀM RÕ — đọc requirement, CHỈ hỏi khi thật sự thiếu thông tin trọng yếu để thiết
kế Epic sau này (quy mô người dùng, ràng buộc nghiệp vụ, phạm vi, vai trò...). KHÔNG hỏi cho có,
KHÔNG hỏi thứ đã rõ trong đề.

REQUIREMENT CỦA PM:
"""
${inputPrompt}
"""

YÊU CẦU OUTPUT:
- Tối đa 5 câu hỏi, mỗi câu dạng ĐÓNG (trắc nghiệm) với 2–6 lựa chọn "options" cụ thể — PM chỉ
  cần bấm chọn, KHÔNG hỏi dạng tự luận.
- Nếu requirement đã đủ rõ để thiết kế Epic mà không cần hỏi thêm -> trả "questions": [] (mảng
  rỗng), KHÔNG cố hỏi cho đủ số.
- Mỗi câu: "key" duy nhất (vd "Q1","Q2"...), "question" ngắn gọn, "options" là các lựa chọn cụ
  thể (không để PM tự gõ).`.trim()

export const buildClarifyPrompt = (inputPrompt, previousErrors = []) => ({
  system: basePrompt(),
  user: buildClarifyUserPrompt(inputPrompt) + formatErrors(previousErrors),
})

const buildEpicToTaskUserPrompt = (context, previousErrors) => {
  const { sourceEpic, existingTitles } = context

  return `
NHIỆM VỤ: EPIC_TO_TASK — bóc nhỏ epic dưới đây thành các TASK bám sát nội dung epic.

EPIC NGUỒN:
- Tiêu đề: "${sourceEpic.title}"
- Mô tả: "${sourceEpic.description || '(không có mô tả)'}"

TASK ĐANG CÓ SẴN TRONG EPIC (KHÔNG đề xuất trùng hoặc gần trùng):
${formatExisting(existingTitles)}

CÁCH LÀM:
- Đọc tiêu đề + mô tả epic, xác định THỰC THỂ và HÀNH ĐỘNG cụ thể epic này nói tới.
- Sinh task cho epic ĐÓ — mỗi task phải nhắc đúng đối tượng của epic, KHÔNG viết task chung chung
  áp cho epic nào cũng đúng.

YÊU CẦU OUTPUT:
- 3–8 task PHẲNG (1 tầng), mỗi task: type="TASK", parentTempId=null (hệ thống tự gán cha sau
  khi PM chấp nhận).
- Phủ đủ các mặt KHI CÓ Ý NGHĨA với epic: luồng chính, kiểm tra/validate dữ liệu, xử lý lỗi &
  trường hợp biên, phân quyền, và test — nhưng mỗi mặt phải VIẾT CỤ THỂ cho epic này
  (không viết "Validate dữ liệu" trơ trọi mà "Kiểm tra hợp lệ thông tin thanh toán khi mua khóa học").
- Chỉ sinh task thực sự cần cho epic; không độn task thừa cho đủ số.
${formatErrors(previousErrors)}`.trim()
}

export const buildPrompt = (generationType, context, previousErrors = []) => ({
  system: basePrompt(),
  user:
    generationType === 'REQ_TO_EPIC'
      ? buildReqToEpicUserPrompt(context, previousErrors)
      : buildEpicToTaskUserPrompt(context, previousErrors),
})
