# Security Review

## Auth Boundaries
- Treat the authenticated subject from the chosen auth implementation as the identity root.
- Map that subject to a parent profile record in PostgreSQL.
- Enforce parent ownership server-side for all sensitive reads and writes.

## Database Access Rules
- PostgreSQL must be private to the server or Docker network.
- Browser clients must never connect directly to PostgreSQL.
- Server-side services must not bypass parent ownership checks.
- Worker jobs must use explicit job/session identifiers and enforce system-job authorization.

## Secrets Handling
- Provider secrets belong in environment variables only.
- Do not log raw secrets, full provider payloads, or sensitive personal data.

## Abuse and Overreach
- Avoid collecting more child data than needed for MVP behavior.
- Do not persist raw media without an explicit accepted decision and policy update.
- Alerting systems must avoid sending unnecessary personal details through third-party channels.
