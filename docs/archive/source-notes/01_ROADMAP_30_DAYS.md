# AgentKid — Lộ trình 30 Ngày (v2)

> Solo developer · Cả ngày liên tục · GitHub · TypeScript + Next.js App Router

---

## Tổng quan 4 Giai đoạn

| Phase | Ngày | Mục tiêu chính | Deliverable |
|---|---|---|---|
| **Phase 1** — Foundation | 1–5 | Môi trường, Auth, DB, UI shell | App chạy được, login/register OK |
| **Phase 2** — Voice Core | 6–12 | Luồng Voice hoàn chỉnh + Memory | Mia nói chuyện được tiếng Việt |
| **Phase 3** — Vision + Lessons + Dashboard | 13–22 | Emotion AI, bài học động, báo cáo | Buổi học đầy đủ tính năng |
| **Phase 4** — Safety + Polish + Deploy | 23–30 | Alert, tối ưu, pilot test | 5 buổi thực tế với trẻ |

---

## PHASE 1 — Foundation (Ngày 1–5)

### Ngày 1 — Setup & Init
```
□ Init Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui)
□ Cài dependencies: @supabase/supabase-js, @supabase/ssr,
  @google-cloud/speech, @google-cloud/text-to-speech,
  @google/generative-ai, face-api.js, recharts, twilio, next-i18next
□ Setup .env.local (tất cả API keys)
□ Push lên GitHub → kết nối Vercel (auto-deploy)
□ Tạo Supabase project → enable pgvector extension
□ Test Google Cloud credentials (STT + TTS + Gemini)

Deliverable: URL Vercel trả về "AgentKid is live" ✓
```

### Ngày 2 — Database Schema
```
□ Chạy SQL schema trong Supabase (xem TECH_SPEC.md)
□ Enable RLS + setup policies
□ Tạo function match_memories() cho pgvector
□ Enable Supabase Realtime cho bảng emotion_events, alerts
□ Tạo types/index.ts (TypeScript interfaces)
□ Tạo lib/supabase.ts (client + server)
□ Tạo lib/supabase-helpers.ts (CRUD functions)

Deliverable: Schema hoàn chỉnh, query test OK ✓
```

### Ngày 3 — Auth & Child Profiles
```
□ app/(auth)/register/page.tsx
  - Fields: Tên, Email, Mật khẩu, Số điện thoại, Zalo ID
  - Supabase signUp → redirect /dashboard
□ app/(auth)/login/page.tsx
  - Supabase signInWithPassword
□ middleware.ts bảo vệ /dashboard/*, /session/*
□ app/(dashboard)/children/page.tsx
  - List hồ sơ trẻ (card layout)
  - Form tạo/sửa hồ sơ: tên, ngày sinh, tình trạng, nickname
□ Chọn avatar Mia (3 skin variants: default/pink/blue)

Deliverable: Đăng ký → tạo hồ sơ trẻ → dashboard ✓
```

### Ngày 4 — UI Shell màn hình Mia
```
□ app/session/[childId]/page.tsx (full-screen)
□ components/session/MiaAvatar.tsx
  - SVG nhân vật hoạt hình người, dễ thương
  - 5 states: idle (nhấp nháy mắt) / thinking (dots) /
    speaking (miệng sync) / happy (jump) / concerned (cúi đầu)
□ components/session/MicButton.tsx
  - Nút tròn to (80px), màu cam #FF6B35
  - States: ready (xanh mint) / recording (đỏ) / disabled (xám)
□ Subtitles text nhỏ dưới Mia
□ Video preview webcam góc trên phải (80x80, border-radius tròn)
□ Consent modal: "Mia cần dùng mic và camera"
□ Design: background gradient cam-vàng nhạt, font Nunito

Deliverable: UI tĩnh màn hình Mia đẹp, đúng brand ✓
```

### Ngày 5 — WebRTC Hooks
```
□ hooks/useMicrophone.ts
  - requestPermission, startRecording, stopRecording
  - Auto-stop sau 10 giây
  - VAD: dừng sau 1.5 giây im lặng
  - Output: Blob (audio/webm;codecs=opus)
□ hooks/useCamera.ts
  - requestPermission, stream ref
  - Handle denied gracefully
□ Test: ghi âm → play lại được trên Chrome + Edge
□ Handle iOS Safari quirks (getUserMedia restrictions)

Deliverable: Thu âm + camera OK trên Chrome desktop ✓
```

