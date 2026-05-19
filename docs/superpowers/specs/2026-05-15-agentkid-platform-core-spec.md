# AgentKid Platform Core Spec

## Document Status
- Status: Draft for review
- Date: 2026-05-15
- Scope: Platform core for MVP production-ready foundation
- Depends on: `ARCHITECTURE.md`, `API_SPEC.md`, `CODING_STANDARDS.md`, `2026-05-15-agentkid-master-system-design.md`

## 1. Purpose
Tài liệu này định nghĩa lớp nền tảng kỹ thuật của AgentKid trước khi đi vào các domain nghiệp vụ cụ thể như identity, conversation, lesson, hay alerting. Mục tiêu là chốt một bộ quy tắc rõ ràng cho:
- runtime boundaries,
- package responsibilities,
- dependency direction,
- config and environment ownership,
- error and logging baseline,
- worker/job execution baseline,
- scaffold targets cho giai đoạn implementation đầu tiên.

Tài liệu này không mô tả đầy đủ nghiệp vụ của từng domain. Nó chỉ mô tả “khung máy” mà các domain sau này phải sống bên trong.

## 2. Design Goals
- Hỗ trợ `modular monolith` thay vì service sprawl sớm.
- Giữ hot path đơn giản và nhanh cho child-facing runtime.
- Đẩy các công việc nặng, retryable, và không cần realtime sang worker path.
- Ngăn route handlers biến thành nơi chứa business logic và provider glue.
- Tạo package boundaries đủ rõ để AI và engineer khác tiếp tục mà không tái phát minh cấu trúc.
- Tối ưu cho MVP production-ready, không cố giải quyết trước các nhu cầu enterprise chưa cần.

## 3. Runtime Boundaries
### 3.1 `apps/web`
`apps/web` là runtime chính của sản phẩm. Nó sở hữu:
- parent dashboard
- child session UI
- route handlers cho web/BFF
- authentication and authorization entrypoints
- latency-sensitive orchestration cho hot path

`apps/web` không được sở hữu:
- provider-specific logic phức tạp
- reusable domain contracts
- long-running post-session jobs
- retry-heavy side effects

### 3.2 `apps/worker`
`apps/worker` là runtime async của hệ thống. Nó sở hữu:
- post-session jobs
- retry-safe background processing
- memory extraction and embedding jobs
- progress scoring jobs
- alert retry/escalation support nếu việc đó không nên nằm trên hot path

`apps/worker` không được:
- trở thành auth authority
- tự phát minh ownership rules
- tự truy cập dữ liệu ngoài contract domain/database đã chốt

### 3.3 `packages/database`
`packages/database` sở hữu:
- schema definitions
- migrations
- RLS policies
- seeds
- typed helpers hoặc query contracts ở mức DB-facing

Nó không sở hữu:
- domain orchestration
- provider logic
- UI state

### 3.4 `packages/integrations`
`packages/integrations` sở hữu:
- adapters cho Google STT/TTS/Gemini/embeddings
- auth/database provider adapters at integration boundaries only
- Twilio, Zalo, Web Push adapters
- provider error normalization primitives

Nó không sở hữu:
- business decisions
- ownership checks
- route transport concerns

### 3.5 `packages/domain`
`packages/domain` sở hữu:
- domain types
- enums
- invariants
- cross-runtime contracts
- domain-facing interfaces và result shapes

Nó không phụ thuộc vào:
- framework UI code
- route handler code
- provider SDKs

### 3.6 `packages/config`
`packages/config` sở hữu:
- environment parsing
- config validation
- public vs server-only config split
- feature flag shape nếu xuất hiện

### 3.7 `packages/observability`
`packages/observability` sở hữu:
- structured logging contracts
- correlation ID helpers
- error classification helpers
- future tracing/metrics adapters

### 3.8 `packages/prompts`
`packages/prompts` sở hữu:
- prompt templates
- prompt builders
- prompt-specific helper functions

Prompt text không nên bị rải vào route handlers hoặc worker entrypoints.

### 3.9 `packages/testing`
`packages/testing` sở hữu:
- fixtures
- mocks
- shared test utilities
- browser matrix helpers

## 4. Dependency Direction
### 4.1 Allowed high-level dependency flow
- `apps/* -> packages/domain`
- `apps/* -> packages/config`
- `apps/* -> packages/observability`
- `apps/* -> packages/database`
- `apps/* -> packages/integrations`
- `apps/* -> packages/prompts`
- `apps/* -> packages/testing` for test-only code

### 4.2 Disallowed or discouraged flows
- `packages/domain -> packages/integrations`
- `packages/domain -> apps/*`
- `packages/database -> apps/*`
- `packages/integrations -> apps/*`
- UI code importing worker-only orchestration logic
- route handlers importing provider SDKs directly when an adapter exists or should exist

### 4.3 Rule of thumb
Nếu một module cần biết quá nhiều về HTTP, UI, provider SDK, và DB shape cùng lúc, nó đang ở sai boundary.

## 5. Config and Environment Strategy
### 5.1 Environment categories
Các env vars được chia thành:
- public client config
- server runtime config
- provider credentials
- alert channel credentials
- deployment/runtime metadata
- observability config

### 5.2 Ownership rules
- Chỉ `packages/config` được parse env vars trực tiếp.
- Các app hoặc package khác không nên tự đọc `process.env` tràn lan.
- `apps/web` và `apps/worker` lấy config thông qua typed accessors.

### 5.3 Public vs server-only
- Public config chỉ được expose khi thực sự cần cho browser.
- Mọi secret, provider token, service role, private key đều là server-only.
- Nếu có một env var chưa rõ public hay private, mặc định coi là private cho đến khi được chứng minh ngược lại.

