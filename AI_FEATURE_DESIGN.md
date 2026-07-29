# 🤖 Tính năng AI sinh Issue — Thiết kế & Cách hoạt động

> Tài liệu trình bày cho nhóm: AI làm gì, cần những bảng nào, và thực thi theo luồng nào.
> Hệ thống: TaskFlow (MongoDB + Mongoose). Provider AI: **API bên thứ 3, 1 key chung cấp hệ thống**.

---

## 1. Tổng quan — AI làm gì?

Tính năng cho phép **Project Manager (PM)** biến một **yêu cầu (requirement)** thành các **issue có cấu trúc** trong dự án, theo 3 cấp phân rã:

```
Yêu cầu (req)  ──AI──►  EPIC  ──AI──►  TASK  ──AI──►  SUBTASK
   (đầu vào)          (mức cao)      (phân rã)     (chi tiết, khi cần)
```

Nguyên tắc cốt lõi:
- Sinh từ **đơn giản → nâng cao**, ưu tiên việc **cần thiết trước**.
- **Không trùng lặp** với các epic/task đã có trong dự án (đưa danh sách hiện có vào cho AI để né trùng).
- AI chỉ **đề xuất** — PM **duyệt** rồi mới tạo issue thật.

---

## 2. AI có 3 điểm thực thi (3 prompt khác nhau)

| Cấp | Đầu vào | Đầu ra | Kiểm tra trùng với |
|---|---|---|---|
| **Req → Epic** | Tài liệu yêu cầu | Danh sách epic | Các epic đã có trong dự án |
| **Epic → Task** | 1 epic | Task phân rã epic đó | Task đang có trong epic đó |
| **Task → Subtask** | 1 task (khi PM yêu cầu) | Subtask của task đó | Subtask đang có trong task đó |

Tổ chức prompt: **1 phần nền chung** (vai trò AI + định dạng JSON đầu ra + quy tắc ưu tiên/chống trùng) + **3 biến thể** cho 3 cấp. Prompt lưu **trong code**, không lưu DB.

---

## 3. Các bảng (collection) cần thiết

### 3.1. `ai_generations` — Nhật ký mỗi lần sinh (xương sống)

Ghi lại mỗi lần PM bấm "sinh": đầu vào, cấp nào, trạng thái xử lý, kết quả.

| Field | Kiểu | Mục đích |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `projectId` | ObjectId → project | Sinh cho dự án nào (index) |
| `requestedBy` | ObjectId → user | PM nào bấm sinh |
| `generationType` | enum `REQ_TO_EPIC` / `EPIC_TO_TASK` / `TASK_TO_SUBTASK` | Dùng prompt cấp nào |
| `sourceEntityId` | ObjectId → issue | Epic/Task nguồn để phân rã (null nếu là cấp Req→Epic) |
| `inputPrompt` | String | Yêu cầu/chỉ thị PM nhập vào |
| `status` | enum `PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` | Trạng thái xử lý nền |
| `provider` / `model` | String | Provider & model đã dùng |
| `rawOutput` | Mixed | Kết quả thô AI trả về (để debug / sinh lại) |
| `tokensUsed` | Number | Theo dõi chi phí token |
| `errorMessage` | String | Lý do nếu FAILED |
| `createdAt` / `updatedAt` | Date | timestamps |

**Vì sao cần:** AI chạy chậm & có thể lỗi → xử lý **bất đồng bộ** (tạo `PENDING` ngay, chạy nền, cập nhật `COMPLETED`). `sourceEntityId` để biết phân rã từ epic/task nào (gán cha đúng + truy danh sách chống trùng). `inputPrompt` để sinh lại/debug/audit.

### 3.2. `ai_draft_issues` — Issue nháp chờ PM duyệt

AI sinh ra nháp ở đây trước; chỉ cái được duyệt mới thành issue thật.

| Field | Kiểu | Mục đích |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `generationId` | ObjectId → ai_generation | Thuộc lần sinh nào (index) |
| `projectId` | ObjectId → project | Dự án |
| `title` | String | Tiêu đề AI đề xuất (PM sửa được) |
| `description` | String | Mô tả AI đề xuất (PM sửa được) |
| `type` | enum `EPIC` / `TASK` / `SUBTASK` / `BUG` | Loại AI đoán |
| `priority` | enum `LOW` / `MEDIUM` / `HIGH` / `URGENT` | Độ ưu tiên AI đoán |
| `parentTempId` | String | Nối cha-con **trong nháp** (chưa có ObjectId thật) |
| `status` | enum `SUGGESTED` / `ACCEPTED` / `REJECTED` | Trạng thái duyệt |
| `createdIssueId` | ObjectId → issue | Trỏ tới issue thật sau khi duyệt |
| `expiresAt` | Date (TTL ~7 ngày) | Nháp chưa duyệt tự dọn, tránh tích rác |
| `createdAt` / `updatedAt` | Date | timestamps |

