# AgentKid Master System Design

## Document Status
- Status: Draft for review
- Date: 2026-05-15
- Scope: Master review + system design + decomposition roadmap
- Audience: product owner, software architect, AI coding agents, future implementation engineers

## 1. Purpose
Tài liệu này tổng hợp lại toàn bộ trạng thái hiện tại của AgentKid, đánh giá mức độ hoàn thiện của hệ thống dưới góc nhìn production-ready, và chốt một master system design làm nền tảng cho các sub-spec sau này.

Mục tiêu của tài liệu không phải để mô tả chi tiết từng endpoint hay từng màn hình, mà để:
- xác nhận hệ thống hiện tại đang ở đâu,
- khóa kiến trúc chuẩn cho hướng build tiếp theo,
- xác định phần nào đã đủ tốt để giữ,
- xác định phần nào còn là temporary/demo,
- chia toàn bộ product thành các domain và sub-spec rõ ràng để AI hoặc engineer khác có thể tiếp tục mà không mất context.

## 2. Executive Summary
AgentKid hiện đã có một repo foundation khá tốt về mặt tổ chức tri thức: product direction rõ, canonical docs đã được dựng, monorepo production skeleton đã được tạo, AI workflow layer đã có hướng đi đúng. Tuy nhiên, hệ thống vẫn chưa đạt mức “complete production design” vì còn thiếu một master blueprint thống nhất để nối product, architecture, API, data, safety, và implementation boundaries lại thành một hệ logic duy nhất.

Kết luận chính:
- Repo hiện tại không còn là tập note rời rạc.
- Repo hiện tại cũng chưa phải là production system hoàn chỉnh.
- Repo hiện tại nên được xem là một production foundation draft đã sẵn sàng để bước vào giai đoạn viết sub-spec và triển khai có kỷ luật.

## 3. Current-State Master Review
### 3.1 What is already strong
- Product intent rõ: đối tượng người dùng, Mia persona, privacy baseline, parent approval for lessons, alerting concept.
- Architecture direction khá rõ: monorepo app-first, `web + worker`, domain-oriented package layout, ownership chain.
- AI working model tốt: canonical docs, adapter files, rules, skills, tasks lifecycle, archive separation.
- Repo taxonomy nhìn chung đã chuyển dịch đúng từ MVP planning layout sang production-oriented structure.

### 3.2 What is not complete yet
- Root canonical docs mới đang tốt ở mức guidance, nhưng chưa đủ sâu để trở thành execution-grade design cho từng domain.
- `API_SPEC.md` hiện mới dừng ở route families và rules tổng quát, chưa phải internal contract spec đầy đủ.
- `ARCHITECTURE.md` mô tả shape tốt nhưng chưa khóa triệt để dependency direction, orchestration ownership, async boundary policy, và transaction responsibilities.
- `tasks/` mới là starter backlog, chưa phản ánh decomposition hoàn chỉnh theo từng domain/subsystem.
- `docs/engineering/system-spec.md` vẫn giữ lớp chi tiết MVP cũ, nên hiện có dual-layer specification cần quản trị cẩn thận.
- `apps/`, `packages/`, `infra/`, `scripts/` mới chỉ là production skeleton, chưa có runtime implementation.

### 3.3 Current risks
- Encoding hiển thị tiếng Việt trong terminal chưa ổn định.
- Nếu không viết sub-spec tiếp theo, repo rất dễ drift khi bắt đầu scaffold code.
- Nếu để route handlers tự phát triển trước khi chốt domain ownership, hệ thống có nguy cơ quay lại kiểu MVP glue code.

## 4. Production-Ready Target Design
### 4.1 System style
AgentKid được chốt theo hướng `modular monolith` với `Next.js BFF + worker-ready`.

Mục tiêu của lựa chọn này:
- đủ đơn giản để build MVP production-ready nhanh,
- đủ chặt để không sinh technical debt kiểu demo app,
- đủ rõ ràng để tách async jobs và heavy orchestration ra ngoài khi cần,
- đủ hợp với AI-assisted development vì domain boundaries rõ và context dễ phục hồi.

### 4.2 Runtime topology
- `apps/web`
  - parent dashboard
  - child session UI
  - route handlers cho các hot path cần phản hồi nhanh
  - auth and ownership enforcement entrypoints
- `apps/worker`
  - background jobs
  - retry-safe post-session processing
  - memory extraction
  - scoring
  - alert retry/escalation support
- Auth provider + server PostgreSQL
  - external auth identity root mapped through `users.auth_subject_id`
  - relational system of record in self-hosted PostgreSQL
  - pgvector-ready memory retrieval path
- provider integrations
  - Google STT/TTS/Gemini/embeddings
  - Twilio
  - Zalo
  - Web Push

### 4.3 Package responsibilities
- `packages/domain`
  - types, enums, invariants, domain contracts
- `packages/database`
  - schema, migrations, RLS, seeds, typed access helpers
- `packages/integrations`
  - external provider adapters
- `packages/prompts`
  - Mia prompt builders, lesson prompt builders, memory/scoring prompt templates
- `packages/config`
  - environment parsing, runtime config, feature flags
- `packages/observability`
  - logging, tracing, error wrappers
- `packages/testing`
  - fixtures, mocks, browser matrix helpers
- `packages/ui`
  - shared design tokens and reusable primitives when frontend implementation grows

### 4.4 Core principle
`apps/web` và `apps/worker` được phép orchestrate, nhưng không được sở hữu business truth riêng. Business truth phải sống trong domain contracts, specs, và database ownership rules.

## 5. Domain Model and Ownership
### 5.1 Primary domains
- `identity`
- `child-profile`
- `conversation`
- `emotion`
- `memory`
- `lesson`
- `alerting`
- `reporting`
- `platform`

