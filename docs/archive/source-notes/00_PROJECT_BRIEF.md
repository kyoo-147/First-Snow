# AgentKid — Project Brief (v2)
> AI Companion Web App cho trẻ tự kỷ & chậm ngôn ngữ (6–10 tuổi)

---

## 1. Tổng quan dự án

| Hạng mục | Chi tiết |
|---|---|
| **Tên dự án** | AgentKid |
| **Tên miền** | agentkid.io.vn |
| **Loại sản phẩm** | Web App (Next.js, chạy trên trình duyệt) |
| **Đối tượng trẻ** | 6–10 tuổi, ASD hoặc chậm phát triển ngôn ngữ (hoặc cả hai) |
| **Người dùng chính** | Phụ huynh (quản lý, dashboard) + Trẻ em (trải nghiệm session) |
| **Ngôn ngữ AI** | Tiếng Việt thuần |
| **Ngôn ngữ UI** | Song ngữ Việt – Anh (dashboard phụ huynh) |
| **Nhân vật AI** | **Mia** — nhân vật hoạt hình người, thân thiện |
| **Auth model** | Phụ huynh đăng ký 1 tài khoản → quản lý nhiều hồ sơ trẻ |
| **AI Provider** | Google Cloud (Speech-to-Text + Gemini + TTS) |
| **Alert** | Twilio SMS + Zalo OA + Web Push |
| **Deploy** | Vercel + Supabase + Cloudflare R2 |
| **Thời gian MVP** | 30 ngày |
| **Team** | Solo full-stack developer (React/Next.js + Node.js/Python) |
| **Mô hình kinh doanh** | MVP miễn phí → thu phí sau (model TBD) |

---

## 2. Vấn đề cần giải quyết

Trẻ tự kỷ và chậm ngôn ngữ ở Việt Nam thiếu công cụ can thiệp sớm tại nhà:
- Trị liệu ngôn ngữ trực tiếp tốn kém, khó tiếp cận hàng ngày
- Phụ huynh không có chuyên môn để tương tác đúng phương pháp
- Không có sản phẩm nào phù hợp ngôn ngữ Việt + đặc thù trẻ ASD

**AgentKid** lấp đầy khoảng trống này bằng AI companion **Mia** — biết lắng nghe, ghi nhớ, và dạy học theo các framework trị liệu đã được kiểm chứng (ABA, PECS, Social Stories).

---

## 3. Nhân vật Mia

| Thuộc tính | Chi tiết |
|---|---|
| **Tên** | Mia |
| **Hình dạng** | Nhân vật hoạt hình người (không phải robot) |
| **Phong cách** | Dễ thương, biểu cảm phong phú, màu sắc tươi sáng |
| **Giọng nói** | Google TTS vi-VN-Wavenet, nhẹ nhàng, chậm rãi |
| **Tính cách** | Kiên nhẫn, vui vẻ, hay khen ngợi, không phán xét |
| **Ngôn ngữ** | Tiếng Việt thuần, câu ngắn, từ đơn giản |
| **Animation states** | idle / thinking / speaking / happy / concerned |

---

## 4. Bốn nhóm tính năng cốt lõi

### Nhóm 1 — Giao tiếp & Làm bạn (The Companion)
- Voice-to-Voice hai chiều (WebRTC + Google STT/TTS tiếng Việt)
- Bộ nhớ ngắn hạn (trong session) + dài hạn (pgvector)
- Mia nhớ tên, sở thích, sự kiện của trẻ qua nhiều buổi

### Nhóm 2 — Thấu hiểu & Phân tích (The Observer)
- Nhận diện cảm xúc qua webcam (face-api.js, client-side)
- 6 cảm xúc: happy / sad / angry / fearful / surprised / neutral
- Emotion Timeline: biểu đồ tâm trạng theo từng buổi
- NLU: Gemini phân tích tone → Mia điều chỉnh cách nói chuyện

### Nhóm 3 — Giáo dục & Can thiệp (The Teacher)
- **Framework**: ABA, PECS, Social Stories
- **Chủ đề MVP** (3 nhóm):
  1. Nhận diện cảm xúc cơ bản
  2. Kỹ năng giao tiếp xã hội
  3. Thói quen sinh hoạt hàng ngày
- **Bài học động**: Gemini tự sinh bài học phù hợp từng trẻ (không hard-code)
- Flow duyệt: AI gợi ý → phụ huynh duyệt → trẻ học
- Tự động điều chỉnh độ khó theo phản ứng cảm xúc
- Progress Tracker: chấm điểm tự động sau mỗi buổi