#### Giải thích kỹ 2 trường `parentTempId` và `createdIssueId`

Hai trường này giải quyết một vấn đề khó: AI sinh ra cả một **cây** (epic → task → subtask) cùng lúc, nhưng lúc đó **chưa có issue thật nào tồn tại** → chưa có ObjectId → không thể dùng `parentIssueId` (vốn cần ObjectId thật) để nối cha-con. Cần cơ chế "tạm".

**`parentTempId` — giữ quan hệ cha-con TRONG giai đoạn nháp.**
AI tự gán nhãn tạm cho từng item và dùng nhãn đó để chỉ cha:

```json
[
  { "tempId": "e1", "type": "EPIC",    "title": "Xác thực người dùng", "parentTempId": null },
  { "tempId": "t1", "type": "TASK",    "title": "API đăng nhập",       "parentTempId": "e1" },
  { "tempId": "t2", "type": "TASK",    "title": "API đăng ký",         "parentTempId": "e1" },
  { "tempId": "s1", "type": "SUBTASK", "title": "Validate email",      "parentTempId": "t2" }
]
```

Ý nghĩa: "task t1 là con của epic e1" — nhưng e1, t1 chỉ là **chuỗi tạm**, không phải ObjectId. Nhờ vậy cây giữ nguyên cấu trúc dù chưa có issue thật.

**`createdIssueId` — cây cầu nối nháp sang issue thật.**
Khi PM chấp nhận, hệ thống tạo issue thật theo thứ tự **cha trước, con sau**. Mỗi khi tạo xong một issue thật, ghi ObjectId thật của nó vào `createdIssueId` của nháp tương ứng. Nháp đó trở thành "bảng tra cứu" nhãn-tạm → ObjectId-thật:

```
B1: Tạo epic  → issue thật _id = 64abc...  → draft e1.createdIssueId = 64abc...
B2: Tạo task t1 (parentTempId="e1")
       → tra draft có tempId "e1" → đọc createdIssueId = 64abc...
       → tạo issue task với parentIssueId = 64abc...   ✅ nối đúng cha
       → draft t1.createdIssueId = 64def...
B3: Tạo subtask s1 (parentTempId="t2") → tra draft t2 → đọc createdIssueId → gán parentIssueId
```

Tóm tắt vai trò:

| Trường | Tồn tại khi | Trả lời câu hỏi |
|---|---|---|
| `parentTempId` | Lúc AI sinh nháp (chưa có issue thật) | "Trong cây nháp, cha của tôi là item tạm nào?" |
| `createdIssueId` | Lúc PM duyệt & tạo issue thật | "Nháp này đã biến thành issue thật nào (ObjectId)?" |

Lợi ích kèm theo của `createdIssueId`: **chống tạo trùng** (nếu `!= null` nghĩa là đã tạo rồi → không tạo lại khi PM bấm chấp nhận 2 lần), **truy vết** (issue thật nào sinh từ nháp nào), và **hiển thị trạng thái** ở màn duyệt.

#### Quy tắc bắt buộc: thật hóa theo thứ tự cha-trước-con

Quan hệ cha-con **tồn tại ở mức nháp** (qua `parentTempId`), nhưng issue **thật** luôn được tạo theo thứ tự cha trước, con sau. Do đó **không bao giờ tạo task thật trỏ tới một epic còn nháp** — tại thời điểm task thật ra đời, epic cha của nó đã được thật hóa ngay trước đó.

Lưu ý phân biệt với luồng `EPIC_TO_TASK`: khi sinh task cho một epic **đã là issue thật**, KHÔNG dùng `parentTempId` mà dùng `sourceEntityId = epicId thật`. `parentTempId` chỉ dùng khi cha và con cùng sinh ra trong một mẻ nháp (luồng `REQ_TO_EPIC`).

#### Xử lý mồ côi: PM bỏ epic cha nhưng giữ task con

Nếu trong một cây nháp, PM chấp nhận task con nhưng từ chối epic cha → task con không có cha thật để trỏ tới. **Quy tắc áp dụng (an toàn):**

> Chỉ thật hóa được một nháp con nếu nháp cha của nó cũng được chấp nhận (hoặc cha vốn đã là issue thật). Nếu PM từ chối epic cha → tự động bỏ (hoặc chặn chấp nhận) toàn bộ nhánh con bên dưới.

Cách này tránh sinh ra issue mồ côi (trỏ tới cha không tồn tại) và giữ cây luôn hợp lệ.

### 3.3. Cấu hình AI — đơn giản hóa (1 key hệ thống)

