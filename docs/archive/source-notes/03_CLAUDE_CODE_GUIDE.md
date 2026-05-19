# AgentKid — Claude Code Guide v2

> Copy từng prompt theo đúng thứ tự. Mỗi prompt = 1 task trong ngày.

---

## Cách dùng file này

1. Mỗi sáng: mở `01_ROADMAP_30_DAYS.md` → xem task ngày hôm đó
2. Mở file này → tìm prompt tương ứng → copy vào Claude Code
3. **Luôn bắt đầu session Claude Code bằng đoạn context này:**

```
Dự án: AgentKid — AI Companion cho trẻ ASD/chậm ngôn ngữ (6-10 tuổi)
Nhân vật AI: Mia (hoạt hình người, tiếng Việt thuần)
Stack: Next.js 14 App Router + TypeScript + Supabase + Google Cloud (STT/TTS/Gemini)
Alert: Twilio SMS + Zalo OA + Web Push
Hôm nay làm: [tên task]
```

---

## PHASE 1 — Foundation

### Prompt 1.1 — Init Project
```
Khởi tạo dự án AgentKid với stack sau:
- Next.js 14 App Router, TypeScript strict mode
- Tailwind CSS + shadcn/ui (cài sẵn: button, card, dialog, input, label, badge, tabs, sheet)
- Font: Nunito từ Google Fonts (thêm vào layout.tsx)

Cài dependencies:
@supabase/supabase-js @supabase/ssr
@google-cloud/speech @google-cloud/text-to-speech @google/generative-ai
face-api.js recharts twilio next-i18next
web-push

Tạo:
1. .env.local với placeholder cho tất cả keys (xem TECH_SPEC.md section 2)
2. middleware.ts: bảo vệ /dashboard/* và /session/* (redirect /login nếu chưa auth)
3. lib/supabase.ts: createBrowserClient và createServerClient
4. vercel.json với config region singapore và maxDuration (xem TECH_SPEC.md section 10)
5. Trang app/page.tsx đơn giản: "AgentKid — Coming Soon" với gradient cam-vàng

Push lên GitHub và confirm Vercel deploy OK.
```

### Prompt 1.2 — Database
```
Tạo database schema cho AgentKid trong Supabase.

Chạy SQL này (copy từ TECH_SPEC.md section 3): [paste SQL]

Sau đó tạo:
1. types/index.ts: TypeScript interfaces cho User, Child, Session, Message,
   EmotionEvent, Lesson, Memory, Alert (đúng theo schema)

2. lib/supabase-helpers.ts với các functions:
   - getChildren(userId: string): Promise<Child[]>
   - createChild(userId: string, data: Partial<Child>): Promise<Child>
   - createSession(childId: string): Promise<Session>
   - addMessage(sessionId: string, role: 'user'|'assistant', content: string)
   - addEmotionEvent(sessionId: string, emotion: string, confidence: number)
   - endSession(sessionId: string): Promise<void>
   - getSessionDetail(sessionId: string): Promise<SessionDetail>
   - getUserByAuthId(authId: string): Promise<User>
```

### Prompt 1.3 — Auth Pages
```
Tạo trang Auth cho AgentKid.

Design: font Nunito, gradient nền cam-vàng nhạt (#FFF9F0), card trắng bo góc

1. app/(auth)/register/page.tsx
   Fields: Tên phụ huynh, Email, Mật khẩu, Số điện thoại (placeholder: 0901234567),
           Zalo ID (placeholder: Nhập số điện thoại Zalo, optional)
   - Supabase signUp → tạo record trong bảng users → redirect /dashboard/children
   - Validation: email format, password min 8 chars

2. app/(auth)/login/page.tsx
   - Supabase signInWithPassword → redirect /dashboard
   - Link "Quên mật khẩu?" (placeholder, chưa cần implement)

3. Shared AuthLayout: logo "Mia 🌟 AgentKid" + tagline "Người bạn đồng hành của bé"

Màu button chính: #FF6B35 (cam ấm)
```

