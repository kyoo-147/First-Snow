# Phân tích UI: ui_10.png - Interactive Lessons (Feelings Practice)

## 1. Mục đích & Chức năng
- **Vai trò**: Trình phát bài học tương tác lõi (Interactive Lesson Player). Nơi diễn ra các hoạt động đánh giá, thực hành trắc nghiệm/logic/cảm xúc.
- **Tính năng cốt lõi**:
  - Giao diện bài học chính: Hiển thị minh họa tình huống (Ví dụ: Chú cáo khóc dưới mưa) kèm câu hỏi.
  - Tùy chọn trả lời (Multiple choices) bằng các nút biểu cảm 3D lớn.
  - Thanh công cụ hành động (Repeat, Hold to talk - Thu âm, Play audio - Đọc thoại).
  - Tiến trình bài học liên tục trên Right Rail.

## 2. Phân tích Bố cục (Layout)
- **Header**: Nút "Back to Lessons" góc trái. Cụm Tiêu đề môn (Feelings & Emotions / Feelings Practice) kèm thanh mốc tiến độ (Stepper: 2 of 5) căn giữa trên cùng.
- **Main Container**: Một `SnowCard` siêu lớn ở giữa.
  - *Câu hỏi*: Loa đọc đề bài góc trái. Chữ khổng lồ.
  - *Hình ảnh*: Khung hình minh họa to ở giữa (aspect ratio 16:9).
  - *Bộ chọn*: 4 lựa chọn phía dưới (Happy, Sad, Angry, Sleepy).
- **Thanh Hành Động**: Đặt dưới cùng, các nút lơ lửng với tâm điểm là nút Mic tròn to phát sáng.
- **Right Rail (LessonRightRail)**:
  - *Lesson Progress*: Đo lường quá trình bài học (Thanh bar) và số sao tích lũy.
  - *Great Job, Minh!*: Thẻ vinh danh ngay khi bé chọn đúng (có màu gradient bắt mắt).
  - *Learning Streak*: Cột mốc ngọn lửa theo dõi chuyên cần.
  - *Trợ giúp*: Nút "Hint" và "I'm not sure".

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Khoảng trống xung quanh khung bài học rất lớn. Khung Main Card được đưa vào chính giữa để lấy sự tập trung cao nhất (Focus mode).
- Các nút biểu cảm (Options): Khá giống màn hình "Talk with Snow" (Tỷ lệ 1:1.2), size cỡ `100x120px` để dễ chạm bằng ngón tay.
- Mốc tiến trình (Stepper): Các vòng tròn kết nối bằng đường gạch nối `h-1`.

## 4. Màu sắc (Color Palette)
- Khi một nút tùy chọn được chọn (Active), sẽ có hiệu ứng viền màu đồng bộ với môn học (VD: Chọn Sad thì nổi viền Xanh dương tím kèm icon tick check).
- Thẻ vinh danh (Great Job): Background màu gradient Tím rực rỡ `#7C3AED` to `#6D28D9` tạo cảm giác phần thưởng mạnh mẽ.
- Thanh Stepper: Các bước đã qua có màu Primary, bước hiện tại màu nổi, bước chưa tới màu xám/trắng viền nhạt.

## 5. Hướng dẫn Triển khai (Roadmap)
1. **`InteractiveLessonLayout`**: Component vỏ chứa thanh Stepper và cụm Tiêu đề.
2. **`QuizCard`**: Khung chứa Câu hỏi, hình ảnh (Có thể đổi loại Layout nếu câu hỏi không cần ảnh).
3. **`ChoiceGrid`**: Hệ thống các thẻ lựa chọn. Quản lý trạng thái bằng biến `selectedChoice`.
4. **`ActionBar`**: Nút điều khiển âm thanh. Cần có trạng thái `isRecording` cho nút Mic.
