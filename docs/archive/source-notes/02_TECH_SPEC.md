# AgentKid — Tech Spec v2

> Source of truth kỹ thuật — dùng khi làm việc với Claude Code

---

## 1. Cấu trúc thư mục

```
agentkid/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar song ngữ
│   │   ├── dashboard/page.tsx      # Overview
│   │   ├── children/page.tsx       # Hồ sơ trẻ
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── lessons/page.tsx        # Duyệt bài học
│   │   ├── progress/page.tsx
│   │   └── alerts/page.tsx
│   ├── session/
│   │   └── [childId]/page.tsx      # Màn hình Mia (full-screen)
│   ├── api/
│   │   ├── stt/route.ts
│   │   ├── tts/route.ts
│   │   ├── chat/route.ts
│   │   ├── memory/route.ts
│   │   ├── alert/route.ts
│   │   └── lessons/
│   │       ├── generate/route.ts
│   │       └── [id]/route.ts
│   └── layout.tsx
├── components/
│   ├── session/
│   │   ├── MiaAvatar.tsx           # Nhân vật hoạt hình người
│   │   ├── MicButton.tsx
│   │   ├── EmotionIndicator.tsx
│   │   └── Subtitles.tsx
│   └── dashboard/
│       ├── EmotionChart.tsx
│       ├── TranscriptView.tsx
│       └── ProgressCard.tsx
├── hooks/
│   ├── useMicrophone.ts
│   ├── useCamera.ts
│   ├── useEmotionDetection.ts
│   ├── useSession.ts
│   └── useVoicePipeline.ts
├── lib/
│   ├── supabase.ts
│   ├── supabase-helpers.ts
│   ├── gemini.ts
│   ├── google-stt.ts
│   ├── google-tts.ts
│   ├── twilio.ts
│   ├── zalo-oa.ts
│   ├── memory.ts
│   ├── lesson-engine.ts
│   ├── alert-system.ts
│   └── prompts.ts
├── types/index.ts
├── public/models/                  # face-api.js models
├── locales/                        # i18n: vi/ + en/
└── middleware.ts
```

---

## 2. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Cloud (JSON string của service account)
GOOGLE_APPLICATION_CREDENTIALS_JSON=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_GEMINI_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Zalo OA
ZALO_OA_ACCESS_TOKEN=
ZALO_OA_ID=

