# Hướng dẫn Nội dung Bài học và Động cơ Chấm điểm Xác thực (Lesson Content & Grading Engine)

Tài liệu đặc tả kiến trúc, kết quả kiểm toán (audit findings), quy tắc biên soạn nội dung bài học tiếng Việt và danh mục 24 bài học MVP mẫu của hệ thống AgentKid Snow.

---

## 1. Kết quả kiểm toán luồng bài học cũ (Audit Findings)

### 1.1 Vấn đề chấp nhận đáp án lạc quan / tùy tiện (Optimistic Grading Flaw)
* **Trước khi khắc phục**: Trong thành phần `InteractiveLessonRunner` (`src/components/learning/interactive-lesson-runner.tsx`), khi người học bấm nút "Kiểm tra câu trả lời" (`checkAnswer`), giao diện hiển thị ngay lập tức phản hồi chúc mừng:
  ```tsx
  {isChecked && (
    <div className="...">
      {selectedOption ? t("learning", "runner.feedbackGood", { choice: selectedOption.label }) : t("learning", "runner.feedbackDefault")}
    </div>
  )}
  ```
  Hệ thống giao diện không hề kiểm tra tính đúng sai của `selectedOption` so với `correctAnswer`. Mọi đáp án bất kể đúng hay sai đều được khen ngợi "Lựa chọn tuyệt vời" hoặc "Bước làm rất tốt!".
* **Server-side flaw**: Trong `src/server/learning.ts`, hàm `saveLessonAnswer` chỉ so sánh chuỗi đơn giản `serialized === step.correctAnswer` mà không có schema kiểm định cấu trúc câu hỏi, không hỗ trợ multi-select, ordering hay Unicode NFC normalization. Khi nhận chuỗi bất kỳ, nếu câu hỏi không có `correctAnswer` xác thực, điểm số không được bảo vệ.

### 1.2 Giải pháp khắc phục triệt để
* Thay thế toàn bộ logic chấm lạc quan bằng **Deterministic Fail-Closed Lesson Engine** (`src/lib/lesson-engine/`).
* Server luôn chấm độc lập dựa trên schema của câu hỏi (`single_choice`, `multiple_choice`, `ordering`, `true_false`, `fill_blank`, `short_answer`).
* UI hiển thị kết quả dựa trên trường `grading` trả về từ server, kèm nhãn chỉ báo không dựa hoàn toàn vào màu sắc (`[Đúng rồi]`, `[Chưa đúng]`) phục vụ accessibility.

---

## 2. Đặc tả Động cơ Chấm điểm Xác thực (Deterministic Grading Engine)

### 2.1 Nguyên tắc thiết kế (Fail-Closed & Deterministic)
1. **Thất bại an toàn (Fail Closed)**:
   - Dữ liệu câu hỏi hoặc câu trả lời bị thiếu, sai kiểu dữ liệu, hoặc không khớp schema lập tức bị chấm sai (`isCorrect: false`, `score: 0`) và kèm thông tin lỗi xác thực (`validationError`), không phát sinh ngoại lệ chưa xử lý.
2. **Khớp ID thay vì hiển thị text**:
   - Đối với trắc nghiệm đơn (`single_choice`), trắc nghiệm nhiều đáp án (`multiple_choice`) và sắp xếp (`ordering`), câu trả lời phải là ID của lựa chọn (ví dụ: `opt-hanoi`, `opt-c`), tuyệt đối không chấp nhận nhãn hiển thị text (`Hà Nội`).
3. **Đầy đủ tập hợp (Full Set Equality)**:
   - Đối với câu hỏi chọn nhiều đáp án (`multiple_choice`), tập hợp lựa chọn của người học phải trùng khít 100% với tập hợp đáp án chuẩn (không thiếu tập con, không thừa tập cha, không cho phép phần tử trùng lặp).
4. **Trật tự tuyệt đối (Exact Sequence)**:
   - Đối với câu hỏi sắp xếp (`ordering`), thứ tự các ID gửi lên phải trùng khít từng vị trí chỉ mục với chuỗi đáp án chuẩn.
5. **Chuẩn hóa chữ viết tiếng Việt khắt khe (Narrow Unicode NFC Normalization)**:
   - Dành cho câu hỏi điền từ (`fill_blank`) và câu trả lời ngắn (`short_answer`):
     - Chuẩn hóa Unicode dạng chuẩn NFC: `.normalize('NFC')`.
     - Cắt khoảng trắng đầu cuối: `.trim()`.
     - Thu gọn nhiều khoảng trắng liên tiếp thành 1 dấu cách: `.replace(/\s+/g, ' ')`.
     - Chuyển chữ thường: `.toLowerCase()`.
     - **Dấu thanh tiếng Việt có ý nghĩa phân biệt bắt buộc**: `bút` khác `but`, `cá` khác `ca`. Ngoại trừ trường hợp tác giả chủ động thêm vào danh sách biến thể được chấp nhận (`acceptedVariants`).
