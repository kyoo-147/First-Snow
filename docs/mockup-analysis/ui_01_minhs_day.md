# Phân tích UI: ui_1.png - Minh's Day (Parent Dashboard)

## 1. Mục đích & Chức năng
- **Vai trò**: Bảng điều khiển dành riêng cho Phụ huynh. Hiển thị thông tin tổng hợp về một ngày học tập và trạng thái tâm lý của trẻ.
- **Tính năng cốt lõi**:
  - Xem tóm tắt thống kê (Routines Completed, Lessons Practiced, Feelings Check-ins, Total Time).
  - Theo dõi Nhật ký Hoạt động (Today's Activity Timeline).
  - Phân tích xu hướng tâm lý và học tập qua biểu đồ (Learning & Comfort Trends).
  - Thông báo "Những gì Snow quan sát được" (What Snow Noticed).
  - Đề xuất hoạt động tiếp theo (Recommended Next Steps) và mục Quản lý an toàn (Safety & Settings).

## 2. Phân tích Bố cục (Layout)
- **Top Navigation (Header)**: Logo Snow. Text "Minh's Day". Nút "Parent Access" (Trạng thái đang khóa). Dropdown chọn tài khoản phụ huynh (Linh Nguyen) và tài khoản con (Minh).
- **Metric Row (Hàng Thống Kê)**: 4 thẻ số liệu tóm tắt nằm ngang, màu sắc sinh động (Purple, Blue, Aqua, Yellow) kết hợp với các mascot 3D nhỏ minh họa.
- **Main Grid (Bento Grid Bất đối xứng)**:
  - **Cột Trái (Khoảng 35% chiều rộng)**:
    - *Timeline*: Danh sách dọc (List) các mốc thời gian học và cảm xúc (9:05 AM, 9:30 AM...).
    - *Favorite Moment*: Video/hình ảnh khoảnh khắc bé yêu thích nhất trong ngày.
  - **Cột Giữa (Khoảng 35% chiều rộng)**:
    - *Trends Chart*: Biểu đồ Line Chart (Đường) hiển thị 2 line "Learning" và "Comfort" trong tuần. Có thông báo nhận xét nhỏ ở góc dưới.
    - *Recommended Steps*: Danh sách các gợi ý bài tập nhanh để phụ huynh làm cùng con.
  - **Cột Phải (Khoảng 30% chiều rộng)**:
    - *What Snow Noticed*: Danh sách các điểm sáng tích cực (Expressing more feelings, Building learning stamina).
    - *Safety & Settings*: Các nút thao tác (Topics, Screen Time, Voice Access, Parent Controls).

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Thẻ Component (Cards): Bố cục Bento khăng khít hơn so với Home. Khoảng cách (Gap) giảm xuống `16px` hoặc `20px` thay vì `24px`.
- Padding trong Card: Đa phần là `p-5` hoặc `p-6`.
- Bán kính cong (Border-Radius): 
  - Card chính: `16px` (`rounded-2xl`).
  - Nút nhỏ trong danh sách: `8px` (`rounded-lg`).
- Typography: Tiêu đề Thẻ (Card Headers) sử dụng `font-bold` hoặc `font-black` kích cỡ `16px`. Các mô tả rất nhỏ `12px` (`text-xs`).

## 4. Màu sắc (Color Palette)
- **Môi trường**: Không còn bồng bềnh 3D như phần của bé. Nền trang (Background) là màu `bg-snow-ice` trơn hoặc nhạt, tạo cảm giác "App phân tích/Quản trị" (Dashboard-y) nghiêm túc hơn nhưng vẫn giữ tính thẩm mỹ của Snow.
- **Biểu đồ (Chart Colors)**: 
  - Line 1 (Learning): Màu Tím Đậm (`#6D28D9`).
  - Line 2 (Comfort): Màu Xanh Ngọc (`#0D9488`).
- **Thẻ cảnh báo/Thông báo (Alerts)**: Sử dụng tone màu nhạt (Pastel) làm nền `bg-blue-50` kết hợp viền nhẹ để không làm rối mắt người dùng.

## 5. Hướng dẫn Triển khai (Roadmap)
1. **Layout Shell**: Tạo `ParentDashboardLayout` độc lập với luồng `ChildLayout`. KHÔNG dùng `ChildRightRail` ở đây.
2. **Components Cần Xây Dựng**:
  - `StatCard`: Thẻ thống kê nhận prop (title, value, subtitle, imageSrc).
  - `ActivityTimeline`: Component timeline dọc với chấm tròn nối dây (timeline-connector).
  - `LineChartTrend`: Tích hợp thư viện như Recharts hoặc Chart.js nhưng phải tuỳ biến CSS để đường nét (line) mềm, cong (monotone), điểm (dots) to.
  - `ActionList`: Component danh sách cho phần Cài đặt & Đề xuất (có icon chevron-right).
