# Phân tích UI: ui_2.png - Talk with Snow (Chat Mode)

## 1. Mục đích & Chức năng
- **Vai trò**: Không gian nhắn tin, chia sẻ cảm xúc riêng tư, an toàn giữa bé và AI Snow.
- **Tính năng cốt lõi**:
  - Tính năng "Mood Picker" (Bộ chọn Cảm xúc): Chọn một biểu tượng (Happy, Worried, Angry...) để tự động báo trạng thái cho Snow.
  - Khung Chat: Giao diện tin nhắn qua lại dạng bong bóng (Chat bubbles).
  - Gợi ý hành động tức thời: Khi Snow phát hiện tâm lý không ổn định, AI sẽ hiện nút gợi ý (Ví dụ: "Yes, let's try a breathing exercise").
  - Thanh nhập liệu: Mic (Nhập giọng nói) và Bàn phím text.
  - Right Rail (Tính năng hỗ trợ tâm lý): Theo dõi Streak (Your Calm Journey), Giải lao (Take a Moment), và Cứu trợ (Talk to a Grown-up).

## 2. Phân tích Bố cục (Layout)
- **Top Header**: Tiêu đề "Talk with Snow" to rõ, Mascot Snow 3D bay bổng ở mép trên bên phải màn hình.
- **Main Chat Area**:
  - *Phần Đầu*: Bộ 5 nút bấm trạng thái cảm xúc (Happy, Worried, Angry, Excited, Sleepy). Các nút to, dạng hình vuông có icon 3D.
  - *Phần Giữa*: Cửa sổ hiển thị lịch sử trò chuyện.
    - Tin nhắn của bé: Căn lề phải, bong bóng màu trắng viền nhạt.
    - Tin nhắn của Snow: Căn lề trái, bong bóng lớn màu trắng hoặc xám nhạt (`bg-snow-surface`). Kèm các nút Suggestion Actions nằm dưới tin nhắn.
  - *Phần Đáy*: Thanh Input dính liền (Sticky Bar) dạng bo tròn (`rounded-full`), có icon Mic lớn bên trái, thanh điền text ở giữa, và icon Gửi bên phải.
- **Right Rail (TalkRightRail)**:
  - *Your Calm Journey*: Thẻ ghi nhận chuỗi check-in (3 days in a row) kèm biểu tượng thứ (M T W T F S S).
  - *Take a Moment*: Danh sách các nút tác vụ (Breathing Exercise, Calm Story, Gratitude Jar).
  - *Need more help?*: Thẻ hỗ trợ khẩn cấp.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- **Chat Bubbles**: Không phải góc vuông. Bán kính cong cực lớn (`rounded-2xl` hoặc `24px`), riêng góc chỉa về phía người gửi có thể thu hẹp lại thành `rounded-sm` để tạo hình bong bóng thoại.
- **Padding nội bộ Chat**: Bóng thoại sử dụng padding tương đối thoáng (`p-4`), cỡ chữ lớn (`14px` hoặc `16px`, `leading-relaxed`) để trẻ em đọc không bị mỏi mắt.
- **Gap bộ chọn Mood**: `gap-4`. Các thẻ mood hình vuông tỷ lệ 1:1, khoảng `100x120px`.

## 4. Màu sắc (Color Palette)
- **Bộ Mood Colors**:
  - Happy: Vàng nhạt (Yellow pastel) + Text Warning (`#F59E0B`).
  - Worried: Xanh dương nhạt (Blue pastel) + Text Aqua (`#06B6D4`).
  - Angry: Đỏ nhạt (Red pastel) + Text Peach (`#F87171`).
  - Excited: Xanh lá nhạt (Green pastel) + Text Success (`#10B981`).
  - Sleepy: Tím nhạt (Purple pastel) + Text Primary (`#8B5CF6`).
- **Nút Action Suggestion**: Dùng màu Pastel nhẹ kèm viền tương ứng với màu icon (VD: viền xanh lá mờ, viền cam mờ) để mời gọi click.

## 5. Hướng dẫn Triển khai (Roadmap)
1. **Component `MoodPicker`**: Dùng mảng Object quản lý icon, màu viền, màu text. Thêm hiệu ứng `hover:-translate-y-1` và `ring` khi selected.
2. **Component `ChatBubble`**: Phân loại theo `sender === "Minh"` hoặc `sender === "Snow"`. Căn `justify-end` / `justify-start` tương ứng.
3. **Component `ActionSuggestions`**: Nằm chung block của `ChatBubble` khi tin nhắn chứa đề xuất hành động.
4. **Layout**: Khóa chiều cao của khung chat (`h-[calc(100vh-200px)]`) và sử dụng `overflow-y-auto` để cuộn tin nhắn, phần Input luôn dính ở đáy (`sticky bottom-0`).