6. **AI Bounded Boundary**:
   - Trí tuệ nhân tạo (AI/LLM) chỉ đóng vai trò hỗ trợ giải thích sư phạm (`explanation`) hoặc đưa ra lời gợi ý (`hint`), **tuyệt đối không tham gia quyết định tính đúng/sai** hoặc tự ý sửa đổi đáp án chuẩn (`canonicalAnswer`).

---

## 3. Quy tắc Biên soạn Nội dung Bài học (Authoring Rules)

### 3.1 Cấu trúc phiên bản bài học (Lesson Schema)
Mỗi bài học được định nghĩa chuẩn xác với:
- `id`: Định danh UUID cố định (chuẩn RFC4122).
- `title`: Tiêu đề tiếng Việt chuẩn mực, gần gũi với trẻ em.
- `subject`: Môn học (Tiếng Việt, Toán học, Đọc hiểu & Truyện, Cảm xúc & An toàn, Khoa học cơ bản).
- `gradeLevel`: Độ tuổi / cấp lớp (Mầm non, Lớp 1, Lớp 2, Lớp 3).
- `track`: Phân nhóm học tập (`literacy`, `mathematics`, `stories_comprehension`, `social_emotional_safety`, `basic_science`).
- `estimatedMinutes`: Thời lượng học dự kiến (10 - 16 phút).
- `content`: JSON chứa `ageBand`, `difficulty`, `subtitle`, `description`, `image`, `accent`, `rating` và danh sách các câu hỏi `steps`.
- Mỗi câu hỏi bao gồm:
  - `id`: UUID cố định của bước.
  - `questionType`: Loại câu hỏi (`single_choice`, `multiple_choice`, `ordering`, `true_false`, `fill_blank`, `short_answer`).
  - `prompt`: Câu hỏi tiếng Việt rõ ràng, dễ hiểu.
  - `instruction`: Hướng dẫn thao tác cho bé.
  - `helper`: Lời nhắn nhủ nhẹ nhàng của trợ lý Snow / AgentKid.
  - `hint`: Gợi ý nếu bé gặp khó khăn.
  - `explanation`: Lời giải thích kiến thức sư phạm sau khi trả lời.
  - `canonicalAnswer`: Đáp án chuẩn.
  - `acceptedVariants`: Các biến thể được chấp nhận (nếu có).
  - `points`: Điểm số đạt được (mặc định 10 - 15 điểm).

---

## 4. Danh mục 30 Bài học Tiếng Việt (Lesson Inventory)

Hệ thống bao gồm tối thiểu 30 bài học hoàn chỉnh (6 bài học cho mỗi track), mỗi bài tối thiểu 5 câu hỏi trải dài trên 5 nhóm môn học:

