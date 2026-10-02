# SNOW UI: MASTER DESIGN SYSTEM
*Quy chuẩn thiết kế được trích xuất từ việc tổng hợp 11 template UI cốt lõi.*

## 1. MỤC TIÊU (DESIGN PHILOSOPHY)
Snow là một ứng dụng "Daily Balanced" dành cho trẻ em và phụ huynh. Thiết kế hướng tới 3 yếu tố:
- **Gentle (Dịu nhẹ)**: Không sặc sỡ, không gây căng thẳng thị giác (Tránh màu Neon, màu Đen tuyền).
- **Spacious (Rộng rãi)**: Bố cục cực kì thoáng, chữ to, dễ đọc, nút bấm lớn.
- **Premium (Cao cấp)**: Bóng đổ siêu mềm (soft shadow), các thành phần uốn lượn (squircle/rounded), animation mượt.

## 2. TOKENS & MÀU SẮC (COLOR TOKENS)
Đây là các biến CSS/Tailwind tuyệt đối phải tuân thủ để không làm vỡ tone màu App:

| Tên | Giá trị (Màu) | Tailwind Class | Ứng dụng |
|---|---|---|---|
| **Primary** | `#8B5CF6` (Tím nhạt) | `bg-snow-primary` | Nút bấm chính, Icon nổi bật, Mascot highlight |
| **Primary Dark**| `#1E1B4B` (Xanh tím than)| `text-snow-primary-dark` | Tiêu đề chính, Đoạn văn quan trọng (THAY THẾ #000000) |
| **Canvas** | Gradient `#F4F7FB` -> `#E2E8F0` | `bg-snow-ice` hoặc Gradient | Nền của màn hình chính |
| **Surface** | `#FFFFFF` (Trắng) | `bg-white` | Màu nền của các Thẻ (Card) chứa nội dung |
| **Muted** | `#64748B` (Xám ánh xanh) | `text-snow-muted` | Thời gian, Chú thích, Phụ đề |
| **Warning** | `#F59E0B` (Vàng Gold) | `text-snow-warning` | Sao, Điểm số, Streak, Cúp, Huy hiệu |
| **Success** | `#10B981` (Xanh lá) | `text-snow-success` | Trạng thái tích cực, Hoàn thành, Sleepy/Relax |
| **Peach** | `#F87171` (Đỏ cam) | `text-snow-peach` | Tương tác khẩn, Angry mood |
| **Aqua** | `#06B6D4` (Xanh ngọc) | `bg-snow-aqua` | Môn học Toán, Worried mood |

## 3. TOKENS & KÍCH THƯỚC (SPACING & SIZING)
- **Grid Layout**: Sử dụng Gap lớn. Tối thiểu `gap-4` (16px) cho thẻ con, chuẩn là `gap-6` (24px) cho Layout.
- **Bán kính viền (Border Radius)**:
  - Elements nhỏ / Input: `rounded-lg` (8px)
  - Cards tiêu chuẩn: `rounded-2xl` (16px)
  - Cards lớn (Hero / Featured): `rounded-3xl` (24px)
  - Nút bấm (Pill Buttons): `rounded-full` (999px) - KHÔNG DÙNG NÚT VUÔNG GÓC.
- **Bóng đổ (Shadows)**:
  - Sử dụng bóng siêu nhạt, lan tỏa rộng: `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` hoặc `shadow-sm` mặc định của Tailwind mở rộng.
  - Cấm dùng bóng gắt (`shadow-solid`) trừ khi theo style Brutalism (KHÔNG dùng cho Snow).

## 4. TYPOGRAPHY (CHỮ & FONT)
- Mọi Heading (Từ H1 đến H3) phải sử dụng weight `font-black` hoặc `font-extrabold`. Font chữ lý tưởng là Nunito hoặc Quicksand.
- Kích thước chuẩn:
  - Hero Display: `text-5xl` hoặc `text-6xl`
  - Page Title: `text-4xl`
  - Card Title: `text-xl` hoặc `text-2xl`
  - Body Text: `text-sm` hoặc `text-base` với `font-semibold`. Line-height nới lỏng `leading-relaxed`.

## 5. UI COMPONENTS CHUẨN
1. **SnowCard**: Thẻ trắng `bg-white`, bo góc `rounded-[var(--radius-xl)]`, có `shadow-sm`, padding luôn là `p-5` hoặc `p-6`. Khi hover có hiệu ứng nhấc lên `hover:-translate-y-1`.
2. **PillButton**: Nút gọi hành động (CTA). Text `font-bold`, icon đặt bên cạnh text (size-4 hoặc size-5).
3. **Mascot Image**: Hình ảnh Snow (Cú, Cáo, Gấu tuyết) phải được cho overflow vươn ra khỏi box (bằng cách dùng absolute position), có drop-shadow để tạo chiều sâu 3D.

---
*(Tài liệu này được trích xuất chuẩn hóa từ 16 Mockup của dự án Snow. Mọi UI/UX Engineer phải coi đây là Nguồn Chân lý - Single Source of Truth).*
