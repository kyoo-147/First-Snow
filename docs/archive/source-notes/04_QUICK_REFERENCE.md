# AgentKid — Quick Reference v2

---

## Tóm tắt 1 trang (in ra để bàn)

```
PROJECT : AgentKid — AI Companion cho trẻ ASD / chậm ngôn ngữ 6-10 tuổi
NHÂN VẬT: Mia — hoạt hình người, tiếng Việt thuần, thân thiện
DOMAIN  : agentkid.io.vn
TEAM    : Solo full-stack (Next.js + Node/Python)
PHASE   : MVP 30 ngày → pilot 5 buổi thực tế

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LUỒNG CHÍNH:
Trẻ nói
  → Google STT (vi-VN) → Text
  → face-api.js (song song) → Emotion
  → Gemini 1.5 Flash + Memory → Response
  → Emergency check → SMS + Zalo + Web Push (nếu cần)
  → Google TTS WaveNet → Mia nói
  → Supabase lưu log → Dashboard realtime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK:
Frontend : Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
DB       : Supabase (PostgreSQL + pgvector + Auth + Realtime)
AI       : Google Cloud (STT vi-VN + TTS WaveNet + Gemini Flash)
Emotion  : face-api.js client-side
Alert    : Twilio SMS + Zalo OA + Web Push
Deploy   : Vercel (sin1) + Supabase + Cloudflare R2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLORS (trẻ em):   #FF6B35 cam / #FFD23F vàng / #06D6A0 mint
COLORS (dashboard): #4F46E5 indigo
FONT: Nunito (Google Fonts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHI PHÍ : ~$22-24/tháng (50 buổi × 15 phút)
LATENCY : Mục tiêu < 2 giây tổng thể
```

---

## Quyết định kiến trúc & Lý do

| Quyết định | Lý do |
|---|---|
| **Mia = hoạt hình người** (không phải robot) | Trẻ ASD phản hồi tốt hơn với khuôn mặt người; dễ học nhận diện cảm xúc |
| **Tiếng Việt thuần** cho AI | Tránh code-switching gây khó hiểu cho trẻ đang học ngôn ngữ |
| **Google Cloud** thay vì OpenAI | STT và TTS tiếng Việt tốt hơn đáng kể; WaveNet tự nhiên hơn |
| **face-api.js client-side** | Không tốn server, privacy (video không rời thiết bị), latency = 0 |
| **Gemini sinh bài học động** | Không hard-code → bài học luôn phù hợp từng trẻ, framework ABA/PECS/SocialStories |
| **Zalo OA** thêm vào Twilio | Phụ huynh VN dùng Zalo nhiều hơn SMS; tăng tỷ lệ nhận alert |
| **pgvector** trong Supabase | Long-term memory mà không cần thêm vector DB riêng |
| **App Router** thay vì Pages Router | Pattern hiện đại hơn, streaming support tốt hơn cho TTS |
| **Dashboard song ngữ** | Hướng tới phụ huynh có thể dùng tiếng Anh; dễ scale quốc tế sau |
| **Không lưu video/audio** | Privacy trẻ em, tiết kiệm storage, giảm rủi ro pháp lý |

---

## Frameworks bài học

### ABA (Applied Behavior Analysis)
- Chia nhỏ kỹ năng thành các bước nhỏ
- Reinforcement dương tính sau mỗi bước đúng
- Lặp lại có hệ thống
- Mia dùng: "Giỏi lắm! Con làm đúng rồi! Giờ thử bước tiếp theo nhé..."

### PECS (Picture Exchange Communication System)
- Giao tiếp bằng từ/hình ảnh đơn giản
- Bắt đầu từ 1 từ → 2 từ → câu ngắn
- Mia dùng: "Con nhìn hình này và nói tên nhé..."

### Social Stories
- Kể chuyện tình huống xã hội thực tế
- Mô tả cảm xúc và hành động phù hợp
- Mia dùng: "Khi bạn Lan muốn chơi cùng, Lan sẽ nói..."

---

## Branching Points sau MVP