# App
NEXT_PUBLIC_APP_URL=https://agentkid.io.vn
NEXT_PUBLIC_VAPID_PUBLIC_KEY=    # Web Push
VAPID_PRIVATE_KEY=
```

---

## 3. Database Schema (SQL)

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,                          -- Twilio SMS
  zalo_id TEXT,                        -- Zalo OA alert
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE,
  condition TEXT CHECK (condition IN ('ASD', 'language_delay', 'both')),
  nickname TEXT,
  avatar_variant TEXT DEFAULT 'default',  -- default / pink / blue
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  score INTEGER,                        -- 1-10, Gemini tự chấm
  ai_notes TEXT,                        -- Gemini phân tích sau buổi
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'interrupted'))
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emotion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  emotion TEXT CHECK (
    emotion IN ('happy','sad','angry','fearful','surprised','neutral')
  ),
  confidence FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  framework TEXT CHECK (framework IN ('ABA', 'PECS', 'SocialStories')),
  category TEXT CHECK (category IN ('emotion', 'social', 'routine')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  nodes JSONB NOT NULL,                 -- Branching dialog nodes
  status TEXT DEFAULT 'suggested'
    CHECK (status IN ('suggested','approved','active','completed','rejected')),
  suggested_by TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  trigger_type TEXT CHECK (trigger_type IN ('keyword','emotion')),
  trigger_detail TEXT,
  severity TEXT CHECK (severity IN ('warning','critical')),
  channels_sent TEXT[],                 -- ['push','sms','zalo']
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);

-- RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_children" ON children
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

-- Vector search function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(768),
  child_id_param UUID,
  match_count INT DEFAULT 5
) RETURNS TABLE (id UUID, content TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE child_id = child_id_param
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 4. System Prompt Mia (lib/prompts.ts)

```typescript
export function buildSystemPrompt(child: Child, memories: Memory[]): string {
  const age = calculateAge(child.dob);
  const conditionText = {
    ASD: 'tự kỷ',
    language_delay: 'chậm phát triển ngôn ngữ',
    both: 'tự kỷ và chậm ngôn ngữ'
  }[child.condition];

  const memoriesText = memories.length > 0
    ? `\nNhững điều Mia đã biết về ${child.name}:\n${memories.map(m => `- ${m.content}`).join('\n')}`
    : '';

  return `Bạn là Mia — nhân vật hoạt hình người thân thiện, bạn tốt của các bé.

THÔNG TIN BÉ:
- Tên: ${child.name}${child.nickname ? ` (hay gọi là ${child.nickname})` : ''}
- Tuổi: ${age} tuổi
- Tình trạng: ${conditionText}
${memoriesText}

CÁCH NÓI CHUYỆN:
- LUÔN dùng tiếng Việt thuần, KHÔNG dùng tiếng Anh
- Câu ngắn, tối đa 2 câu mỗi lần trả lời
- Giọng vui vẻ, ấm áp, kiên nhẫn
- Khen ngợi thường xuyên: "Giỏi lắm!", "Tuyệt vời!", "Mia rất vui!"
- Không dùng từ phức tạp hoặc câu dài
- Nếu bé không trả lời: hỏi lại nhẹ nhàng hoặc đổi chủ đề

AN TOÀN:
- Phát hiện từ nguy hiểm (đau, sợ, cứu...) → hỏi thăm ngay + trả về flag emergency: true
- Không bao giờ nói tiêu cực về bé
- Luôn kết thúc bằng câu động viên

PHONG CÁCH MIA:
- Nói "Mia nghĩ rằng..." hoặc "Mia muốn hỏi con..."
- Thỉnh thoảng dùng emoji đơn giản: 🌟 ❤️ 😊 🎉
- Nếu bé buồn/sợ: giọng nhẹ nhàng hơn, đổi sang chủ đề thoải mái`;
}
```

---

## 5. Lesson Generation Prompt (lib/lesson-engine.ts)

```typescript
export function buildLessonGenerationPrompt(
  child: Child,
  framework: 'ABA' | 'PECS' | 'SocialStories',
  category: 'emotion' | 'social' | 'routine'
): string {
  const frameworkGuide = {
    ABA: 'Dùng kỹ thuật ABA: chia nhỏ kỹ năng, reinforcement dương tính, lặp lại có hệ thống',
    PECS: 'Dùng phương pháp PECS: giao tiếp bằng hình ảnh, từ đơn giản, kết hợp vật thể',
    SocialStories: 'Dùng Social Stories: kể chuyện tình huống xã hội, mô tả cảm xúc và hành động phù hợp'
  }[framework];

  const categoryGuide = {
    emotion: 'Chủ đề: nhận diện và biểu đạt cảm xúc cơ bản (vui, buồn, giận, sợ)',
    social: 'Chủ đề: kỹ năng giao tiếp và tương tác xã hội (chào hỏi, kết bạn, chia sẻ)',
    routine: 'Chủ đề: thói quen sinh hoạt hàng ngày (đánh răng, ăn cơm, đi ngủ)'
  }[category];

  return `Tạo một bài học tương tác cho bé ${child.name}, ${calculateAge(child.dob)} tuổi, tình trạng ${child.condition}.

Framework: ${frameworkGuide}
${categoryGuide}

Yêu cầu:
- 5-7 nodes hội thoại rẽ nhánh
- Tiếng Việt đơn giản, câu ngắn
- Mia (nhân vật hoạt hình người) hướng dẫn
- Có khen ngợi sau mỗi câu trả lời đúng

Trả về JSON theo schema sau (KHÔNG thêm text ngoài JSON):
{
  "title": "tên bài học",
  "difficulty": 1-5,
  "nodes": [
    {
      "id": "start",
      "type": "prompt|question|feedback|end",
      "text": "Mia nói gì",
      "choices": [
        { "keywords": ["từ1", "từ2"], "nextNodeId": "node_id", "feedback": "Khen ngợi..." }
      ],
      "defaultNextNodeId": "node_id"
    }
  ]
}`;
}
```

---

## 6. Emergency Alert System (lib/alert-system.ts)

```typescript
const DANGER_KEYWORDS_VI = [
  'cứu', 'đau', 'sợ quá', 'không muốn', 'ghét',
  'đánh con', 'bỏ đi', 'khóc', 'đau bụng', 'ngã',
  'không thích nữa', 'xấu', 'không ăn'
];

