# Phân tích UI: ui_4.png - Explore

## 1. Mục đích & Chức năng
- **Vai trò**: Khu vực khám phá nội dung, cho phép bé tìm kiếm và chọn lọc các bài học theo chủ đề (English, Math, Story Time, Social Skills).
- **Tính năng cốt lõi**:
  - Tiêu đề "Explore what's inside" với mô tả khơi gợi.
  - Các khối chủ đề lớn (Subjects) để lọc.
  - Danh sách bài học nổi bật dạng cuộn ngang (Horizontal scroll).
  - Tích hợp cột phải `ChildRightRail` (HomeRightRail).

## 2. Phân tích Bố cục (Layout)
- Vẫn giữ khung 3 cột chuẩn của hệ thống Child App (Left Nav, Main Center, Right Rail).
- **Khu vực Main Center**:
  - *Hero Category Row*: Các thẻ lớn có icon 3D đặc trưng của từng môn (Hình khối ABC cho English, Số 123 cho Math, Trăng sao cho Story Time, Mascot cho Social Skills).
  - *Recommended Lessons*: Lưới thẻ bài học chi tiết (LessonCard) có chứa thumbnail hình ảnh sinh động, tiêu đề bài học, điểm đánh giá (Rating sao), và thời lượng (15 min).
- Các thẻ bài học có bố cục hình ảnh chiếm 50% diện tích thẻ (Nằm trên), thông tin chữ nằm dưới.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Lưới bài học sử dụng `grid-cols-2` hoặc `grid-cols-4` tùy kích thước màn hình. Gap chuẩn là `24px`.
- Thẻ bài học (Lesson Card): Có tỷ lệ aspect-ratio của ảnh là khoảng 16:9 hoặc 4:3. Phía dưới ảnh có một thẻ badge nổi lên hiển thị phân loại (VD: English - màu Tím, Math - màu Xanh ngọc).
- Các chỉ số nhỏ (Rating, Duration): Nằm chung một dòng ở đáy thẻ, cách nhau `12px` (`gap-3`), chữ `12px` font `semibold`.

## 4. Màu sắc (Color Palette)
- Màu sắc đóng vai trò phân loại môn học (Taxonomy colors):
  - English: Tím Lavender.
  - Math: Xanh Aqua.
  - Story Time: Vàng/Cam nhạt (Sunset).
  - Social Skills: Hồng/Xanh lơ.
- Điều này tạo ra một bức tranh tổng thể vô cùng đa sắc nhưng không bị chói vì tuân theo nguyên tắc "Màu nền thẻ là màu trắng `bg-white`, chỉ có Header hoặc Badge mới mang màu của môn học".

## 5. Hướng dẫn Triển khai (Roadmap)
1. **Component `CategoryCard`**: Thẻ bấm vào chủ đề lớn. Có icon 3D góc phải dưới (offset bottom-right).
2. **Component `LessonCard`**: 
   - Vùng Image (Overflow hidden, rounded-t-2xl).
   - Vùng Content (p-4).
   - Badge môn học đặt `absolute -top-3 left-4` để tạo hiệu ứng nổi bật (pop-out).
3. **Scroll Container**: Phải sử dụng cấu hình cuộn trơn tru `overflow-x-auto snap-x snap-mandatory` để hỗ trợ trẻ em lướt trên máy tính bảng dễ dàng.
