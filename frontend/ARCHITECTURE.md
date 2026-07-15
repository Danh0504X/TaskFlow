# Cấu trúc Frontend — Cẩm nang cho team

Tài liệu này giải thích **mỗi loại folder / file dùng để làm gì** và **cần bỏ gì vào đó**.
Đọc kỹ trước khi code. Khi làm feature mới: **copy `features/projects/` rồi sửa theo domain của mình**.

---

## 1. Sơ đồ tổng quan

```
src/
├── app/              → "Khởi động & lắp ráp" app (providers, router)
├── assets/           → Ảnh, icon tĩnh
├── components/       → Component DÙNG CHUNG cho toàn app (không thuộc feature nào)
│   ├── layout/       → Khung trang (header, sidebar, layout)
│   └── ui/           → UI primitives tái sử dụng (Button, Input, Modal...)
├── features/         → ⭐ TRÁI TIM của app — chia theo nghiệp vụ (auth, projects...)
│   └── <feature>/    → 1 nghiệp vụ trọn gói (types, api, hooks, components, pages)
├── lib/              → Tiện ích & hạ tầng dùng chung (axios, helper, config)
└── styles/           → CSS toàn cục
```

**Nguyên tắc vàng:**
- Code thuộc 1 nghiệp vụ cụ thể → bỏ vào `features/<tên>/`.
- Code dùng lại ở ≥ 2 nghiệp vụ → đưa lên `components/ui` hoặc `lib/`.
- Không bao giờ để feature A import file bên trong feature B (tránh rối phụ thuộc).

---

## 2. Giải thích từng FOLDER

### 📁 `app/` — Lắp ráp & khởi động
**Dùng để:** đặt những thứ chạy 1 lần ở cấp toàn app.
**Cần chứa:**
- `providers/` → gom các Provider (React Query, Google OAuth, Toaster). Thêm provider mới thì sửa ở đây.
- `router.tsx` → khai báo route + chặn quyền truy cập (ProtectedRoute).

### 📁 `components/ui/` — UI primitives dùng chung
**Dùng để:** chứa những "viên gạch" giao diện tái sử dụng, **không dính nghiệp vụ**.
**Cần chứa:** Button, Input, Textarea, Select, Modal, Badge, Spinner, ConfirmDialog...
**Quy tắc:** component ở đây không được gọi API, không biết "project" hay "user" là gì — chỉ nhận `props` và hiển thị.

### 📁 `components/layout/` — Khung trang
**Dùng để:** bố cục chung (header, sidebar, footer) bao quanh nội dung trang.

### 📁 `features/<feature>/` — ⭐ Một nghiệp vụ trọn gói
**Dùng để:** gom TẤT CẢ code của 1 nghiệp vụ vào 1 chỗ (data + UI + logic).
Mỗi feature là 1 "hộp" độc lập. Xem mục 3 để biết các file bên trong.

### 📁 `lib/` — Hạ tầng & tiện ích dùng chung
**Dùng để:** code kỹ thuật dùng khắp app, không thuộc nghiệp vụ nào.
**Cần chứa:** `api.ts` (axios), `queryClient.ts`, helper (`cn.ts`, `format.ts`), type chung (`http.ts`).

---

## 3. Giải thích từng loại FILE trong một feature

> Lấy `features/projects/` làm mẫu chuẩn. Thứ tự dưới đây cũng là thứ tự nên code.

### 📄 `<feature>.types.ts` — Định nghĩa kiểu dữ liệu
**Dùng để:** khai báo các `interface` / `type` của nghiệp vụ, **khớp với model ở backend**.
**Cần làm:** định nghĩa entity (vd `Project`), payload gửi lên (`CreateProjectPayload`), union status.
**Ví dụ:** `project.types.ts` — `interface Project { _id, name, status, ... }`.

### 📄 `<feature>.schema.ts` — Quy tắc validate form
**Dùng để:** khai báo zod schema để **kiểm tra dữ liệu form** trước khi gửi đi.
**Cần làm:** mỗi field 1 rule (bắt buộc, độ dài...), khớp ràng buộc backend.
**Ví dụ:** `project.schema.ts` — `name` bắt buộc, tối đa 150 ký tự.

### 📄 `<feature>.api.ts` — Lớp gọi API
**Dùng để:** chứa MỌI lời gọi HTTP của nghiệp vụ. Component/hook không gọi axios trực tiếp.
**Cần làm:** mỗi endpoint 1 hàm (`getMyProjects`, `create`, `update`, `remove`), bóc lấy `data` trả về.
**Quy tắc:** luôn dùng instance `@/lib/api`, không tạo axios mới.

