# Snow browser E2E

Tests live under `e2e/` and are driven by `playwright.config.ts` in the repo root.  
The Playwright import path is `playwright/test` (uses the pre-existing `playwright` devDependency; no `@playwright/test` package is needed or added).

## Running

### Public Smoke Tests (Read-Only)

By default, the suite runs in read-only mode, executing unauthenticated public page checks without modifying any database records:

```bash
# Direct Playwright execution
npx playwright test

# Or via the runner script
npx tsx scripts/e2e/run.ts

# Against an external server
E2E_BASE_URL=https://staging.example.com npx playwright test
```

### Full Authenticated Flows (Mutating)

Mutating tests write records to the target database (guardian registration, child profiles, lesson attempts). They **require** explicit mutation permission and disposable DB attestation:

```bash
# 1. Apply migrations + seed lessons on disposable database
npm run db:migrate
npm run db:seed

# 2. Run mutating suite with attestation
E2E_ALLOW_MUTATIONS=1 E2E_DISPOSABLE_DB=1 npx playwright test

# Or via the runner script
E2E_ALLOW_MUTATIONS=1 E2E_DISPOSABLE_DB=1 npx tsx scripts/e2e/run.ts
```

## Suite Layout

| File | Description |
|------|-------------|
| `e2e/critical-flow.e2e.ts` | Public smoke tests (read-only), authenticated release flow (mutating), and explicit blocked test annotations |

## Blocked Flows (Not Covered)

The following flows cannot be executed in browser E2E without additional mock or environment infrastructure. They are documented in detail in [docs/verification/BLOCKED.md](../docs/verification/BLOCKED.md):

| Flow | Status | Reason & Rationale |
|------|--------|--------------------|
| Companion voice & chat sessions | 🚫 BLOCKED (NOT COVERED) | Requires live browser audio hardware, VAD Web ONNX runtime, and WebSocket streaming server |
| Multi-household tenant data isolation | 🚫 BLOCKED (NOT COVERED) | Requires multi-household test fixture and cross-account probe credentials |
| Admin dashboard & controls | 🚫 BLOCKED (NOT COVERED) | Requires privileged administrator role provisioning outside public registration |
| Privacy controls & data deletion | 🚫 BLOCKED (NOT COVERED) | Destructive data purge and parent safety re-auth modal verification |
| PIN pad UI button clicks | 🚫 BLOCKED | Runtime digit button selectors unverified in static CI; authenticated API fallback used |
| Test-owned DB cleanup | 🚫 BLOCKED | No public delete API; requires disposable test database |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_ALLOW_MUTATIONS` | unset / `0` | Set to `1` to authorize mutating tests (guardian registration, child creation, lesson completion) |
| `E2E_DISPOSABLE_DB` / `E2E_DISPOSABLE_DB_ATTESTATION` | unset / `0` | Set to `1` to attest that the target database is disposable and safe for test writes |
| `E2E_BASE_URL` | `http://127.0.0.1:3000` | Base URL of the target server. When omitted, Playwright starts local dev server |
| `DATABASE_URL` | from `.env.local` | Database connection string for the dev server started by Playwright |
| `CI` | unset | Enables `forbidOnly`, 2 retries, and `line` reporter |