---

## PHASE 2 — Voice Core (Ngày 6–12)

### Ngày 6 — Google STT
```
□ lib/google-stt.ts → transcribeAudio(buffer): Promise<string>
□ app/api/stt/route.ts
  - POST, nhận FormData audio blob
  - Google STT v1: languageCode: 'vi-VN', model: 'latest_long'
  - enableAutomaticPunctuation: true
  - Return: { transcript, confidence }
□ Test với nhiều giọng, nhiều accent tiếng Việt
□ Handle: audio quá ngắn / không nghe rõ / API error

Deliverable: Nói tiếng Việt → nhận text chính xác ✓
```

### Ngày 7 — Gemini LLM + System Prompt Mia
```
□ lib/prompts.ts → buildSystemPrompt(child, memories): string
  Tiếng Việt thuần, Mia là nhân vật hoạt hình người thân thiện
  Câu ngắn ≤ 2 câu, phù hợp trẻ ASD 6-10 tuổi
  Khen ngợi thường xuyên, không phán xét
□ lib/gemini.ts → generateResponse(system, history, message)
□ app/api/chat/route.ts
  - POST: { sessionId, childId, message, emotion }
  - Lấy 10 messages gần nhất (short-term memory)
  - Lấy top-5 memories (long-term)
  - Gọi Gemini 1.5 Flash
  - Lưu message user + assistant vào DB
  - Return: { response, intent }

Deliverable: Gửi text → nhận phản hồi phù hợp từ Mia ✓
```

### Ngày 8 — Google TTS + Audio Streaming
```
□ lib/google-tts.ts → synthesizeSpeech(text): Promise<Buffer>
□ app/api/tts/route.ts
  - POST: { text }
  - Google TTS WaveNet: vi-VN-Wavenet-A
  - speakingRate: 0.85, pitch: +2.0
  - Streaming response (chunks) để giảm latency
□ Frontend: nhận stream → play từ chunk đầu tiên
□ Mia animation sync với audio (detect audio playing)

Deliverable: Mia nói tiếng Việt tự nhiên, streaming ✓
```

### Ngày 9 — Voice Pipeline End-to-End
```
□ hooks/useVoicePipeline.ts
  - Orchestrate: Record → STT → Gemini → TTS → Play
  - Song song: STT + emotion detection
  - States: idle / listening / thinking / speaking
  - Tắt mic khi Mia đang nói (prevent echo)
□ Đo latency: mục tiêu tổng < 2 giây
□ Loading state: Mia "thinking" animation
□ Kết nối với màn hình session

Deliverable: Hội thoại voice 2 chiều hoàn chỉnh < 2s ✓
```

### Ngày 10 — Session Management
```
□ Tạo session khi bắt đầu, kết thúc khi nhấn Stop
□ Lưu mỗi message realtime vào Supabase
□ hooks/useSession.ts: quản lý session state
□ Short-term memory: inject 10 messages gần nhất vào context
□ Auto-save khi mất mạng (queue + retry)

Deliverable: Lịch sử hội thoại lưu đầy đủ ✓
```

### Ngày 11 — Long-term Memory (pgvector)
```
□ lib/memory.ts
  - extractMemories(transcript): gọi Gemini extract 3-5 facts
    ("Bé thích khủng long", "Tên bạn thân là Minh")
  - saveMemories(childId, memories[]): embed + lưu pgvector
  - recallMemories(childId, message): query top-5 relevant
□ Trigger extractMemories sau khi session kết thúc (async)
□ Inject memories vào system prompt: "Mia biết con thích..."
□ Dùng Google text-embedding-004 (768 dimensions)

Deliverable: Mia nhớ thông tin từ buổi trước ✓
```

### Ngày 12 — Stability & Error Handling
```
□ Retry logic cho STT/TTS/Gemini (max 2 retries)
□ Offline banner: "Mất kết nối, đang thử lại..."
□ Mic/camera denied: hướng dẫn bật lại (tiếng Việt)
□ Fallback khi STT không nghe rõ: "Mia chưa nghe rõ, con nói lại nhé?"
□ Error boundary: không crash app khi lỗi API
□ Test: 30 phút session liên tục không crash

Deliverable: Voice pipeline ổn định qua 30 phút ✓
```

---

## PHASE 3 — Vision + Lessons + Dashboard (Ngày 13–22)