### 📄 `<feature>.keys.ts` — Query key factory
**Dùng để:** gom các `queryKey` của React Query về 1 chỗ → tránh gõ sai chuỗi, dễ invalidate cache.
**Ví dụ:** `projectKeys.list()`, `projectKeys.detail(id)`.

### 📄 `<feature>Store.ts` — State global (chỉ khi CẦN)
**Dùng để:** lưu state client toàn cục bằng Zustand (vd: user đang đăng nhập).
**Lưu ý:** ⚠️ Chỉ dùng cho **client-state**. Dữ liệu từ server (list, detail) → dùng React Query, KHÔNG bỏ vào đây.
**Ví dụ:** `authStore.ts`. (projects không cần store riêng.)

### 📁 `hooks/` — Logic tái sử dụng (React Query)
**Dùng để:** đóng gói logic lấy/thay đổi dữ liệu thành hook, để component dùng gọn.
**Cần làm:**
- `use<Feature>s.ts` → `useQuery` lấy danh sách.
- `use<Feature>.ts` → `useQuery` lấy chi tiết.
- `use<Feature>Mutations.ts` → `useMutation` tạo/sửa/xoá (kèm invalidate cache + toast).
**Quy tắc:** component KHÔNG tự `useEffect` để fetch — luôn qua hook ở đây.

### 📁 `components/` — Component RIÊNG của feature
**Dùng để:** UI chỉ phục vụ nghiệp vụ này (không tái dùng nơi khác).
**Cần chứa:** bảng (`ProjectTable`), form (`ProjectFormModal`), badge (`ProjectStatusBadge`), container điều phối (`ProjectsView`).
**Phân loại bên trong:**
- *Component "ngu" (presentational)*: chỉ nhận props + hiển thị (vd `ProjectTable`).
- *Component "container"*: gọi hook, giữ state, điều phối (vd `ProjectsView`).

### 📁 `pages/` — Trang gắn vào route
**Dùng để:** màn hình hoàn chỉnh mà router trỏ tới (vd `LoginPage`, `DashboardPage`).
**Quy tắc:** page chủ yếu lắp ghép các component lại, ít logic.

---

## 4. Giải thích các file trong `lib/`

| File | Dùng để |
|---|---|
| `api.ts` | Instance axios dùng chung: baseURL, gửi cookie, tự refresh token. **Mọi API đi qua đây.** |
| `http.ts` | Type response chung `ApiResponse<T>` + helper lấy message lỗi. |
| `queryClient.ts` | Cấu hình mặc định cho React Query (cache, retry...). |
| `cn.ts` | Gộp className có điều kiện. |
| `format.ts` | Định dạng ngày tháng. |

---

## 5. Luồng dữ liệu chuẩn (nhớ kỹ thứ tự này)

```
Người dùng bấm nút
   ↓
Component  (components/ hoặc pages/)
   ↓ gọi
Hook       (hooks/ — useQuery / useMutation)
   ↓ gọi
API layer  (*.api.ts)
   ↓ gọi
axios      (lib/api.ts)
   ↓
Backend
```

Chiều ngược lại: backend → axios → api → hook → React Query cache → component hiển thị.

---

## 6. Checklist tạo feature mới (vd `sprints`)

1. [ ] Tạo folder `features/sprints/`.
2. [ ] `sprint.types.ts` — copy từ project, sửa fields theo model backend.
3. [ ] `sprint.schema.ts` — sửa rule validate.
4. [ ] `sprint.api.ts` — sửa endpoint (`/projects/:id/sprints`).
5. [ ] `sprint.keys.ts` — đổi `['sprints']`.
6. [ ] `hooks/` — copy 3 hook, đổi tên + import.
7. [ ] `components/` — copy table/form/view, sửa cột & field.
8. [ ] Gắn vào route hoặc page tương ứng.
9. [ ] Chạy `npm run typecheck` và `npm run lint` → phải SẠCH trước khi push.

---

## 7. Quy ước chung CẢ TEAM phải tuân thủ

- ✅ Mọi gọi API qua `@/lib/api` (không tạo axios mới).
- ✅ Mọi server-state qua React Query; KHÔNG `useState`+`useEffect` để fetch.
- ✅ Mọi form validate bằng zod; type form suy ra từ schema (`z.infer`).
- ✅ Không đụng tới token (đã nằm trong httpOnly cookie do backend quản).
- ✅ Đặt `queryKey` qua `*.keys.ts`, không gõ chuỗi tay.
- ✅ `npm run typecheck` + `npm run lint` sạch trước khi push.
- ✅ Không import file nội bộ của feature khác.
