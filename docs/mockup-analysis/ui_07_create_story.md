# Phân tích UI: ui_7.png - Create (Story Builder)

## 1. Mục đích & Chức năng
- **Vai trò**: Cung cấp bộ công cụ "Sáng tạo" giúp bé và AI cùng viết nên một câu chuyện thông qua hướng dẫn từng bước.
- **Tính năng cốt lõi**:
  - Giao diện đa bước (Multi-step wizard/progress).
  - Chọn nhân vật (Who), Bối cảnh (Where), Vấn đề (Problem), Hướng giải quyết (Solution), và Xem thành quả (Read).
  - Thao tác chọn theo hình ảnh (Visual Choices). Rất ít chữ.

## 2. Phân tích Bố cục (Layout)
- **Top Bar (Stepped Progress)**: Thanh tiến độ chia làm 5 mốc. Mốc hiện tại (VD: "1. Who") được phóng to và bôi màu đậm. Các mốc khác màu xám. Nối bằng các đường gạch ngang.
- **Main Question Area**: "Who is the hero of our story?" (Tiêu đề khổng lồ, căn giữa).
- **Options Grid**: Lưới 3 hoặc 4 thẻ chữ nhật đứng chứa hình ảnh nhân vật (A Brave Knight, A Curious Fox, A Friendly Robot...).
- **Bottom Bar**: Cố định dưới đáy. Cứa nút "Next Step" lớn màu tím ở góc phải, và nút "Go Back" màu xám ở góc trái.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Lưới chọn nhân vật: Sử dụng `gap-8` (32px), rất thưa để bé không bấm nhầm.
- Thẻ nhân vật (Character Card): Kích thước lớn, khoảng `250px x 350px` (Tỷ lệ dọc chân dung - Portrait).
- Khi hover hoặc chọn, thẻ sẽ phóng to `scale-105` và có viền `ring-4` siêu dày.
- Nút bấm điều hướng (Next): `px-8 py-4` (Cực to), `font-black`, `text-lg`.

## 4. Màu sắc (Color Palette)
- Dựa trên nền Canvas trắng, mọi sự chú ý dồn vào hình ảnh minh họa trên thẻ.
- Thanh Progress: Điểm đã qua dùng màu Primary `#8B5CF6`, điểm chưa đến dùng viền xám `border-snow-border text-snow-muted`.
- Thẻ được chọn: Highlight bằng viền màu tím sẫm và nền mờ tím `bg-snow-primary/10`.

## 5. Hướng dẫn Triển khai (Roadmap)
1. Cấu trúc State của Trang: Quản lý qua biến `currentStep` (từ 1 đến 5). Khi đổi `currentStep`, nội dung Main Area tự động thay đổi (Tương tự một Carousel tĩnh).
2. Component **`StepWizard`**: Header chứa thanh tiến trình.
3. Component **`SelectableCard`**: Có thuộc tính `isSelected` để thay đổi class CSS (Hiệu ứng viền phát sáng và dấu tick check xanh ở góc).
4. Component **`StoryPreview`**: (Cho bước 5) - Hiển thị bức tranh ghép lại từ các thông số của 4 bước trước. Khu vực này có thể tái sử dụng tính năng đọc âm thanh (Text to Speech) như màn hình Companion.