### Prompt 1.4 — Child Profiles
```
Tạo trang quản lý hồ sơ trẻ cho AgentKid.

1. app/(dashboard)/children/page.tsx
   - Fetch children từ Supabase theo user đang login
   - Grid 3 cột (responsive) — mỗi card:
     * Avatar Mia variant (3 màu: default=tím, pink=hồng, blue=xanh)
     * Tên bé (font Nunito bold, lớn)
     * Tuổi tính từ dob
     * Badge tình trạng: ASD / Chậm ngôn ngữ / Cả hai
     * Nút "Bắt đầu học" (cam) → /session/[childId]
     * Nút "Chỉnh sửa" (ghost)
   - Nút "Thêm hồ sơ mới" (floating hoặc top-right)

2. Component ChildForm (modal):
   - Tên bé (required)
   - Ngày sinh (date picker)
   - Tình trạng: radio 3 options
   - Nickname (optional)
   - Chọn avatar variant: 3 ô màu click-to-select
   - Submit → createChild() → refresh list
```

### Prompt 1.5 — Mia Session UI
```
Tạo màn hình session cho trẻ — full-screen, không navigation, chỉ dùng icon.

app/session/[childId]/page.tsx + các components:

Design:
- Background: radial gradient từ #FFD23F (vàng) → #FF6B35 (cam) nhạt
- Font: Nunito
- Không có text navigation, tất cả bằng icon

components/session/MiaAvatar.tsx:
- SVG nhân vật hoạt hình người dễ thương (~200px)
  Gồm: đầu tròn, tóc ngắn, mắt lớn có highlight, má hồng, miệng cười
  Màu áo: #4F46E5 (indigo)
- 5 CSS animation states (dùng Tailwind animate):
  * idle: mắt nhấp nháy nhẹ mỗi 3s
  * thinking: lắc đầu nhẹ
  * speaking: miệng mở đóng (scale Y)
  * happy: nhảy lên nhẹ
  * concerned: cúi đầu nhẹ

components/session/MicButton.tsx:
- Circle button 80px
- ready: #06D6A0 (mint) + icon mic
- recording: #EF4444 (đỏ) + pulse animation
- disabled: #9CA3AF (xám)

Layout màn hình:
- Top-left: icon ← nhỏ (về dashboard) + tên bé
- Top-right: webcam preview 80x80 tròn
- Center: MiaAvatar
- Center-bottom: Subtitles text (tối đa 2 dòng)
- Bottom: MicButton

Consent modal khi vào lần đầu:
"Mia cần dùng mic 🎤 và camera 📷 để nói chuyện với con"
[Đồng ý] button cam
```

---

## PHASE 2 — Voice Core

### Prompt 2.1 — STT API
```
Tạo Google Speech-to-Text API route cho AgentKid (tiếng Việt).

lib/google-stt.ts:
- Khởi tạo Google STT client từ GOOGLE_APPLICATION_CREDENTIALS_JSON
- transcribeAudio(audioBuffer: Buffer): Promise<{transcript: string, confidence: number}>
  Config: languageCode: 'vi-VN', model: 'latest_long', enableAutomaticPunctuation: true

app/api/stt/route.ts:
- POST, nhận FormData với field "audio" (Blob)
- Convert Blob → Buffer
- Gọi transcribeAudio()
- Return: { transcript, confidence }
- Error cases: audio quá ngắn (<0.5s), STT confidence < 0.3, API error

Test với đoạn audio tiếng Việt ngắn trước khi tiếp tục.
```

### Prompt 2.2 — Gemini Chat API
```
Tạo Gemini LLM API route cho AgentKid.

lib/gemini.ts:
- Khởi tạo Gemini 1.5 Flash client
- generateResponse(params: {
    systemPrompt: string,
    history: {role: string, content: string}[],
    userMessage: string,
    emotion?: string
  }): Promise<{response: string, emergencyFlag: boolean}>
- Detect emergency flag từ response (nếu Gemini trả về flag)

lib/prompts.ts:
- buildSystemPrompt(child: Child, memories: Memory[]): string
  [Dùng đúng system prompt từ TECH_SPEC.md section 4 — tiếng Việt thuần]

app/api/chat/route.ts:
- POST: { sessionId, childId, message, emotion?, emotionConfidence? }
- Lấy child info từ Supabase
- Lấy 10 messages gần nhất (short-term memory)
- Lấy top-5 memories qua recallMemories() (nếu có)
- Build system prompt
- Gọi generateResponse()
- Lưu message user + assistant vào DB (async, không block response)
- Return: { response, emergencyFlag }
```

