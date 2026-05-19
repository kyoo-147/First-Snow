# API Guidelines

## Purpose
Các route handlers của AgentKid phải ưu tiên hợp đồng rõ ràng, ownership an toàn, và latency phù hợp với trải nghiệm session.

## Request and Response Rules
- Request and response shapes must be explicit and documented in `API_SPEC.md` and supporting engineering specs when needed.
- Route errors should be typed and predictable.
- Avoid ambiguous success responses with hidden partial failures.

## Auth Expectations
- Parent-owned routes must validate access through the ownership chain.
- Service-role operations are allowed only behind server-side business checks.
- Never trust client-supplied parent ownership claims by themselves.

## Async vs Blocking
- Child-facing latency-sensitive paths should avoid blocking on non-critical writes where safe.
- Persistence that is required for correctness must remain blocking.
- Background work must be retry-safe.

## Error Shape Guidance
- Return clear failure categories such as validation, auth, provider failure, or unavailable capability.
- Avoid leaking secrets or internal provider details.

## Idempotency Assumptions
- Alert writes and session summaries should tolerate retry scenarios.
- Post-session processing should avoid producing duplicate long-term memories if rerun.
