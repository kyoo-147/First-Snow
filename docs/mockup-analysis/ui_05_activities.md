# Phân tích UI: ui_5.png - Activities

## 1. Mục đích & Chức năng
- **Vai trò**: Cung cấp danh sách các hoạt động tương tác ngắn hạn, nhiệm vụ hằng ngày và các trò chơi nhỏ để bé thư giãn.
- **Tính năng cốt lõi**:
  - Chia nhóm hoạt động: Missions (Nhiệm vụ dài), Quick Activities (Tương tác nhanh), Movement Breaks (Vận động thể chất), và Games (Trò chơi logic như Matching).
  - Giao diện khuyến khích sự tò mò, khám phá.

## 2. Phân tích Bố cục (Layout)
- Layout chính là một lưới Bento Grid phức hợp (Không đồng nhất kích thước).
- Nổi bật nhất là một **Hero Card** (VD: Missions) chiếm 2 cột, kế bên là các **Square Cards** (1 cột).
- Ở phía dưới, có các khu vực chứa hình minh họa siêu lớn (Mascot Snow và Cáo) đang chơi trò Matching, báo hiệu có thể click vào để khởi chạy minigame.
- Vẫn duy trì Right Rail quen thuộc bên phải.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Dùng `gap-6` (24px) giữa các khối.
- Thẻ Hero (Missions): Có hình khối Mascot to vượt ra khỏi viền của thẻ (`overflow-visible`), tạo độ sâu trường ảnh (3D depth).
- Cỡ chữ tiêu đề của thẻ: To (`24px` đến `28px`), `font-black`. 

## 4. Màu sắc (Color Palette)
- Hoạt động Vận động (Movement Breaks): Màu cam ấm (`#F97316`) hoặc đỏ đào (Peach) - Kích thích năng lượng.
- Hoạt động Focus (Matching Game): Màu xanh dương/tím (`#6366F1`) - Giúp tập trung.
- Các nút CTA (Kêu gọi hành động) trong từng thẻ có màu tương phản với nền thẻ. Ví dụ: Nền cam nhạt thì nút màu cam đậm.

## 5. Hướng dẫn Triển khai (Roadmap)
1. Xây dựng **Activity Grid**: Không dùng grid đều, dùng `grid-template-columns` cấu trúc tỷ lệ (VD: thẻ to chiếm `col-span-2`, thẻ nhỏ `col-span-1`).
2. Component **`ActivityCard`**: Cần hỗ trợ prop `isLarge` để render layout ảnh nằm bên cạnh text (Row layout) thay vì ảnh nằm trên text (Column layout).
3. Đảm bảo hỗ trợ Overflow Visible: Hình ảnh mascot (VD: Cú, Cáo, Snow) phải được đặt `absolute` với chỉ số `z-index` cao hơn thẻ, vươn qua cạnh viền trên của thẻ khoang 10-20px để tạo phong cách Premium.
