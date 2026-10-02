# Phân tích UI: ui_3.png - AI Companion (Voice Mode)

## 1. Mục đích & Chức năng
- **Vai trò**: Giao diện tương tác giọng nói chuyên sâu (Hands-free Mode). Giống như màn hình sảnh chờ khi bé trò chuyện với trợ lý ảo bằng miệng, không cần gõ phím.
- **Tính năng cốt lõi**:
  - Mascot biểu cảm khổng lồ đặt ngay giữa trung tâm màn hình, có khả năng thể hiện cảm xúc sinh động khi giao tiếp.
  - Vòng sóng âm/Mic siêu lớn: Nơi kích hoạt/hiển thị hiệu ứng thu âm.
  - Action Chips (Quick Prompts): Các câu hỏi mẫu để bé bắt đầu cuộc trò chuyện.
  - Chức năng Camera / Chia sẻ màn hình (Show Snow).
  - Tích hợp không gian Cảm xúc (Right Rail) tương tự màn hình Talk with Snow.

## 2. Phân tích Bố cục (Layout)
- Không có Top Header phức tạp, nhằm tối đa hóa sự chú ý vào Mascot ở giữa.
- **Trung tâm (Center Stage)**:
  - Khối Mascot Snow chiếm gần 40% màn hình, lơ lửng giữa phông nền tuyết / mây nhẹ nhàng.
  - Text Prompt (Ví dụ: "I'm listening...") nằm ngay dưới chân Mascot.
  - Phía dưới nữa là một dải bong bóng nổi chứa các câu hỏi mồi (Quick Prompts) dạng cuộn ngang.
- **Thanh Công Cụ Nổi (Floating Toolbar)**:
  - Một khối `pill` nằm ở mép dưới màn hình (Bottom Center).
  - Bao gồm nút Camera, nút Mic khổng lồ (Nổi bật nhất), và nút Bàn phím (Chuyển về Chat Mode).
- **Right Rail**: Giữ nguyên `TalkRightRail` (Your Calm Journey, Take a Moment) để duy trì tính nhất quán của hệ thống hỗ trợ tâm lý.

## 3. Căn chỉnh & Tỷ lệ (Spacing & Metrics)
- Tính trung tâm (Centric Alignment): Mọi phần tử ở Main Area đều được căn giữa theo trục Y (`flex flex-col items-center justify-center`).
- Nút Mic: Cực lớn, cỡ `80x80px` (`size-20`), bo góc tròn hoàn hảo, có hiệu ứng đổ bóng đa lớp (multi-layer box-shadow) tạo cảm giác phát sáng.
- Chips (Quick Prompts): Cỡ chữ nhỏ `12px` (`text-xs`), padding hai bên lớn `px-4 py-2`, viền kính (`bg-white/50 border-white`).

## 4. Màu sắc (Color Palette)
- Chế độ này sử dụng tối đa sức mạnh của **Gradient Background**. Không gian phía sau mascot không phải là màu trơn mà là dải màu mô phỏng bầu trời (Tím Lavender ở trên, nhạt dần thành trắng tuyết ở dưới).
- Các nút Floating: Màu trắng trong suốt mờ (Glassmorphism), viền mảnh.
- Nút Mic: Màu Primary đậm (Tím `#8B5CF6`) với hiệu ứng glow bao quanh (Sóng âm).

## 5. Hướng dẫn Triển khai (Roadmap)
1. **Component `VoiceStage`**: Container chính dùng `h-full flex items-center justify-center relative`.
2. **Hiệu ứng Mascot lơ lửng**: Áp dụng animation CSS `animate-bounce` nhẹ hoặc keyframes custom `floating` (dịch chuyển `translate-y` lên xuống biên độ thấp).
3. **Glow Effect (Vòng bắt sóng Mic)**: Sử dụng cấu trúc nhiều thẻ `div` bọc lấy nhau với `rounded-full` và `animate-ping` hoặc `scale` lặp lại vô tận (infinite animation) khi trạng thái `isListening` là true.
4. **Luồng chuyển đổi (Navigation)**: Nút bàn phím trong Floating Toolbar sẽ điều hướng người dùng quay lại đường dẫn `/companion/talk`.
