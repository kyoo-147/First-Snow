# TASK-012 Observability Foundation

## Status
Done.

## Goal
Close the observability package scaffold so future route handlers and workers have a shared logging/correlation contract.

## Completed Implementation
- `@agentkid/observability` now has TypeScript build/lint/test scripts.
- Added `createLogger()` structured JSON logger helper.
- Added `createRequestId()` and `mergeCorrelationIds()` helpers.
- Documented privacy logging guardrail in the package README.
- Added a root workspace script runner so repo-level `build`, `lint`, and `test` do not require local Turbo bootstrap.

## Acceptance
- Package builds with `tsc --noEmit`.
- Log event shape supports request, job, and session correlation.
- Logging docs prohibit raw media, secrets, provider tokens, and child PII.