### Prompt 2.3 — TTS Streaming
```
Tạo Google TTS API route với streaming cho AgentKid.

lib/google-tts.ts:
- synthesizeSpeech(text: string): Promise<Buffer>
  Voice: vi-VN-Wavenet-A, speakingRate: 0.85, pitch: +2.0
  AudioEncoding: MP3

app/api/tts/route.ts:
- POST: { text: string }
- Gọi synthesizeSpeech()
- Return: streaming Response với Content-Type: audio/mpeg
- Bắt đầu stream ngay khi có data đầu tiên (không đợi full buffer)

Frontend (trong useVoicePipeline):
- Nhận stream response
- Tạo AudioContext + decode từng chunk
- Play audio ngay khi có chunk đầu tiên
- Trigger MiaAvatar state "speaking" khi audio đang phát
```

### Prompt 2.4 — Hooks: Mic + Camera
```
Tạo 2 React hooks cho AgentKid:

hooks/useMicrophone.ts:
- requestPermission(): Promise<boolean>
- startRecording(): void — bắt đầu MediaRecorder (audio/webm;codecs=opus)
- stopRecording(): Promise<Blob> — dừng và return audio blob
- isRecording: boolean
- hasPermission: boolean | null
- error: string | null
- Auto-stop sau 10 giây (safety limit)
- VAD đơn giản: detect silence > 1.5s bằng AudioContext analyser → auto-stop

hooks/useCamera.ts:
- requestPermission(): Promise<boolean>
- videoRef: RefObject<HTMLVideoElement>
- stream: MediaStream | null
- hasPermission: boolean | null
- start() / stop()

Cả 2 hooks cần handle trường hợp:
- User từ chối permission (hiển thị hướng dẫn tiếng Việt)
- Thiết bị không có mic/camera
- iOS Safari restrictions (getUserMedia cần user gesture)
```

### Prompt 2.5 — Voice Pipeline
```
Tạo hook useVoicePipeline orchestrating toàn bộ luồng Voice cho AgentKid.

hooks/useVoicePipeline.ts:
interface VoicePipelineState {
  status: 'idle' | 'listening' | 'thinking' | 'speaking'
  transcript: string
  miaResponse: string
  error: string | null
}

export function useVoicePipeline({ sessionId, childId, emotionRef }) {
  // 1. User nhấn mic → startListening()
  // 2. Record audio (useMicrophone)
  // 3. Song song: gửi audio lên STT + lấy emotion hiện tại từ emotionRef
  // 4. Nhận transcript → gửi lên /api/chat với emotion context
  // 5. Nhận response text → gửi lên /api/tts
  // 6. Stream audio → play (trigger MiaAvatar speaking state)
  // 7. Nếu emergencyFlag → gọi /api/alert
  // 8. Reset về idle
}

Quan trọng:
- Tắt mic khi Mia đang nói (prevent echo/feedback)
- Hiển thị transcript realtime trong Subtitles component
- Handle lỗi mạng: retry 2 lần với exponential backoff
- Measure và log latency từng bước (console.log khi dev)
```

### Prompt 2.6 — Session Management + Long-term Memory
```
Tạo session management và long-term memory cho AgentKid.

hooks/useSession.ts:
- Tạo session khi mount component /session/[childId]
- Kết thúc session khi unmount hoặc nhấn Stop
- Auto-save messages với debounce 500ms
- Handle disconnect: queue messages → retry khi reconnect

lib/memory.ts:
- extractMemories(sessionId: string, transcript: string): Promise<string[]>
  Gọi Gemini với prompt: extract 3-5 facts về trẻ từ transcript
  Return JSON array of strings

- saveMemories(childId: string, memories: string[]): Promise<void>
  Dùng Google text-embedding-004 (768 dims) để embed
  Lưu vào bảng memories

- recallMemories(childId: string, currentMessage: string): Promise<string[]>
  Embed currentMessage → query match_memories() → return top-5 content

Trigger: gọi extractMemories() sau endSession() trong background (không block UI)
```