### Ngày 13–14 — Emotion Detection
```
□ Download face-api.js models → public/models/
  (tiny_face_detector + face_expression_net)
□ hooks/useEmotionDetection.ts
  - Phân tích mỗi 2 giây
  - Map → 6 emotions: happy/sad/angry/fearful/surprised/neutral
  - emotionRef (sync với voice pipeline)
□ components/session/EmotionIndicator.tsx
  - Emoji nhỏ góc màn hình: 😊😢😠😨😲😐
  - Fade in/out khi thay đổi
□ Lưu emotion_events vào Supabase realtime
□ Truyền emotion vào Gemini context

Deliverable: Mia biết và phản ứng theo cảm xúc trẻ ✓
```

### Ngày 15–17 — Lesson Engine (AI-Generated)
```
□ lib/lesson-engine.ts
  - generateLesson(child, framework, category): gọi Gemini
    sinh bài học JSON động theo framework ABA/PECS/Social Stories
  - processResponse(node, userText, emotion): điều hướng nhánh
  - selectNextNode(choices, userText): NLU matching

□ Lesson node schema (JSONB):
  { id, type, text, choices[], defaultNextId, emotionTrigger,
    difficultyAdjust, imagePrompt? }

□ app/api/lessons/generate/route.ts
  - POST: { childId, framework, category }
  - Gemini sinh 5-7 nodes phù hợp trẻ
  - Lưu vào DB với status: 'suggested'

□ 3 framework prompts cho Gemini:
  - ABA: reinforcement, discrete trials, shaping
  - PECS: picture exchange, communication symbols
  - Social Stories: narrative, social situations

□ Tích hợp lesson vào voice pipeline

Deliverable: Gemini sinh được bài học cho 3 chủ đề ✓
```

### Ngày 18 — Phụ huynh duyệt bài học
```
□ app/(dashboard)/lessons/page.tsx
  - Tab "AI Gợi ý" (status: suggested)
  - Tab "Đã duyệt" (status: approved)
  - Tab "Thư viện" (all lessons của trẻ)
□ Card bài học: tên, framework badge, chủ đề, độ khó, preview
□ Approve → status: approved (trẻ có thể học)
□ Reject → status: rejected
□ Phụ huynh trigger generate bài mới

Deliverable: Flow duyệt bài học hoàn chỉnh ✓
```

### Ngày 19–20 — Parent Dashboard (Song ngữ)
```
□ i18n setup: next-i18next, locale: vi + en
□ Language toggle trong header dashboard

□ /dashboard → Overview
  - Stats cards: tổng buổi, tổng thời gian, streak
  - Danh sách trẻ → Start session button
  - Recent alerts badge (nếu có)

□ /dashboard/sessions → Lịch sử
  - Table: Ngày, Tên trẻ, Bài học, Thời gian, Điểm, Mood chủ đạo
  - Filter theo trẻ, ngày

□ /dashboard/sessions/[id] → Chi tiết
  - Emotion Timeline: LineChart (Recharts)
    Màu: happy=#06D6A0 / sad=#4F46E5 / angry=#EF4444
         fearful=#8B5CF6 / neutral=#9CA3AF
  - Transcript: chat bubbles
    Trẻ: bên phải, cam nhạt
    Mia: bên trái, xanh mint nhạt
  - AI Notes: Gemini phân tích ngắn

□ /dashboard/progress → Xu hướng
  - Biểu đồ theo tuần: emotion trend + score trend

Deliverable: Dashboard đầy đủ, song ngữ ✓
```

### Ngày 21 — Daily Routines
```
□ Phụ huynh cấu hình routines: tên + giờ nhắc
  (VD: "Đánh răng" 7:00, "Đi ngủ" 21:00)
□ Mia mở đầu buổi bằng routine check:
  "Hôm nay Mia hỏi thăm con: sáng nay con đã đánh răng chưa?"
□ Lưu routine completion history
□ Hiển thị streak trong dashboard

Deliverable: Routine checklist tích hợp vào session ✓
```

### Ngày 22 — Progress Tracker
```
□ Sau mỗi session: Gemini phân tích → score 1-10 + gợi ý
□ Lưu score + ai_notes vào bảng sessions
□ Badge milestones: 1 buổi / 5 buổi / 10 buổi / 30 ngày
□ Hiển thị badge + confetti animation khi đạt mốc
□ Gợi ý cho phụ huynh: "Tuần này con tiến bộ về..."

Deliverable: Progress tracking tự động ✓
```

---

