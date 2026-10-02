# Phân tích UI: ui_9.png - Landing Page (Public Website)

## 1. Mục đích & Chức năng
- **Vai trò**: Cửa hàng (Storefront) hoặc trang giới thiệu quảng bá sản phẩm để chốt sale phụ huynh và giáo viên.
- **Tính năng cốt lõi**:
  - Truyền tải thông điệp chính: "A gentle AI companion for learning, routines, and feelings."
  - Hệ thống thẻ tính năng làm bằng hình ảnh trực quan (Preview của App thực tế).
  - Các chứng nhận niềm tin (Trust badges): COPPA & GDPR compliant, Designed for neurodiverse learners, Child-friendly by design.
  - Các Call-to-action (CTA): Start Free, Watch how it works.

## 2. Phân tích Bố cục (Layout)
- Không dùng App Shell. Đây là Web Layout có cuộn dọc vô tận (Vertical scrolling page).
- **Top Header**: Logo góc trái. Link điều hướng mỏng ở giữa (Features, For Parents, Pricing...). Nút CTA góc phải.
- **Hero Section**: 
  - Bên Trái: Cụm Heading khổng lồ, Text mô tả, và 2 nút CTA (Start Free - tím khối, Watch how it works - trắng viền tím). Lời cam kết nhỏ: "No credit card required".
  - Bên Phải: Hình ảnh máy tính bảng (Mockup) hiển thị giao diện Home của Snow, với mascot Snow nhảy ra khỏi màn hình (Hiệu ứng 3D phá vỡ khung).
- **Trust Banner**: Dải logo đối tác / chứng nhận chạy ngang màn hình.
- **Feature Grid**: Lưới bento (3 cột) giới thiệu chức năng (Talk with Snow, Interactive Lessons, Daily Routines...).
- **How it works**: Trình bày theo dạng timeline 3 bước ngang (1, 2, 3) có mũi tên đứt khúc nối nhau.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Không gian (Whitespace) khổng lồ. Khoảng cách giữa các section (Hero -> Trust -> Features) lên tới `120px` hoặc `160px`.
- Kích thước Heading (H1): Siêu lớn, khoảng `56px` hoặc `64px`, `font-black`, `leading-tight`.
- Kích thước Card tính năng: Rộng và thoáng, Padding tối thiểu `p-8`.

## 4. Màu sắc (Color Palette)
- Background Hero: Cả mảng màu Gradient bầu trời (Lavendar -> White) lan tỏa toàn bộ background trên cùng.
- Các Box chức năng có bóng đổ cực mềm (`shadow-xl shadow-snow-primary/5`).
- CTA màu Tím khối nguyên bản của Snow `#8B5CF6` nổi bật nhất trang.

## 5. Hướng dẫn Triển khai (Roadmap)
1. Cần tạo một Layout riêng biệt (Ví dụ: `(public)/layout.tsx`) không chứa thanh Left Nav.
2. Thiết kế hệ thống Heading dùng class Tailwind mở rộng (ví dụ `text-display-lg`).
3. Sử dụng các ảnh Mockup chất lượng cao trong thư mục `public/images/`. Khối Hero bên phải dùng absolute positioning để sắp xếp màn hình iPad, bóng đổ và Mascot bay lơ lửng xung quanh.