### Nhóm 4 — An toàn & Quản trị (The Guardian)
- **Emergency Alert** (3 kênh): Web Push + Twilio SMS + Zalo OA
- Trigger: từ khóa nguy hiểm tiếng Việt hoặc fearful liên tục > 10 giây
- **Parent Dashboard** (song ngữ Việt–Anh):
  - Báo cáo phiên, biểu đồ cảm xúc, transcript hội thoại
  - Quản lý hồ sơ trẻ, duyệt bài học
- Consent Flow: phụ huynh xác nhận trước mỗi buổi
- Privacy: video/ảnh không lưu, chỉ lưu emotion numbers + text

---

## 5. Tech Stack

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Auth:         Supabase Auth (email/password)
Database:     Supabase PostgreSQL + pgvector
Realtime:     Supabase Realtime
Voice STT:    Google Cloud Speech-to-Text (vi-VN)
Voice TTS:    Google Cloud Text-to-Speech (WaveNet vi-VN-Wavenet-A)
LLM:          Google Gemini 1.5 Flash
Emotion AI:   face-api.js (client-side, không cần server)
Storage:      Cloudflare R2
Alert:        Twilio SMS + Zalo OA API + Web Push API
Deploy:       Vercel + Supabase + Cloudflare R2
```

---

## 6. Kiến trúc luồng chính

```
[Trẻ nói]
    → Mic (WebRTC)
    → Google STT (vi-VN) → Text
    → face-api.js (song song) → Emotion data
    → Gemini 1.5 Flash (LLM + Memory + Lesson engine)
        ↓
    [Emergency check] → Web Push + Twilio SMS + Zalo OA (nếu cần)
        ↓
    Response text → Google TTS (WaveNet vi-VN) → Audio
    → [Trẻ nghe + Mia animation đồng bộ]
    → Supabase (lưu message, emotion_event, session log)
    → Parent Dashboard (realtime)
```

---

## 7. Design System

**Màn hình Mia (trẻ dùng):**
```
Primary:    #FF6B35  (cam ấm — năng lượng, vui vẻ)
Secondary:  #FFD23F  (vàng — tích cực, khen thưởng)
Accent:     #06D6A0  (xanh mint — bình tĩnh, an toàn)
Background: #FFF9F0  (kem nhạt — không chói mắt)
Text:       #2D2D2D
Font:       Nunito (Google Fonts)
```

**Dashboard phụ huynh:**
```
Primary:    #4F46E5  (indigo)
Surface:    #FFFFFF / #F8FAFC
Text:       #0F172A
Font:       Nunito / Inter
```

---

## 8. Mô hình dữ liệu

```
User         → id, email, name, phone, zalo_id
Child        → id, user_id, name, dob, condition, nickname, avatar_config
Session      → id, child_id, started_at, ended_at, score, ai_notes
Message      → id, session_id, role, content, created_at
EmotionEvent → id, session_id, emotion, confidence, recorded_at
Lesson       → id, child_id, title, framework, category, difficulty, nodes(JSONB), status
Memory       → id, child_id, content, embedding(vector 768), created_at
Alert        → id, session_id, trigger_type, severity, channels_sent[], acknowledged
```

---

## 9. Chi phí ước tính (50 buổi/tháng × 15 phút)

| Dịch vụ | Chi phí |
|---|---|
| Google STT | ~$4.5 |
| Google TTS WaveNet | ~$12 |
| Gemini 1.5 Flash | ~$3.75 |
| Supabase + Vercel + R2 | ~$0.5 |
| Twilio + Zalo (alerts only) | ~$1–2 |
| **Tổng** | **~$22–24/tháng (~580k VNĐ)** |

---

## 10. Tiêu chí thành công MVP

- [ ] Mia nói chuyện tiếng Việt với trẻ, độ trễ < 2 giây
- [ ] Nhận diện được 6 cảm xúc qua webcam
- [ ] Gemini tự sinh bài học theo ABA/PECS/Social Stories
- [ ] Phụ huynh duyệt bài học + xem báo cáo song ngữ
- [ ] Emergency alert → SMS + Zalo + Web Push hoạt động
- [ ] 5 buổi thử nghiệm thực tế với trẻ thành công

> ⚠️ AgentKid hỗ trợ luyện tập tại nhà — không thay thế trị liệu chuyên nghiệp.