## PHASE 4 — Safety + Polish + Deploy (Ngày 23–30)

### Ngày 23 — Emergency Alert (3 kênh)
```
□ lib/alert-system.ts
  DANGER_KEYWORDS_VI = ['cứu', 'đau', 'sợ quá', 'không muốn',
    'ghét', 'đánh', 'bỏ đi', 'khóc', 'đau bụng', 'ngã']
  Trigger levels:
    WARNING: 1 keyword → Web Push
    CRITICAL: fearful > 0.8 liên tục 10s hoặc 2+ keywords → SMS + Zalo + Push

□ Twilio SMS: gửi đến phone phụ huynh
□ Zalo OA API: gửi ZNS message đến Zalo ID
□ Web Push: browser notification realtime

□ app/api/alert/route.ts
□ /dashboard/alerts → list alerts, mark acknowledged

Deliverable: Alert bắn đúng 3 kênh khi test ✓
```

### Ngày 24 — Consent & Privacy
```
□ Consent modal đầy đủ (tiếng Việt + Anh):
  "AgentKid thu thập: giọng nói (chuyển thành text), 
   dữ liệu cảm xúc số (không lưu hình ảnh)"
□ Phụ huynh tick xác nhận 1 lần/tài khoản
□ Settings: nút "Xóa toàn bộ dữ liệu của con"
□ Disclaimer: "Không thay thế trị liệu chuyên nghiệp"

Deliverable: Consent flow pháp lý cơ bản ✓
```

### Ngày 25 — Performance Optimization
```
□ Đo latency từng bước: STT / Gemini / TTS
□ TTS streaming: play từ byte đầu tiên
□ Preload face-api.js models khi load /session
□ Gemini: giới hạn system prompt < 1500 tokens
□ Lazy load Recharts trên dashboard
□ Test trên tablet Android (màn hình trẻ hay dùng)
□ Mục tiêu: tổng latency < 2 giây (đo 10 lần)

Deliverable: Latency đo được < 2 giây ✓
```

### Ngày 26 — Bug Bash
```
□ Crash khi mất mạng giữa session
□ Mic không bắt được trên iOS Safari
□ face-api không nhận diện khi ánh sáng yếu
□ Auth token hết hạn giữa session (auto-refresh)
□ Zalo OA API lỗi (fallback sang SMS)
□ i18n missing translation keys
□ Responsive trên iPad (1024px)

Deliverable: 0 crash trong 1 giờ test liên tục ✓
```

### Ngày 27 — Seed Data & Demo Setup
```
□ Không seed bài học cứng — Gemini sinh động
□ Tạo tài khoản demo: demo@agentkid.vn / Demo@2024
□ Tạo 2 hồ sơ trẻ mẫu với lịch sử 3 buổi mỗi người
□ Viết hướng dẫn sử dụng cho phụ huynh (1 trang PDF)
  - Cần: Chrome/Edge, webcam, mic, kết nối internet ổn định
□ Checklist thiết bị test

Deliverable: Môi trường sẵn sàng pilot ✓
```

### Ngày 28–29 — Pilot Test
```
□ Buổi 1-2: Người lớn đóng vai trẻ (internal test)
  - Kiểm tra latency thực tế
  - Kiểm tra emotion detection
  - Kiểm tra bài học AI sinh ra có phù hợp không

□ Buổi 3-5: Trẻ thực tế (gia đình / quen biết)
  - Ghi video phản ứng trẻ
  - Phỏng vấn phụ huynh 5 phút sau buổi
  - Fix hot-fix ngay trong ngày

Deliverable: 5 buổi pilot hoàn thành, có ghi chép ✓
```

### Ngày 30 — Tổng kết
```
□ Tổng hợp feedback 5 buổi pilot
□ Đo metrics: latency TB, emotion accuracy %, user satisfaction
□ Backlog v1.1: bug còn lại + tính năng phụ huynh yêu cầu
□ Quyết định bước tiếp: solo hay cần thêm người?
□ Draft plan tháng 2

Deliverable: Báo cáo pilot + Roadmap v1.1 ✓
```

---

## Daily Checklist

Mỗi ngày trước khi kết thúc:
```
□ git commit -m "Day X: [mô tả ngắn gọn]"
□ git push origin main → Vercel deploy OK
□ Ghi note: làm gì / gặp gì / ngày mai làm gì
□ Test feature vừa làm trên browser thật (không chỉ localhost)
```
