# Snow UI — Toàn tập Hệ thống Thiết kế (Design System) & Phân tích Mockup

Đây là tài liệu quy chuẩn thiết kế (Single Source of Truth) được tổng hợp sau khi quét và phân tích **toàn bộ hệ thống giao diện (11 màn hình độc lập)** của ứng dụng Snow. Tài liệu này tuân thủ chuẩn `stitch-design-taste` nhằm đem lại cảm giác cao cấp, mạch lạc và thân thiện với đối tượng người dùng là trẻ em và phụ huynh.

---

## 1. Danh mục các Template UI cốt lõi

Sau khi phân tích toàn bộ file trong thư mục `ui_mockup`, tôi đã gom nhóm và loại bỏ các file trùng lặp để xác định 11 template lõi tạo nên toàn bộ ứng dụng Snow:

1. **Landing Page (Public)**: `ui_(9).png`, `ui_(14).png` — Trang giới thiệu sản phẩm.
2. **Home / Dashboard**: `ui_(0).png`, `ui_(13).png` — Cổng thông tin chính của bé.
3. **Explore**: `ui_(4).png` — Nơi khám phá lộ trình học, chủ đề.
4. **Activities**: `ui_(5).png` — Danh sách nhiệm vụ, giải lao, game ghép hình.
5. **Rewards**: `ui_(6).png` — Huy hiệu, bản đồ thành tích.
6. **Create (Story Builder)**: `ui_(7).png` — Quy trình 5 bước để bé tự tạo câu chuyện.
7. **Interactive Lessons**: `ui_(10).png`, `ui_(15).png` — Màn hình học tương tác (VD: bài tập cảm xúc).
8. **Talk with Snow (Chat)**: `ui_(2).png`, `ui_(12).png` — Màn hình chat văn bản/chọn cảm xúc.
9. **AI Companion (Voice)**: `ui_(3).png`, `ai_compainon_2.png` — Trợ lý ảo giọng nói.
10. **Parent Insights (Minh's Day)**: `ui_(1).png`, `ui_(11).png` — Báo cáo hoạt động trong ngày cho phụ huynh.
11. **Parent Settings**: `ui_(8).png` — Khu vực thiết lập an toàn và cấu hình trẻ em.

---

## 2. Visual Theme & Atmosphere
- **Density**: "Daily App Balanced" (Điểm 5/10) - Không gian thoáng đãng, các khối thông tin (Cards) được tách biệt rõ ràng bằng padding lớn (`p-5`, `p-6`). Không nhồi nhét.
- **Variance**: "Offset Asymmetric" (Điểm 6/10) - Layout sử dụng các thẻ có kích thước khác nhau (Bento box style) để tạo nhịp điệu sinh động, tránh sự nhàm chán của cấu trúc 3 cột bằng nhau.
- **Motion**: "Fluid Spring" (Điểm 7/10) - Hiệu ứng mượt mà, êm ái.

---

## 3. Quy chuẩn Màu sắc (Color Palette)
- **Canvas White (Background)**: Dải gradient mềm mại từ `bg-snow-ice` (#F4F7FB) sang `bg-snow-lavender` (#F0EDFF) để tạo cảm giác bồng bềnh như mây tuyết.
- **Pure Surface**: `bg-white` hoặc thẻ kính mờ (glassmorphism) cho các hộp nội dung nhằm tách biệt chúng khỏi background.
- **Charcoal Ink (Text Chính)**: `text-snow-primary-dark` (#1E1B4B) - Dùng cho tiêu đề và nội dung cần nhấn mạnh. (TUYỆT ĐỐI KHÔNG DÙNG `#000000`).
- **Muted Steel (Text Phụ)**: `text-snow-muted` (#64748B) - Dành cho mô tả, thời gian, trạng thái.
- **Primary Accent (Tím/Indigo)**: `bg-snow-primary` (#8B5CF6) - Dùng cho các nút bấm chính, định vị thương hiệu Snow.
- **Secondary Accents (Hệ thống phần thưởng & Cảm xúc)**:
  - Vàng (Warning): `text-snow-warning` (#F59E0B) - Điểm số, sao, streak.
  - Xanh lơ (Aqua): `bg-snow-aqua` (#06B6D4) - Môn học toán/logic.
  - Xanh lá (Success): `text-snow-success` (#10B981) - Trạng thái hoàn thành, thư giãn.
  - Đỏ/Hồng (Peach): `text-snow-peach` / `#F87171` - Cảm xúc mạnh (Angry) hoặc tương tác khẩn.

---

## 4. Typography Architecture
- **Display/Headlines**: Font chữ bo tròn, thân thiện (như `Nunito`, `Quicksand` hoặc `Outfit`). Cỡ chữ to, weight `font-black` để tạo cấu trúc rõ ràng. Không dùng serif (có chân).
- **Body Text**: Relaxed leading (line-height lớn), giới hạn 65 ký tự mỗi dòng để trẻ dễ đọc.
- **Chống chỉ định (Anti-patterns)**: Không sử dụng các font hệ thống chung chung (`Inter`, `Times New Roman`) để giữ bản sắc cao cấp (Premium).

---

## 5. Cấu trúc Layout Lõi (Grid & Component)
Mọi màn hình trong ứng dụng đều tuân theo mô hình 3 lớp (3-layer model):
1. **Left Navigation (Cột trái)**: Menu cố định, biểu tượng rõ ràng, sử dụng active state màu tím nhạt.
2. **Main Content (Nội dung giữa)**: Trình bày dạng lưới bất đối xứng (Bento Grid). 
   - Hạn chế cuộn dọc quá dài. Ưu tiên sử dụng Horizontal Scroll (cuộn ngang) cho các danh sách bài học (VD: trong màn hình Explore `ui_(4).png` và Activities `ui_(5).png`).
3. **Contextual Right Rail (Cột phải ngữ cảnh)**: Đây là một điểm sáng trong UI. Cột phải KHÔNG dùng chung mà thay đổi theo ngữ cảnh:
   - *Home/Explore*: Gợi ý lộ trình, phần thưởng.
   - *Companion/Talk*: Chuỗi check-in tâm lý (Your Calm Journey), Gợi ý thả lỏng (Take a Moment) (`ui_(2).png`).
   - *Lessons*: Tiến độ bài học, Lời động viên (`ui_(10).png`).
   - *Settings/Parent*: Tóm tắt profile, Trạng thái truy cập (`ui_(8).png`).

### Các Component Chính
- **SnowCard**: Viền bo góc cực lớn (`rounded-3xl` hoặc `24px`), đổ bóng mềm. Trạng thái hover sẽ nâng nhẹ lên (`-translate-y-1`).
- **Pill Buttons**: Nút bấm bo tròn hoàn toàn (`rounded-full`). Tránh tạo ra các nút vuông sắc cạnh.
- **Hero Image (Inline or Offset)**: Mascot Snow luôn được chèn vào góc các khung (offset) thay vì nằm chết trong hộp, tạo cảm giác Snow đang "sống" cùng bé.

---

## 6. Anti-Patterns (Những thứ KHÔNG ĐƯỢC LÀM)
- ❌ KHÔNG dùng hình chữ nhật sắc cạnh. Mọi thứ phải bo góc (`rounded-2xl` trở lên).
- ❌ KHÔNG dùng màu Đen (`#000000`).
- ❌ KHÔNG sử dụng bố cục 3 cột thẻ bằng nhau tăm tắp (tạo cảm giác giống template rẻ tiền).
- ❌ KHÔNG dùng hiệu ứng Neon hay Glow lòe loẹt.
- ❌ KHÔNG dùng text hiển thị placeholder vô nghĩa. Mọi thông tin phải là văn phong "nhẹ nhàng, động viên" (Observational Language).