Vì dùng **1 key chung cấp hệ thống**, không cần bảng cho từng user. Hai lựa chọn:
- **Khuyên dùng:** lưu API key trong **biến môi trường** (`.env`) — an toàn nhất, không nằm trong DB.
- Nếu muốn đổi model/provider không cần deploy lại: thêm một bản ghi cấu hình nhỏ (`provider`, `model`, `isActive`). Key vẫn để ở env, **không lưu plaintext trong DB**.

---

## 4. Cách AI thực thi — luồng theo từng bước

### Luồng A — Sinh EPIC từ yêu cầu

1. **PM** mở dự án → bấm **"Sinh Epic bằng AI"** → nhập yêu cầu (req).
2. Hệ thống tạo `ai_generations` (`type=REQ_TO_EPIC`, `status=PENDING`) → **trả về ngay**, PM không phải chờ.
3. **Xử lý nền:** đọc key từ env → lấy danh sách **epic hiện có** của dự án → ghép vào prompt ("đừng trùng các epic này") → gọi API AI. Trạng thái chuyển `PROCESSING`.
4. AI trả về JSON các epic → hệ thống tạo loạt `ai_draft_issues` (`status=SUGGESTED`), `ai_generations` chuyển `COMPLETED`.
5. **Gửi `notification`** cho PM: "AI đã sinh xong N epic, bấm để xem."

### Luồng B — Màn duyệt (review)

6. PM mở màn duyệt → thấy **tất cả draft hiển thị cùng lúc**.
7. PM có thể, **trên nhiều task cùng lúc**:
   - **Sửa** title / mô tả / priority của từng draft;
   - **Chọn / bỏ** từng cái;
   - **Chấp nhận hàng loạt**, hoặc **yêu cầu sinh lại hàng loạt**, hoặc **thoát**.
8. Với draft được **chấp nhận** → tạo **issue thật** trong `issues` (`aiGenerated=true`), ánh xạ `parentTempId` → `parentIssueId`; draft cập nhật `status=ACCEPTED` + `createdIssueId`.
9. Draft bị bỏ → `status=REJECTED` (hoặc để TTL tự dọn).

### Luồng C — Phân rã sâu hơn (Epic → Task, Task → Subtask)

10. Trong một **epic đã có**, PM bấm **"Sinh Task bằng AI"** → tạo `ai_generations` (`type=EPIC_TO_TASK`, `sourceEntityId=epicId`).
11. Xử lý nền lấy **task đang có trong epic đó** để chống trùng → AI sinh task → vào màn duyệt (lặp lại Luồng B).
12. Tương tự, trong một **task**, PM bấm **"Sinh Subtask"** (`type=TASK_TO_SUBTASK`, `sourceEntityId=taskId`) — chỉ khi được yêu cầu.

> Mỗi lần "tạo thêm", hệ thống luôn nạp lại danh sách hiện có ở đúng phạm vi (epic toàn dự án / task trong epic / subtask trong task) → **các lần sinh sau không trùng với cái đã có**.

---

## 5. Phân quyền

| Vai trò dự án | Được làm gì với AI |
|---|---|
| **PM** (Project Manager) | Toàn quyền: sinh epic/task/subtask, duyệt, chấp nhận, sinh lại |
| **MEMBER** | **Không** được dùng AI sinh issue (chỉ xem/làm việc trên issue đã tạo) |

> Lưu ý: role dự án nay chỉ còn **PM** và **MEMBER** (đã bỏ OWNER/ADMIN). Cần cập nhật enum `role` trong sub-document `projects.members[]` cho khớp.

---

## 6. Tóm tắt — AI cần gì để chạy

**Bảng mới cần thêm:**
1. `ai_generations` — nhật ký & điều phối xử lý nền (bắt buộc).
2. `ai_draft_issues` — vùng nháp để PM duyệt (bắt buộc cho luồng có duyệt).

**Tận dụng cái đã có:**
- `issues.aiGenerated` — đánh dấu issue do AI tạo (đã có sẵn).
- `issues.parentIssueId` — dựng cây epic-task-subtask (đã có sẵn).
- `notifications` — báo PM khi AI xử lý nền xong (bảng vừa thêm).

**Cấu hình:**
- 1 API key hệ thống lưu ở **env**, không lưu DB.
- 3 prompt (nền chung + 3 biến thể) lưu **trong code**.

**Nguyên tắc vận hành:**
- Xử lý **bất đồng bộ** (PENDING → PROCESSING → COMPLETED) + báo qua notification.
- Chống trùng bằng cách **nạp danh sách hiện có vào prompt** (đúng phạm vi từng cấp).
- AI chỉ đề xuất; **PM là người quyết định cuối cùng**.
