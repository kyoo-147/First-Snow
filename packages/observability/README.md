# Observability Package

Logging, tracing, metrics, and error reporting wrappers belong here.

## Current Foundation
- `createLogger()` emits structured JSON events.
- `createRequestId()` creates request/job correlation identifiers.
- Do not log raw transcripts, raw media, secrets, provider tokens, or full child PII.