| Nếu phát hiện | Thì làm |
|---|---|
| Latency > 2s | Stream TTS sớm hơn, hoặc thử ElevenLabs tiếng Việt |
| Emotion detection không chính xác | Thêm server-side model (Azure Face API) |
| Gemini trả lời không phù hợp trẻ ASD | Fine-tune system prompt, thêm few-shot examples |
| Zalo OA khó setup | Fallback chỉ dùng SMS + Web Push cho MVP |
| Phụ huynh muốn app mobile | React Native Expo (tái dùng hooks và API routes) |
| Muốn gọi vốn | Thêm: analytics, multi-tenant, Stripe billing |
| Cần thêm người | Backend: Python FastAPI dev / Frontend: React dev |

---

## Lưu ý Zalo OA

Zalo OA cần setup trước khi dùng:
1. Tạo Zalo Official Account tại: https://oa.zalo.me
2. Đăng ký Zalo Mini App hoặc dùng Message API
3. **Quan trọng**: User phải follow OA trước, sau đó gửi tin nhắn đầu tiên cho OA → mới nhận được tin từ OA
4. Trong register flow: "Nhắn 'AgentKid' cho Zalo OA @[tên OA] để nhận cảnh báo"
5. ZNS (Zalo Notification Service) cho phép gửi không cần follow — nhưng cần phê duyệt template

---

## Rủi ro cần chú ý

| Rủi ro | Mức độ | Cách xử lý |
|---|---|---|
| iOS Safari WebRTC quirks | Cao | Test sớm ngày 5, có fallback guide |
| face-api.js không nhận diện ánh sáng yếu | Trung bình | Thêm hint "Cần đủ ánh sáng" trong UI |
| Gemini sinh bài học không phù hợp | Cao | Luôn yêu cầu phụ huynh duyệt trước |
| Zalo OA approval chậm | Trung bình | Fallback SMS + Web Push đủ dùng |
| Google Cloud latency từ VN | Thấp | Dùng region asia-southeast1 (Singapore) |
| Trẻ không hợp tác pilot | Trung bình | Test với người lớn đóng vai trước |

---

## Links quan trọng

| Resource | URL |
|---|---|
| Google STT vi-VN docs | https://cloud.google.com/speech-to-text/docs/languages |
| Google TTS vi-VN voices | https://cloud.google.com/text-to-speech/docs/voices |
| Gemini API | https://ai.google.dev/docs |
| face-api.js models | https://github.com/justadudewhohacks/face-api.js/tree/master/weights |
| Supabase pgvector | https://supabase.com/docs/guides/ai/vector-columns |
| Twilio SMS Node | https://www.twilio.com/docs/sms/quickstart/node |
| Zalo OA API | https://developers.zalo.me/docs/api/official-account-api |
| Web Push MDN | https://developer.mozilla.org/en-US/docs/Web/API/Push_API |
| Next.js App Router | https://nextjs.org/docs/app |
| shadcn/ui | https://ui.shadcn.com |
| Recharts | https://recharts.org/en-US |

---

## Checklist Pilot Test

```
Kỹ thuật:
□ Voice pipeline < 2 giây (test 10 lần đo bằng console.log)
□ Emotion detection nhận diện được khi ngồi cách cam 50cm
□ Alert SMS + Zalo đến đúng số trong < 30 giây
□ Session lưu đầy đủ transcript sau khi kết thúc
□ Dashboard hiển thị đúng emotion chart + transcript

UX cho trẻ ASD:
□ Không có text gây overwhelm trên màn hình Mia
□ Mic button đủ lớn (≥80px), màu rõ ràng
□ Mia animation không quá nhanh / giật
□ Âm thanh không quá to / đột ngột
□ Thời gian chờ AI < 2s (trẻ ASD mất kiên nhẫn nhanh)

Thiết bị test:
□ Chrome desktop (Windows/Mac)
□ Chrome Android tablet
□ Safari iPad (test mic permission flow)
□ Kết nối wifi ổn định (không test 4G cho MVP)

Nội dung pilot:
□ Buổi 1-2: người lớn đóng vai trẻ → kiểm tra kỹ thuật
□ Buổi 3-5: trẻ thực tế 6-10 tuổi
□ Ghi chép: thời gian phản hồi, phản ứng trẻ, lỗi phát sinh
□ Phỏng vấn phụ huynh: 3 điều thích / 3 điều muốn cải thiện
```
