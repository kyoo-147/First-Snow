# AgentKid Business Requirements Document

## Product Overview
AgentKid là sản phẩm AI companion cho can thiệp sớm tại nhà, thiết kế cho thị trường Việt Nam. Trải nghiệm cốt lõi là trẻ trò chuyện với Mia bằng giọng nói, còn phụ huynh quản lý hồ sơ, duyệt bài học AI gợi ý, và theo dõi báo cáo sau mỗi buổi.

AgentKid is a home-practice AI companion built for the Vietnamese market. The core experience is voice interaction between the child and Mia, while the parent manages profiles, approves AI-suggested lessons, and reviews post-session reporting.

## Problem Statement
- Phụ huynh thiếu công cụ phù hợp tiếng Việt cho trẻ ASD/chậm ngôn ngữ.
- Trị liệu trực tiếp tốn kém và khó duy trì hàng ngày.
- Phụ huynh thường không có framework tương tác đúng cách tại nhà.
- Các công cụ hiện có ít tối ưu cho child-safe UX, privacy, và early intervention workflows ở Việt Nam.

## Primary Personas
### Parent / Guardian
- Là người đăng ký tài khoản, cấp quyền, cấu hình thông tin liên lạc cảnh báo, và quản lý nhiều hồ sơ trẻ.
- Cần dashboard rõ ràng, song ngữ VI-EN, và cảnh báo đủ nhanh khi buổi học có dấu hiệu bất thường.

### Child
- 6-10 tuổi, ASD hoặc chậm ngôn ngữ hoặc cả hai.
- Cần câu ngắn, giọng điệu nhẹ nhàng, màu sắc thân thiện, tương tác ít gây overwhelm.
- Không nên bị yêu cầu thao tác UI phức tạp.

## Core Experience Requirements
### Companion
- Mia phải nói tiếng Việt thuần.
- Mia phải trả lời ngắn, tích cực, không phán xét.
- Mia phải duy trì short-term memory trong phiên và long-term memory qua nhiều phiên.

### Observer
- Hệ thống nhận diện 6 cảm xúc cơ bản từ webcam theo hướng privacy-first.
- Dữ liệu cảm xúc phải dùng được cho timeline và context phản hồi của Mia.

### Teacher
- Bài học động phải dựa trên ABA, PECS, hoặc Social Stories.
- Chủ đề MVP giới hạn ở emotion, social, routine.
- Parent approval là bước bắt buộc trước khi lesson AI-generated được dùng chính thức.

### Guardian
- Consent phải rõ ràng trước khi dùng mic và camera.
- Alert phải có rule-based trigger và escalation theo severity.
- Dashboard phải cho phụ huynh xem lại transcript, timeline cảm xúc, điểm tiến độ, và alerts.

## User Flows
### Parent Setup Flow
1. Parent đăng ký tài khoản.
2. Parent tạo profile trẻ.
3. Parent cấu hình phone, Zalo, và đồng ý consent/privacy terms.
4. Parent vào dashboard và bắt đầu buổi đầu tiên.

### Child Session Flow
1. Parent mở session cho một child profile.
2. App yêu cầu quyền mic/camera và hiển thị consent.
3. Child nói, hệ thống chạy STT và emotion detection song song.
4. Mia trả lời bằng Gemini + TTS.
5. Hệ thống lưu transcript, emotion events, và session state.
6. Nếu có dấu hiệu rủi ro, alert được gửi theo severity.

### Lesson Approval Flow
1. AI sinh lesson suggestions theo child profile và framework.
2. Parent xem preview lesson trong dashboard.
3. Parent approve hoặc reject.
4. Chỉ approved lessons mới được kích hoạt trong session.

### Session Review Flow
1. Sau session, parent xem transcript, emotion timeline, score, và AI notes.
2. Session completion có thể góp phần tạo memories và progress trends.

## Success Metrics
- Voice latency mục tiêu dưới 2 giây từ lúc trẻ ngừng nói đến khi Mia bắt đầu đáp.
- 5 buổi pilot thực tế hoàn tất thành công.
- Parent có thể hoàn thành luồng đăng ký, tạo profile, bắt đầu session, và xem báo cáo mà không cần hỗ trợ kỹ thuật.
- Emotion chart, transcript, và alert history hiển thị đúng dữ liệu đã lưu.

## Privacy and Consent Boundaries
- Không lưu raw video trong MVP.
- Không lưu raw audio trong MVP trừ khi có quyết định kỹ thuật mới sau này.
- Lưu transcript, emotion events, lesson metadata, score, AI notes, và alert logs.
- Parent phải hiểu rõ camera dùng để suy luận emotion numbers chứ không lưu video.
- App phải nêu rõ rằng AgentKid hỗ trợ luyện tập tại nhà và không thay thế trị liệu chuyên nghiệp.

## MVP Pilot Definition
- 30 ngày đầu tập trung hoàn thành MVP.
- 2 buổi pilot nội bộ với người lớn đóng vai trẻ.
- 3 buổi pilot với trẻ thật nếu gia đình đồng ý tham gia.
- Sau pilot cần có summary về latency, phản hồi phụ huynh, lỗi phát sinh, và backlog v1.1.