### 5.4 Environment expectations
- `local`: có thể dùng provider thật hoặc mock, nhưng config contract phải giống production shape.
- `preview`: dùng để kiểm tra UI, route contracts, và basic integrations nếu phù hợp.
- `production`: mọi secret, ownership rule, logging policy phải bật đúng chuẩn.

## 6. Error Handling Baseline
### 6.1 Error categories
Toàn hệ thống nên normalize lỗi về các nhóm:
- validation error
- authentication error
- authorization error
- not found or concealed ownership miss
- provider failure
- dependency unavailable
- conflict or state transition error
- internal unexpected error

### 6.2 Error rules
- Route handlers không được trả raw provider errors ra ngoài.
- Worker jobs phải phân biệt lỗi retryable và non-retryable.
- Ownership failures không được làm lộ existence của records nhạy cảm.
- Domain invariants phải fail rõ ràng, không silently coerce.

### 6.3 Error recording
- Mọi lỗi quan trọng phải có structured log.
- Retry decisions trong worker phải được log kèm reason category.

## 7. Logging Baseline
### 7.1 Logging goals
- hiểu được request nào đã chạy gì
- trace được một session qua nhiều bước
- debug được failure mà không lộ dữ liệu nhạy cảm

### 7.2 What to log
- request or job start/end
- domain action name
- result category
- correlation/request/job IDs
- provider call high-level outcome
- retry count nếu có

### 7.3 What must not be logged
- raw secrets
- full auth tokens
- raw child audio/video
- unnecessarily complete transcript dumps
- sensitive parent or child identifiers beyond what is needed for debugging

### 7.4 Correlation model
Tối thiểu cần có:
- `requestId` cho web requests
- `jobId` cho worker jobs
- `sessionId` khi liên quan đến child session

Những ID này phải được truyền qua logs đủ nhất quán để follow một flow end-to-end.

## 8. Worker and Job Contract Baseline
### 8.1 Jobs allowed in async path
MVP production-ready cho phép đẩy các job sau sang worker:
- memory extraction
- embedding generation
- progress scoring
- non-critical summaries
- retryable alert follow-up

### 8.2 Jobs that should stay out of async path
Những việc cần phản hồi ngay cho child-facing runtime không nên bị đẩy async:
- auth gating
- ownership checks cho current request
- realtime STT/chat/TTS response
- minimal persistence cần để giữ session integrity

### 8.3 Job contract shape
Mỗi job nên có tối thiểu:
- stable job type
- typed payload
- correlation identifiers
- retry policy category
- explicit success/failure outcome

### 8.4 Idempotency baseline
Worker jobs phải được thiết kế để:
- safe khi retry
- không duplicate long-term memories vô hạn
- không tạo side effects lặp lại vô kiểm soát
- không phá vỡ ownership chain

### 8.5 Retry stance
MVP không cần queue platform quá phức tạp ngay, nhưng contract phải chuẩn bị cho:
- retryable provider failure
- non-retryable validation/config error
- visibility into exhausted retries

## 9. Initial Scaffold Target
### 9.1 `apps/web`
Khi bắt đầu scaffold thật, `apps/web` nên có:
- app shell
- auth boundary
- route handler entrypoints grouped by domain
- child session shell
- parent dashboard shell

Không nên nhồi domain logic vào folder structure kiểu screen-only.

### 9.2 `apps/worker`
Khi scaffold đầu tiên, `apps/worker` chỉ cần:
- worker app entrypoint
- job registration skeleton
- logging baseline
- one or two representative job flows như memory extraction and scoring placeholders

### 9.3 `packages/domain`
Phải xuất hiện sớm nhất với:
- shared enums
- shared interfaces
- domain result types
- base invariants where obvious

### 9.4 `packages/config`
Phải có:
- env schema
- public/server config split
- typed config accessors

### 9.5 `packages/database`
Phải có:
- schema file organization
- migration strategy
- RLS policy assets
- basic typed access helpers

### 9.6 `packages/integrations`
Phải có:
- provider adapter folders
- normalized client factories
- error mapping entrypoints

### 9.7 `packages/observability`
Phải có:
- logger interface
- log field conventions
- request/job correlation helpers

### 9.8 `packages/prompts`
Phải có:
- prompt builder organization by purpose
- Mia/system prompts
- lesson prompts
- memory/scoring prompts

### 9.9 `packages/testing`
Phải có:
- fixtures folder
- mocks strategy
- shared test helper skeleton

## 10. Mapping to Existing Backlog
### `TASK-001-platform-foundation-init`
Spec này bổ sung cho task đó:
- monorepo root shape
- app runtime role split
- initial scaffold expectations

### `TASK-002-platform-env-and-contracts`
Spec này bổ sung cho task đó:
- env ownership model
- config parsing rule
- `packages/domain` and `packages/config` baseline

### `TASK-003-database-postgres-foundation`
Spec này bổ sung cho task đó:
- `packages/database` role
- schema/migration/RLS separation
- database not owning domain orchestration

## 11. Follow-Up Gaps Still Remaining After This Spec
Spec này chưa giải quyết chi tiết:
- auth and consent flows
- session runtime state machine at execution detail
- lesson engine behavior
- alert severity semantics
- reporting payload design

Những phần đó phải được xử lý trong các sub-spec riêng như đã chốt trong master design.

## 12. Review Outcome
Platform Core Spec hoàn thiện lớp nền tảng cần thiết để bắt đầu scaffold code mà không phá vỡ production architecture ngay từ những commit đầu tiên. Sau khi spec này được duyệt, bước phù hợp tiếp theo là:
- cập nhật nếu cần vào backlog/platform tasks,
- rồi mới bắt đầu implementation scaffold cho `apps/web`, `apps/worker`, và các package nền.