### 5.2 Ownership chain
Ownership chuẩn của hệ thống là:

`auth.user -> parent profile -> child -> session -> message/emotion/alert`

Điều này phải đúng ở:
- data access,
- API authorization,
- worker jobs,
- reporting queries,
- alert acknowledgements.

### 5.3 Domain intent
- `identity`
  - auth, parent profile, consent lifecycle, authorization root
- `child-profile`
  - child metadata, routines, personalization, profile-level settings
- `conversation`
  - STT/chat/TTS loop, subtitles, state transitions, session interaction
- `emotion`
  - inference, normalization, signal persistence, response influence
- `memory`
  - fact extraction, embeddings, retrieval, personalization recall
- `lesson`
  - generation, approval, node schema, runtime branching, framework semantics
- `alerting`
  - trigger evaluation, severity, delivery routing, acknowledgement
- `reporting`
  - transcripts, summaries, emotion timelines, progress data
- `platform`
  - config, logging, retries, workers, observability, deployment support

## 6. Hot Path vs Async Path
### 6.1 Inline web hot path
Những thứ phải ở web runtime và được tối ưu cho latency:
- auth checks
- ownership validation
- session create/end primitives
- STT request
- chat generation
- TTS response
- minimal persistence for correctness

### 6.2 Async worker path
Những thứ phải được đẩy ra worker để không làm chậm trải nghiệm trẻ:
- memory extraction
- embedding generation
- post-session score generation
- non-critical summarization
- retryable alert delivery and fallback handling

### 6.3 Rule
Mọi thứ ảnh hưởng trực tiếp đến phản hồi realtime của Mia phải ở hot path tối thiểu. Mọi thứ hữu ích nhưng không bắt buộc cho phản hồi tức thời phải đi async.

## 7. Production Suitability Classification
### 7.1 Temporary / Demo
- package placeholders và app placeholders
- route families chưa có implementation
- archived day-by-day planning notes
- một số docs vẫn là bridge từ MVP thinking sang production thinking

### 7.2 Production-Suitable
- Auth subject -> parent profile -> child-owned record ownership chain
- Vietnamese-first Mia policy
- parent approval for AI-generated lessons
- no raw media storage baseline
- monorepo app-first structure
- modular monolith direction

### 7.3 Future Extraction Points
- alert processing
- memory extraction and scoring
- provider orchestration hot paths
- reporting and analytics pipelines

## 8. System Risks
### 8.1 Bottlenecks
- STT + Gemini + TTS orchestration in BFF route layer
- provider dependency concentration in conversation domain
- synchronous lesson generation or scoring if allowed to remain inline

### 8.2 Security risks
- service-role misuse
- ownership bypass through child/session chains
- PII leakage in logs or outbound alert channels
- consent drift around media and safety features

### 8.3 Scalability risks
- route handlers growing into business-logic dumps
- post-session work staying inline
- analytics/reporting querying transactional tables directly
- provider adapters leaking into route code instead of staying inside packages

## 9. Quality Rules That Must Hold
- Raw video is not stored in MVP.
- Raw audio is not stored in MVP unless a future ADR explicitly changes policy.
- Parent approval is mandatory before AI-generated lessons enter normal child flow.
- Alerts must preserve auditability even when some channels fail.
- Child-facing UX remains calm, simple, and Vietnamese-first.
- AI coding workflows must point to canonical docs, not archive or adapter summaries.

## 10. Master Recommendation
AgentKid nên được coi là một `AI-assisted therapeutic support product` có domain boundaries nghiêm túc, không phải một chat app có thêm lesson và dashboard. Điều này quan trọng vì nếu implementation bắt đầu mà không giữ mindset này, system sẽ rất dễ trượt về hướng MVP glue architecture.

## 11. Decomposition Roadmap
Master design này cần được tách thành các sub-spec sau:

1. Platform Core Spec
2. Identity and Access Spec
3. Child Profile and Personalization Spec
4. Conversation Runtime Spec
5. Emotion Intelligence Spec
6. Memory System Spec
7. Lesson Engine Spec
8. Alerting and Safety Spec
9. Reporting and Parent Dashboard Spec
10. Deployment and Runtime Operations Spec

## 12. What Each Sub-Spec Must Answer
Mỗi sub-spec bắt buộc phải trả lời rõ:
- domain này sở hữu gì,
- domain này không sở hữu gì,
- canonical data contracts là gì,
- phần nào inline, phần nào async,
- các rủi ro chính là gì,
- nó map vào `apps/web`, `apps/worker`, và `packages/*` như thế nào.

## 13. Immediate Next Recommended Spec Order
Để build production-ready MVP hiệu quả, thứ tự spec nên là:

1. Platform Core Spec
2. Identity and Access Spec
3. Conversation Runtime Spec
4. Child Profile and Personalization Spec
5. Lesson Engine Spec
6. Emotion Intelligence Spec
7. Memory System Spec
8. Alerting and Safety Spec
9. Reporting and Parent Dashboard Spec
10. Deployment and Runtime Operations Spec

Lý do:
- platform + identity khóa foundation và ownership trước,
- conversation là hot path quan trọng nhất,
- lesson/emotion/memory/alerting phụ thuộc vào các lớp đó,
- reporting và operations nên bám trên behavior đã được chốt.

## 14. Review Outcome
Master review kết luận rằng AgentKid đã có foundation tốt nhưng chưa hoàn thiện hệ thống ở mức execution-grade. Master design này đóng vai trò cầu nối giữa:
- repo organization,
- product truth,
- architecture truth,
- future implementation planning.

Từ thời điểm tài liệu này được chấp thuận, các hoạt động thiết kế tiếp theo nên dựa trên master design này, không quay lại thiết kế theo layout MVP cũ hoặc source notes archived.