---

## PHASE 3 — Vision + Lessons + Dashboard

### Prompt 3.1 — Emotion Detection
```
Tích hợp face-api.js để detect cảm xúc real-time cho AgentKid.

Bước 1: Copy face-api.js models vào public/models/
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_expression_model-weights_manifest.json  
- face_expression_model-shard1
(Download từ: https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

hooks/useEmotionDetection.ts:
- Load models khi mount (show loading state)
- Detect mỗi 2 giây từ videoRef
- Map faceapi expressions → 6 loại: happy/sad/angry/fearful/surprised/neutral
- Expose: emotion (current), confidence, emotionRef (sync ref cho pipeline)
- Lưu emotion_events vào Supabase realtime mỗi 4 giây (không spam DB)

components/session/EmotionIndicator.tsx:
- Emoji nhỏ (24px) hiển thị góc dưới-trái màn hình
- Map: happy→😊 sad→😢 angry→😠 fearful→😨 surprised→😲 neutral→😐
- Fade transition khi thay đổi
- Ẩn đi sau 3 giây nếu neutral
```

### Prompt 3.2 — Lesson Engine (AI-Generated)
```
Tạo lesson engine với AI-generated lessons cho AgentKid.

lib/lesson-engine.ts:
- generateLesson(child, framework, category): gọi Gemini sinh bài học JSON
  [Dùng prompt từ TECH_SPEC.md section 5]
- processResponse(node, userText, emotion): Promise<{nextNode, feedback}>
  Dùng keyword matching đơn giản (includes) + Gemini fallback
- findBestMatch(userText: string, choices: Choice[]): Choice | null

app/api/lessons/generate/route.ts:
- POST: { childId, framework: 'ABA'|'PECS'|'SocialStories', category }
- Gọi generateLesson()
- Lưu vào DB với status: 'suggested'
- Return lesson object

Tích hợp vào voice pipeline:
- Khi session có lesson active: processResponse() thay vì free chat
- Khi lesson kết thúc: Mia nói "Bài học hôm nay xong rồi! Con giỏi lắm! 🌟"

Tự động suggest lesson sau session thứ 2: gọi /api/lessons/generate cho 3 framework
```

### Prompt 3.3 — Parent Dashboard
```
Tạo Parent Dashboard song ngữ Việt-Anh cho AgentKid.

Setup i18n trước:
- next-i18next với locales: ['vi', 'en'], defaultLocale: 'vi'
- Tạo locales/vi/dashboard.json và locales/en/dashboard.json
  [Xem TECH_SPEC.md section 7]
- Language toggle button trong header (🇻🇳 / 🇬🇧)

app/(dashboard)/layout.tsx:
- Sidebar trái: logo + nav links + language toggle + user avatar
- Responsive: sidebar collapse trên mobile

app/(dashboard)/dashboard/page.tsx:
- 4 stat cards: Tổng buổi học / Tổng thời gian / Streak / Điểm TB
- Quick access: danh sách trẻ → Start Session button
- Alert badge nếu có unacknowledged alerts

app/(dashboard)/sessions/[id]/page.tsx:
- Emotion Timeline: Recharts LineChart
  X-axis: thời gian session (phút)
  Y-axis: emotion intensity (confidence 0-1)
  Màu line theo emotion (xem TECH_SPEC.md section 9)
  
- Transcript: chat bubble style
  User (trẻ): bên phải, background #FFE4D6 (cam nhạt)
  Mia: bên trái, background #D1FAE5 (mint nhạt)
  
- AI Notes: card trắng với border mint, Gemini analysis text

app/(dashboard)/lessons/page.tsx:
- Tabs: "Chờ duyệt" / "Đã duyệt" / "Tất cả"
- Mỗi card: framework badge (màu khác nhau), chủ đề, độ khó (stars), preview node đầu
- Nút Approve (xanh) / Reject (đỏ) / Generate mới (cam)
```