| STT | Mã bài học | Tên bài học | Nhóm môn học (Track) | Độ tuổi / Lớp | Số câu hỏi | Tài nguyên ảnh được duyệt |
|---|---|---|---|---|---|---|
| 1 | `00000000-0000-4000-a000-000000000001` | Làm quen với nguyên âm Tiếng Việt | literacy | 5-6 tuổi (Mầm non - Lớp 1) | 5 | `/images/lesson-abc.png` |
| 2 | `00000000-0000-4000-a000-000000000002` | Dấu thanh diệu kỳ trong Tiếng Việt | literacy | 6-7 tuổi (Lớp 1) | 5 | `/images/lesson-abc.png` |
| 3 | `00000000-0000-4000-a000-000000000003` | Ghép vần gia đình yêu thương | literacy | 6-7 tuổi (Lớp 1) | 5 | `/images/lesson-abc.png` |
| 4 | `00000000-0000-4000-a000-000000000004` | Từ trái nghĩa vui nhộn | literacy | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-abc.png` |
| 5 | `00000000-0000-4000-a000-000000000005` | Mẫu câu: Ai làm gì? | literacy | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-abc.png` |
| 6 | `00000000-0000-4000-a000-000000000006` | Đếm vui từ 1 đến 10 | mathematics | 5-6 tuổi (Mầm non - Lớp 1) | 5 | `/images/lesson-math.png` |
| 7 | `00000000-0000-4000-a000-000000000007` | Phép cộng nhẹ nhàng trong phạm vi 10 | mathematics | 6-7 tuổi (Lớp 1) | 5 | `/images/lesson-math.png` |
| 8 | `00000000-0000-4000-a000-000000000008` | Phép trừ và bài toán bớt đi | mathematics | 6-7 tuổi (Lớp 1) | 5 | `/images/lesson-math.png` |
| 9 | `00000000-0000-4000-a000-000000000009` | Thế giới hình học quanh em | mathematics | 6-7 tuổi (Lớp 1) | 5 | `/images/lesson-math.png` |
| 10 | `00000000-0000-4000-a000-00000000000a` | Bé tập xem đồng hồ | mathematics | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-math.png` |
| 11 | `00000000-0000-4000-a000-00000000000b` | Rùa và Thỏ: Bài học kiên trì | stories_comprehension | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 12 | `00000000-0000-4000-a000-00000000000c` | Sự tích Bánh chưng Bánh giầy | stories_comprehension | 6-9 tuổi (Lớp 1 - 3) | 5 | `/images/lesson-story.png` |
| 13 | `00000000-0000-4000-a000-00000000000d` | Cây khế và bài học về lòng tham | stories_comprehension | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 14 | `00000000-0000-4000-a000-00000000000e` | Thạch Sanh: Lòng dũng cảm và chính trực | stories_comprehension | 7-9 tuổi (Lớp 2 - 3) | 5 | `/images/lesson-story.png` |
| 15 | `00000000-0000-4000-a000-00000000000f` | Khăn đỏ nghe lời mẹ dặn | stories_comprehension | 5-7 tuổi (Mầm non - Lớp 1) | 5 | `/images/lesson-story.png` |
| 16 | `00000000-0000-4000-a000-000000000010` | Nhận diện và gọi tên cảm xúc | social_emotional_safety | 5-7 tuổi (Mầm non - Lớp 1) | 5 | `/images/lesson-social.png` |
| 17 | `00000000-0000-4000-a000-000000000011` | Quy tắc 5 ngón tay bảo vệ cơ thể | social_emotional_safety | 5-8 tuổi (Mầm non - Lớp 2) | 5 | `/images/lesson-social.png` |
| 18 | `00000000-0000-4000-a000-000000000012` | Bé cần làm gì khi bị lạc? | social_emotional_safety | 5-8 tuổi (Mầm non - Lớp 2) | 5 | `/images/lesson-social.png` |
| 19 | `00000000-0000-4000-a000-000000000013` | Bé đi bộ an toàn trên đường | social_emotional_safety | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-social.png` |
| 20 | `00000000-0000-4000-a000-000000000014` | Bạn tốt quanh em: Lịch sự và chia sẻ | social_emotional_safety | 5-8 tuổi (Mầm non - Lớp 2) | 5 | `/images/lesson-social.png` |
| 21 | `00000000-0000-4000-a000-000000000015` | Bốn mùa tươi đẹp trong năm | basic_science | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 22 | `00000000-0000-4000-a000-000000000016` | Hạt mầm lớn lên thành cây | basic_science | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 23 | `00000000-0000-4000-a000-000000000017` | Vòng tuần hoàn của giọt nước | basic_science | 6-9 tuổi (Lớp 1 - 3) | 5 | `/images/lesson-story.png` |
| 24 | `00000000-0000-4000-a000-000000000018` | Mặt Trời, Mặt Trăng và bầu trời đêm | basic_science | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 25 | `00000000-0000-4000-a000-000000000019` | Mở rộng vốn từ: Gia đình và Trường lớp | literacy | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-abc.png` |
| 26 | `00000000-0000-4000-a000-00000000001a` | So sánh lớn hơn, bé hơn và bằng nhau | mathematics | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-math.png` |
| 27 | `00000000-0000-4000-a000-00000000001b` | Cậu bé Tích Chu: Lòng hiếu thảo và tình yêu thương | stories_comprehension | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 28 | `00000000-0000-4000-a000-00000000001c` | Kỹ năng an toàn khi tham gia giao thông và băng qua đường | social_emotional_safety | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-social.png` |
| 29 | `00000000-0000-4000-a000-00000000001d` | Năm giác quan kỳ diệu của cơ thể bé | basic_science | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |
| 30 | `00000000-0000-4000-a000-00000000001e` | Động vật quanh em: Vật nuôi trong nhà và động vật hoang dã | basic_science | 6-8 tuổi (Lớp 1 - 2) | 5 | `/images/lesson-story.png` |

---

## 5. Ánh xạ Tài nguyên Đồ họa (Asset Mapping)
Tất cả bài học chỉ sử dụng các ảnh nền/tiền cảnh hiện có trong kho lưu trữ hợp lệ của dự án (`public/images/`):
- Môn Tiếng Việt / Chữ cái: `/images/lesson-abc.png`
- Môn Toán học: `/images/lesson-math.png`
- Môn Đọc hiểu, Khoa học: `/images/lesson-story.png`
- Môn Cảm xúc, Kỹ năng, An toàn: `/images/lesson-social.png`
- Biểu tượng linh vật: `/images/snow-mascot-ui.png`

Tuyệt đối không sinh ảnh mới, không dùng dịch vụ bên ngoài hay đưa tài nguyên không được kiểm duyệt vào kho mã nguồn.
