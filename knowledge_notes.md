# SỔ TAY KIẾN THỨC: KÉO THẢ (DND-KIT), CORS ĐỘNG & TỐI ƯU HỆ HIỆU NĂNG REACT

Chào Khoa! Dưới đây là tổng hợp toàn bộ các kiến thức thực chiến mới mà bạn đã tiếp cận và áp dụng thành công trong buổi làm việc hôm nay. File này được lưu ở thư mục cha `N:\\Intern FS` nên hoàn toàn nằm ngoài Git và không bao giờ bị push lên GitLab của nhóm.

---

## 1. Cấu hình CORS động (Dynamic CORS Configuration)
*   **Vấn đề cũ:** Cấu hình CORS tĩnh (`origin: env.CLIENT_URL`) chỉ cho phép duy nhất một địa chỉ frontend truy cập API. Khi chạy nhiều cổng local (như `5173`, `5174`), các thành viên khác trong team sẽ bị lỗi CORS.
*   **Giải pháp mới (CORS động):**
    *   Sử dụng một mảng `ALLOWED_ORIGINS` chứa danh sách các địa chỉ được chấp nhận.
    *   Dùng một hàm callback để kiểm tra động thuộc tính `origin` của request:
        ```javascript
        origin: function (origin, callback) {
          // Cho phép các tool test API (không có origin) và các origin nằm trong danh sách trắng
          if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true)
          }
          return callback(new Error('Not allowed by CORS'))
        }
        ```
*   **Ý nghĩa:** Tăng độ linh hoạt cho dự án khi làm việc nhóm, giúp server phục vụ được nhiều môi trường chạy thử nghiệm local cùng lúc mà vẫn đảm bảo tính bảo mật.

---

## 2. Thuật toán tính toán chỉ số sắp xếp tối ưu (`orderIndex`)
*   **Vấn đề:** Khi kéo thả một card tới vị trí mới, nếu đánh lại chỉ số index kiểu tuần tự (1, 2, 3, 4...), bạn sẽ phải gọi API cập nhật lại chỉ số cho **toàn bộ các card còn lại** trong danh sách (Độ phức tạp $O(n)$).
*   **Giải pháp (Thuật toán trung bình cộng):**
    Tính toán `orderIndex` mới dựa vào phần tử đứng trước (`prevItem`) và phần tử đứng sau (`nextItem`) tại vị trí thả:
    *   *Thả vào danh sách trống:* Trả về `1000`.
    *   *Thả lên đầu danh sách:* Trả về `(firstItem.orderIndex) - 1000`.
    *   *Thả xuống cuối danh sách:* Trả về `(lastItem.orderIndex) + 1000`.
    *   *Thả vào giữa hai phần tử:* Trả về trung bình cộng `(prevOrder + nextOrder) / 2`.
*   **Ý nghĩa:** Cực kỳ tối ưu hiệu năng DB ($O(1)$). Khi kéo thả, bạn **chỉ cần gọi API cập nhật duy nhất 1 card được kéo**, các card khác giữ nguyên vị trí và chỉ số.

---

## 3. Kiến thức cốt lõi về `@dnd-kit/core` và `@dnd-kit/sortable`
*   **`DndContext`:** Component cha quản lý toàn bộ trạng thái và vòng đời của hành động kéo thả (kích hoạt các sự kiện `onDragStart`, `onDragOver`, `onDragEnd`, `onDragCancel`).
*   **`DragOverlay` (Lớp phủ kéo thả):**
    *   Giúp render một bản sao "trôi nổi" của card đang kéo ngoài cây DOM (Portal ở body).
    *   Giúp card di chuyển tự do khắp màn hình mà không bị cắt góc hoặc ẩn đi bởi thuộc tính cuộn (`overflow: auto/hidden`) của các cột Kanban.
*   **`SortableContext` & `useSortable`:** 
    *   Cung cấp khả năng sắp xếp thứ tự các item.
    *   Hook `useSortable` cung cấp các tham số như `transform` (tọa độ dịch chuyển) và `isDragging` (trạng thái đang kéo của item).

---

## 4. Tối ưu hóa hiệu năng Kéo thả (Dnd Performance Tuning)
Khi kéo thả nhanh trên các danh sách dài, React dễ bị giật lag do số lần re-render quá nhiều. Chúng ta đã giải quyết bằng các kỹ thuật sau:

### A. Chiến lược va chạm đầu con trỏ (`pointerWithin`)
*   *Mặc định:* Dnd-kit sử dụng thuật toán `rectIntersection` (tính toán diện tích va chạm của các hình chữ nhật). Thuật toán này nặng và phản hồi chậm khi rê chuột nhanh.
*   *Tối ưu:* Chuyển sang `collisionDetection={pointerWithin}`. Chỉ cần **đầu con trỏ chuột** chạm vào ranh giới của card hoặc cột nào, hệ thống lập tức nhận diện ngay, phản hồi tức thời.

### B. Giảm tải re-render bằng `useRef` (`lastOverId`)
*   *Vấn đề:* Khi chuột di chuyển, sự kiện `onDragOver` bắn liên tục. Nếu gọi `setLocalIssues` để cập nhật state liên tục, CPU sẽ bị nghẽn dẫn đến lag giật card.
*   *Tối ưu:* Dùng một biến `lastOverId` dạng `useRef` để lưu lại card/cột vừa quét qua. Nếu chuột vẫn di chuyển trong phạm vi card cũ, ta lập tức dừng xử lý (`return`):
    ```typescript
    if (lastOverId.current === overId) return;
    lastOverId.current = overId;
    ```
*   *Ý nghĩa:* React chỉ re-render **đúng 1 lần** khi con trỏ chuột thực sự chuyển từ card này sang card khác.

### C. Phân biệt Click và Drag (`activationConstraint`)
*   *Vấn đề:* Người dùng click vào card để xem chi tiết nhưng hệ thống lại hiểu nhầm là kéo thả và gọi API update vô cớ.
*   *Tối ưu:*
    *   `distance: 5` (dành cho Chuột PC): Phải rê chuột đi ít nhất 5px mới tính là kéo thả. Click tại chỗ sẽ bỏ qua.
    *   `delay: 250` (dành cho Mobile/Tablet): Phải nhấn giữ card 250ms mới tính là kéo thả. Vuốt nhẹ sẽ được hiểu là cuộn trang web bình thường.

---

*Chúc Khoa học tập và làm dự án thật tốt! Cần Mentor hỗ trợ gì thêm cứ nhắn mình nhé.*
