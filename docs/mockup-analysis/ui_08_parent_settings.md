# Phân tích UI: ui_8.png - Settings (Parent Controls)

## 1. Mục đích & Chức năng
- **Vai trò**: Cấu hình các thiết lập hệ thống, quyền riêng tư, và chế độ an toàn dành riêng cho quyền quản trị của cha mẹ.
- **Tính năng cốt lõi**:
  - Giao diện dạng cấu hình nhiều lớp (Nested menu).
  - Quản lý Child Safe Mode, Bộ lọc nội dung (Content Filters), Khóa ứng dụng (App Lock).
  - Khuyến khích sự an tâm của phụ huynh với các mô tả rõ ràng, không dùng biệt ngữ phức tạp.

## 2. Phân tích Bố cục (Layout)
- Vẫn nằm trong vỏ bọc của Parent Dashboard (Nav trái màu xám nhạt/xanh, không phải kiểu mây bồng bềnh của bé).
- **Sub-navigation (Cột điều hướng phụ)**: Bên phải Left Nav là một cột hẹp chứa các mục thiết lập (Account, Security, Preferences...).
- **Main Settings Panel**: Vùng hiển thị cấu hình chi tiết nằm ở giữa. Mỗi cấu hình là một `SnowCard` có công tắc bật/tắt (Toggle Switch) hoặc Nút chọn.
- **Right Rail**: Giữ nguyên Parent Right Rail (Ví dụ: Trạng thái truy cập - Parent Access, Liên hệ hỗ trợ - Need Help?).

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Các danh sách cài đặt: Thiết kế theo dạng "List Group", các thẻ cài đặt xếp chồng lên nhau với `gap-4`.
- Padding trong các thẻ cài đặt thường là `p-5`. Căn lề chuẩn giữa icon, text, và công tắc toggle là `gap-4` theo chiều ngang.
- Công tắc Toggle: To và rõ ràng. Width khoảng `48px`, Height `24px` hoặc `32px`.

## 4. Màu sắc (Color Palette)
- Gam màu nghiêm túc, thiên về xanh Navy và xám Slate (Slate/Muted).
- Nút Toggle: Khi Bật (On) dùng màu xanh lá Success `#10B981` hoặc Tím Primary `#8B5CF6`. Khi Tắt (Off) dùng màu xám `#CBD5E1`.
- Cảnh báo (Nút xóa, reset): Màu Đỏ đào (Peach) `#F87171` để gây sự chú ý.

## 5. Hướng dẫn Triển khai (Roadmap)
1. **Component `SettingItem`**: Chứa Title, Subtitle, và một slot cho bộ điều khiển bên phải (Toggle, Button, hoặc Select).
2. Tái cấu trúc Layout: Cho màn hình này, layout thực tế chia làm 4 cột (Left Nav > Settings Nav > Main Form > Right Rail). Việc dùng Grid template 4 cột sẽ giúp giao diện responsive dễ hơn.