export async function checkAndSendAlert(params: {
  message: string;
  emotionHistory: EmotionEvent[];
  sessionId: string;
  user: User;
}): Promise<{ triggered: boolean; severity?: 'warning' | 'critical' }> {
  const { message, emotionHistory, sessionId, user } = params;

  const matchedKeywords = DANGER_KEYWORDS_VI.filter(kw =>
    message.toLowerCase().includes(kw)
  );

  // Fearful liên tục 5 lần (10 giây)
  const recentEmotions = emotionHistory.slice(-5);
  const sustainedFear = recentEmotions.length === 5 &&
    recentEmotions.every(e => e.emotion === 'fearful' && e.confidence > 0.7);

  const triggered = matchedKeywords.length > 0 || sustainedFear;
  if (!triggered) return { triggered: false };

  const severity = sustainedFear || matchedKeywords.length >= 2 ? 'critical' : 'warning';
  const channels: string[] = ['push'];

  // Web Push (luôn gửi)
  await sendWebPushNotification(user.id, { severity, sessionId });

  if (severity === 'critical') {
    // Twilio SMS
    if (user.phone) {
      await sendTwilioSMS(user.phone,
        `[AgentKid] ⚠️ Cần chú ý đến bé ngay. Mở app để xem chi tiết.`
      );
      channels.push('sms');
    }

    // Zalo OA
    if (user.zalo_id) {
      await sendZaloMessage(user.zalo_id,
        `AgentKid: Bé cần sự chú ý của bạn. Vui lòng kiểm tra ngay.`
      );
      channels.push('zalo');
    }
  }

  // Lưu alert vào DB
  await supabase.from('alerts').insert({
    session_id: sessionId,
    trigger_type: sustainedFear ? 'emotion' : 'keyword',
    trigger_detail: sustainedFear ? 'sustained_fear' : matchedKeywords.join(', '),
    severity,
    channels_sent: channels
  });

  return { triggered: true, severity };
}
```

---

## 7. i18n Setup (Song ngữ Dashboard)

```typescript
// locales/vi/dashboard.json
{
  "overview": "Tổng quan",
  "sessions": "Buổi học",
  "lessons": "Bài học",
  "progress": "Tiến độ",
  "alerts": "Cảnh báo",
  "children": "Hồ sơ trẻ",
  "start_session": "Bắt đầu học",
  "total_sessions": "Tổng buổi học",
  "total_time": "Tổng thời gian",
  "streak": "Chuỗi ngày học",
  "approve": "Duyệt",
  "reject": "Từ chối"
}

// locales/en/dashboard.json
{
  "overview": "Overview",
  "sessions": "Sessions",
  "lessons": "Lessons",
  "progress": "Progress",
  "alerts": "Alerts",
  "children": "Children",
  "start_session": "Start Session",
  "total_sessions": "Total Sessions",
  "total_time": "Total Time",
  "streak": "Day Streak",
  "approve": "Approve",
  "reject": "Reject"
}
```

---

## 8. Zalo OA Integration (lib/zalo-oa.ts)

```typescript
// Zalo OA ZNS (Zalo Notification Service)
export async function sendZaloMessage(zaloId: string, message: string) {
  const response = await fetch('https://openapi.zalo.me/v2.0/oa/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ZALO_OA_ACCESS_TOKEN!
    },
    body: JSON.stringify({
      recipient: { user_id: zaloId },
      message: { text: message }
    })
  });
  return response.json();
}

// Lưu ý: User phải follow Zalo OA của AgentKid trước
// Khi đăng ký, hướng dẫn phụ huynh: "Nhắn tin cho Zalo OA AgentKid để nhận cảnh báo"
```

---

## 9. Latency Budget

```
Mục tiêu: Tổng < 2000ms từ khi trẻ ngừng nói → Mia bắt đầu nói

Component          Target    Optimization
─────────────────────────────────────────
STT (Google)       400ms     Audio < 5s, vi-VN latest_long
Gemini Flash       600ms     System prompt < 1500 tokens, stream
TTS first byte     200ms     Streaming response
Audio play         0ms       Start immediately on first chunk
DB save            async     Fire-and-forget, không block
Emotion detection  0ms       Client-side, song song với STT
─────────────────────────────────────────
Total (realistic)  1200ms    ✅ Còn buffer 800ms

Tips thực tế:
- Preconnect đến Google APIs khi load trang
- Dùng Vercel Edge Functions (Singapore region)
- Không đợi DB save xong mới trả response
- Giới hạn conversation history inject: tối đa 10 messages
```

---

## 10. Deploy Config

```json
// vercel.json
{
  "functions": {
    "app/api/stt/route.ts": { "maxDuration": 30 },
    "app/api/tts/route.ts": { "maxDuration": 30 },
    "app/api/chat/route.ts": { "maxDuration": 60 },
    "app/api/lessons/generate/route.ts": { "maxDuration": 60 }
  },
  "regions": ["sin1"]
}
```

```
Supabase checklist:
□ Enable pgvector extension
□ Run schema SQL (section 3)
□ Enable Realtime: emotion_events, alerts
□ Storage bucket: session-assets (private)
□ Auth: Email provider ON, disable email confirmation (MVP)
□ API: copy URL + anon key + service role key

Google Cloud checklist:
□ Enable: Speech-to-Text API, Text-to-Speech API, Generative Language API
□ Service Account → download JSON → stringify → thêm vào Vercel env
□ Region: asia-southeast1 (Singapore)
□ TTS voice test: vi-VN-Wavenet-A và B → chọn cái nghe tự nhiên hơn
```
