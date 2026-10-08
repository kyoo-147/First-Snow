# AgentKid Localization Glossary — Wave 1 (Vietnamese)

> **Status:** Approved · Wave 1 foundation
> **Locale:** vi-VN
> **Owner:** Localization Lane (kyoo-147)
> **Last updated:** 2026-10-08

---

## Purpose

This glossary is the single source of truth for Vietnamese terminology used throughout AgentKid. All contributors—human and AI—must use these approved terms in catalog JSON files, UI copy, and documentation. Departing from approved terms requires an explicit glossary update PR.

---

## Usage Rules

1. **Use the approved Vietnamese term**, not a literal translation of the English source.
2. **Preserve diacritics** exactly as written. `Học sinh` ≠ `Hoc sinh`.
3. **Do not mix** English terms into Vietnamese strings unless listed under "Keep in English".
4. **Interpolation** variables (`{{count}}`, `{{name}}`) are never translated.
5. **Brand names** (AgentKid, Live2D) are kept as-is.

---

## Core Domain Terms

| English | Approved Vietnamese | Notes |
|---------|---------------------|-------|
| Student / Child | Học sinh | Use `học sinh` in parent-facing copy; `bạn` (informal "you") in child-facing copy |
| Parent / Guardian | Phụ huynh | |
| Learning companion / AI companion | Trợ lý học tập | |
| Lesson | Bài học | |
| Subject | Môn học | |
| Progress | Tiến trình | |
| Dashboard | Bảng điều khiển | |
| Session | Phiên | |
| Safety / Content filter | An toàn / Bộ lọc nội dung | |
| Alert | Cảnh báo | |
| Achievement | Thành tích | |
| Badge | Huy hiệu | |
| Points / Stars | Điểm thưởng | |
| Streak | Chuỗi ngày học | |

---

## Authentication Terms

| English | Approved Vietnamese |
|---------|---------------------|
| Sign in | Đăng nhập |
| Sign up / Register | Đăng ký |
| Sign out | Đăng xuất |
| Email | Email |
| Password | Mật khẩu |
| Confirm password | Xác nhận mật khẩu |
| Forgot password | Quên mật khẩu |
| Reset password | Đặt lại mật khẩu |
| Session expired | Phiên đăng nhập đã hết hạn |
| Unauthorized | Không có quyền truy cập |

---

## Learning Terms

| English | Approved Vietnamese |
|---------|---------------------|
| Math | Toán học |
| Vietnamese Language | Tiếng Việt |
| English | Tiếng Anh |
| Science | Khoa học |
| History | Lịch sử |
| Geography | Địa lý |
| Art | Mỹ thuật |
| Music | Âm nhạc |
| Physical Education (PE) | Thể dục |
| Quiz | Bài kiểm tra nhanh |
| Correct | Đúng rồi |
| Incorrect | Chưa đúng |
| Score | Điểm |
| Pass | Đạt |
| Fail | Chưa đạt |
| Beginner | Cơ bản |
| Intermediate | Trung cấp |
| Advanced | Nâng cao |
| Locked | Bị khóa |
| Completed | Hoàn thành |
| In progress | Đang học |

---

## AI Companion Terms

| English | Approved Vietnamese |
|---------|---------------------|
| Idle | Đang chờ |
| Listening | Đang nghe |
| Thinking | Đang suy nghĩ |
| Speaking | Đang nói |
| Connected | Đã kết nối |
| Disconnected | Mất kết nối |
| Reconnect | Kết nối lại |
| Blocked (safety) | Nội dung này không phù hợp |

---

## Common UI Terms

| English | Approved Vietnamese |
|---------|---------------------|
| Save | Lưu |
| Cancel | Hủy |
| Close | Đóng |
| Confirm | Xác nhận |
| Delete | Xóa |
| Edit | Chỉnh sửa |
| Back | Quay lại |
| Next | Tiếp theo |
| Loading | Đang tải… |
| Error | Đã xảy ra lỗi |
| Retry | Thử lại |
| Success | Thành công |
| Search | Tìm kiếm |
| Settings | Cài đặt |
| Not found | Không tìm thấy |
| Required | Bắt buộc |
| Optional | Tùy chọn |
| Learn more | Tìm hiểu thêm |
| View all | Xem tất cả |
| Today | Hôm nay |
| Yesterday | Hôm qua |
| Just now | Vừa xong |

---

## Terms to Keep in English

These terms appear as-is in the UI, even in Vietnamese copy:

- **AgentKid** — brand name
- **Live2D** — technology brand
- **Email** — widely understood loanword in Vietnamese digital context
- **API**, **URL**, **WebSocket** — technical terms for developer-facing contexts only
- **UUID** — technical identifier

---

## Tone Guidelines

- **Child-facing copy:** Warm, encouraging, use `bạn` for "you". Avoid formal register.
  - ✅ "Tuyệt vời! Bạn làm rất tốt!"
  - ❌ "Bạn đã hoàn thành bài học một cách xuất sắc."
- **Parent-facing copy:** Respectful, clear, professional but not stiff.
  - ✅ "Báo cáo tuần của học sinh"
  - ❌ "Stats for your kid"
- **Error messages:** Factual, non-blaming.
  - ✅ "Không thể kết nối. Vui lòng kiểm tra mạng."
  - ❌ "Bạn đã làm mất kết nối."

---

## Amending This Glossary

Changes to approved terms require:
1. A pull request updating this file.
2. Simultaneous update of all affected JSON catalog files under `src/i18n/locales/vi/`.
3. Passing CI (catalog integrity tests must remain green).
