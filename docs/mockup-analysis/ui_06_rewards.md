# Phân tích UI: ui_6.png - Rewards

## 1. Mục đích & Chức năng
- **Vai trò**: Củng cố tâm lý và tạo động lực học tập (Gamification) bằng cách tôn vinh thành tích của bé.
- **Tính năng cốt lõi**:
  - Trưng bày cấp độ hiện tại (Level 3 Little Learner).
  - Vòng tiến độ (Progress Ring) đo lượng XP đạt được.
  - Tủ kính chứa huy hiệu (Badges: Super Speller, Kind Friend...).
  - Bản đồ thành tích (Achievement Map) nối các trạm điểm (Nodes).

## 2. Phân tích Bố cục (Layout)
- **Top Section (Hero Reward)**: Khu vực trung tâm vinh danh cấp độ hiện tại. Mascot cầm cúp vàng. Một vòng tròn (Radial Progress) khổng lồ hiển thị `%` hoàn thành.
- **Middle Section (Badges Grid)**: Danh sách cuộn ngang hoặc lưới các huy hiệu bé đã thu thập. Mỗi huy hiệu đều có icon lấp lánh (Sparkles) và khung viền lục giác hoặc tròn.
- **Bottom Section (Achievement Map)**: Một đường kẻ uốn lượn nối qua các điểm mốc (Nodes) mang biểu tượng hình sao hoặc ổ khóa (Chưa mở).
- Cột trái và Cột phải vẫn giữ nguyên khung navigation.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Các thành phần huy hiệu cần được đặt ở chính giữa (`place-items-center`) với khoảng cách đều đặn.
- Đường line của bản đồ (Map Line): Dày cỡ `8px`, màu xám đục nếu chưa đạt, và sáng rực màu Vàng/Primary nếu đã hoàn thành.
- Kích thước Badge: Thường từ `64x64px` đến `80x80px` để dễ bấm và nhìn cho trẻ em.

## 4. Màu sắc (Color Palette)
- Chi phối bởi sắc **Vàng (Gold/Warning)** và **Bạch kim (Silver)** tượng trưng cho phần thưởng.
- Mã màu Vàng Vàng Kim: `#FBBF24` đến `#F59E0B`. Có đổ bóng glow `shadow-[0_0_15px_rgba(245,158,11,0.5)]` để làm huy hiệu "phát sáng".
- Nền khu vực thành tích: Thường dùng gradient tông tối (Midnight Blue hoặc Deep Purple) để làm nổi bật sự chói sáng của cúp vàng và huy hiệu, tuy nhiên theo chuẩn Snow thì dùng nền trắng tuyết nhưng hộp thẻ sẽ dùng nền bóng xám (Glass).

## 5. Hướng dẫn Triển khai (Roadmap)
1. **`CircularProgress`**: Component custom sử dụng SVG vòng tròn, tính toán `stroke-dashoffset` bằng công thức XP hiện tại / XP tổng.
2. **`BadgeItem`**: Component render hình lục giác hoặc khung khen thưởng, hỗ trợ trạng thái `locked` (ám xám/trắng đen) và `unlocked` (đầy đủ màu + glow).
3. **`AchievementTimeline`**: Dùng CSS flex-box ngang, kết nối các Node bằng các thanh div line `h-2 w-16 bg-snow-warning`. Đứa trẻ sẽ nhìn thấy tiến trình đi thẳng từ trái sang phải.
