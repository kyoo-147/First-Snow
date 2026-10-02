# Phân tích UI: ui_0.png - Home / Dashboard

## 1. Mục đích & Chức năng
- **Vai trò**: Cổng chính (Homepage) khi bé đăng nhập vào ứng dụng Snow. Nơi gợi ý các hoạt động học tập, trò chuyện và nhiệm vụ trong ngày.
- **Tính năng cốt lõi**:
  - Giao tiếp thân thiện ("Hi Minh, what would you like to learn today?").
  - Gợi ý hành động nhanh: Trò chuyện (Talk with Snow), Lịch trình hôm nay (Today's Routine), Học cảm xúc (Feelings & Emotions).
  - Lưới bài học đề xuất ("Recommended for you") và "Explore by subject".
  - Hiển thị tiến trình học (My Progress) và Mẹo trong ngày (Snow's Tip of the Day).

## 2. Phân tích Bố cục (Layout)
- **Left Sidebar (Cột Trái - 240px)**:
  - Header: Logo Snow.
  - Menu (Navigation): Home (Active - bg-snow-lavender), Lessons, AI Tutor, Activities, Library, Progress, Settings.
  - Footer: Thẻ động viên "You're doing great!". Cố định dưới cùng.
- **Top Bar (Thanh trên - Chiều cao ~80px)**:
  - Menu icon ngang: Home, Learn, Explore, Rewards, Create.
  - Nút "Parent Access" hình viên thuốc. Icon chuông (Notifications).
  - Khung Avatar bé (Minh - Level 3) tích hợp dropdown.
- **Main Content (Giữa - Fluid Width)**:
  - **Hero Section**: Lời chào to, mascot Snow 3D góc phải.
  - **Quick Action Row**: 3 thẻ chữ nhật nằm ngang (Talk, Routine, Feelings).
  - **Recommended Section**: Băng chuyền ngang chứa các thẻ bài học vuông.
  - **Subject Section**: Lưới các chủ đề học (English, Math, Story...).
- **Right Rail (Cột Phải - 320px)**:
  - **My Progress Card**: Cột mốc level (Progress bar), 7 days streak, Huy hiệu (Badges).
  - **Need Help Card**: Box màu tím nhạt, gợi ý "Talk to Snow" kèm Mascot trái tim.
  - **Tip Card**: Quote mẹo vặt của Snow.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- **Căn lề (Padding/Margin)**: 
  - Khoảng cách giữa các cột chính (Gap): `24px` (`gap-6`).
  - Khoảng trống bên trong thẻ (Padding): Card lớn dùng `p-6` (24px), Card nhỏ dùng `p-4` (16px).
- **Bo góc (Border Radius)**:
  - Nút bấm (Pill Button): `9999px` (`rounded-full`).
  - Thẻ thông tin (Cards): Rất to, khoảng `24px` (`rounded-3xl`).
- **Typography Scale**:
  - Title Hero: ~`36px`, `font-black`.
  - Section Title: ~`20px`, `font-black` hoặc `font-extrabold`.
  - Body Text: `14px`, `font-semibold`.
  - Muted Text (Thời gian/Thông tin phụ): `12px`, `font-semibold`.

## 4. Màu sắc (Color Palette)
- **Background Màn hình**: Phức hợp Gradient mây và tuyết `bg-gradient-to-b from-[#F4F7FB] to-[#E2E8F0]`, sử dụng hình nền (background image) mây mờ.
- **Thẻ nội dung (Surface)**: `bg-white` với `shadow-sm` hoặc `shadow-md`.
- **Chữ**: Primary Dark `#1E1B4B`, Muted `#64748B`.
- **Thẻ nổi bật**:
  - Tím (Talk with Snow): Gradient `#A78BFA` đến `#8B5CF6`.
  - Xanh dương (Routine): Gradient `#60A5FA` đến `#3B82F6`.
  - Xanh ngọc (Emotions): Gradient `#2DD4BF` đến `#14B8A6`.

## 5. Hướng dẫn Triển khai (Roadmap)
1. **App Shell**: Xây dựng khung 3 cột cố định (Sidebar, Main Content, Right Rail).
2. **Components**:
   - `HeroGreeting`: Component hiển thị lời chào động (dựa theo tên bé và thời gian).
   - `ActionCard`: Component cho 3 thẻ (Talk, Routine, Feelings) có khả năng nhận prop màu nền và icon.
   - `LessonCarousel`: Component trượt ngang.
   - `ProgressRightRail`: Cột phải dành riêng cho Home.
3. **Mô phỏng**: Các icon, avatar nên là tài nguyên hình ảnh 3D thật sự (WebP) thay vì SVG thuần để đạt độ "Premium".