### Prompt 3.4 — Progress Tracker
```
Tạo progress tracking tự động cho AgentKid.

Sau khi session kết thúc (background job):
1. Gọi Gemini phân tích transcript → score 1-10 + ai_notes (tiếng Việt)
   Prompt: "Phân tích buổi học này, chấm điểm 1-10 dựa trên mức độ tham gia 
   và tiến bộ của bé. Trả về JSON: {score, notes}"
2. Update session record với score + ai_notes

app/(dashboard)/progress/page.tsx:
- Recharts AreaChart: điểm theo tuần (7 ngày gần nhất)
- Recharts BarChart: emotion distribution (% mỗi loại cảm xúc)
- Milestone badges:
  🌟 Buổi đầu tiên
  🎯 5 buổi học
  🏆 10 buổi học  
  💎 30 ngày liên tiếp
- Confetti animation khi đạt milestone mới (dùng canvas-confetti)
```

---

## PHASE 4 — Safety + Polish

### Prompt 4.1 — Emergency Alert
```
Tạo emergency alert system cho AgentKid với 3 kênh.

lib/alert-system.ts:
[Dùng đúng code từ TECH_SPEC.md section 6]
- Thêm đủ keyword list tiếng Việt
- Twilio SMS: import twilio, dùng env vars
- Zalo OA: dùng code từ TECH_SPEC.md section 8
- Web Push: dùng web-push library

app/api/alert/route.ts:
- POST: { sessionId, message, emotionHistory, userId }
- Gọi checkAndSendAlert()
- Return: { triggered, severity }

Service Worker cho Web Push:
- public/sw.js: handle push event → show notification
- Register SW trong app/layout.tsx

app/(dashboard)/alerts/page.tsx:
- List alerts chưa xác nhận → border đỏ
- List đã xác nhận → mờ đi
- Click → xem session liên quan
- Nút "Đã xem" → mark acknowledged

Tích hợp vào voice pipeline:
- Sau mỗi response từ /api/chat: nếu emergencyFlag → call /api/alert
```

### Prompt 4.2 — Optimization & Polish
```
Tối ưu performance và polish UI cho AgentKid.

1. TTS Streaming cải thiện:
   - Dùng ReadableStream trong API route
   - Frontend dùng AudioContext để decode và play từng chunk

2. Preload face-api.js:
   - Load models trong useEffect sớm nhất có thể
   - Hiển thị progress: "Đang chuẩn bị Mia... 🌟"

3. Offline handling:
   - Detect navigator.onLine
   - Banner: "Mất kết nối — Đang thử kết nối lại..."
   - Queue messages khi offline → send khi online

4. iOS Safari fixes:
   - getUserMedia cần trigger bằng user gesture (button click)
   - AudioContext cần resume() sau user gesture

5. Responsive:
   - Session screen: test 768px (iPad) và 390px (iPhone)
   - MicButton min-touch-target: 60px

6. Accessibility cho trẻ ASD:
   - Không có animations đột ngột (prefer-reduced-motion)
   - Sound effects nhẹ nhàng khi Mia xuất hiện
   - Màu contrast đủ cao cho trẻ có vấn đề thị giác
```

---

## Templates xử lý lỗi khi làm việc với Claude Code

### Khi gặp TypeScript error
```
Lỗi TypeScript trong AgentKid:
[paste error message]

File: [tên file]
Context: Đang làm task [tên task] — Phase [số] Ngày [số]

Nội dung file hiện tại:
[paste file content]

Fix lỗi, giải thích ngắn nguyên nhân.
```

### Khi API trả lỗi
```
API route /api/[tên] trong AgentKid trả về lỗi:
[paste error / response]

Request gửi lên:
[paste request body]

File route hiện tại:
[paste code]

Debug và fix.
```

### Khi latency cao
```
Voice pipeline AgentKid bị chậm hơn mục tiêu 2 giây.
Đo được:
- STT: Xms
- /api/chat (Gemini): Yms
- /api/tts: Zms
- Audio first play: Wms
- Tổng: [tổng]ms

hooks/useVoicePipeline.ts hiện tại:
[paste code]

Gợi ý cụ thể để giảm latency.
```
