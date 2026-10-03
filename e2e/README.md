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

Mutating tests write records to the target database (guardian registration, child profiles, lesson attempts, companion sessions, privacy settings). They **require** explicit mutation permission and disposable DB attestation:

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
| `e2e/critical-flow.e2e.ts` | Public smoke tests (read-only), authenticated critical flows (registration, lesson completion, companion-unavailable, cross-household isolation, parent admin denial, privacy consent), and genuinely blocked external flow annotations |

## Executable Flows Covered

- **Public Smoke (Read-Only):**
  - Unauthenticated redirect from `/session/home` to `/child-login`.
  - Public `/register` form rendering.
- **Authenticated Flows (Mutating — requires `E2E_ALLOW_MUTATIONS=1` and `E2E_DISPOSABLE_DB=1`):**
  - Guardian registration, child creation, child sign-in, and lesson completion.
  - **Companion Provider-Unavailable:** Child initiates companion session, verifies truthful HTTP 503 `PROVIDER_UNAVAILABLE` when external AI is unconfigured, and confirms child message persistence.
  - **Cross-Household Tenant Isolation:** Provisions two separate households across independent browser contexts; verifies HTTP 403 `FORBIDDEN` across cross-household transcripts, alerts, and companion messages.
  - **Parent Admin Denial:** Strictly rejects non-admin parents from administrative API (`GET /api/admin/dashboard` returns 403) and displays denial state in `/admin/companion` UI.
  - **Privacy Consent & Safety:** Verifies `/parent/privacy` UI controls, enforces password re-authentication (401 on failure), updates capability consents via `PATCH /api/privacy`, and validates database persistence.

## Genuinely Blocked Flows (Not Covered)

The following flows require external third-party runtimes or physical hardware and remain **BLOCKED**. Documented in full in [docs/verification/BLOCKED.md](../docs/verification/BLOCKED.md):

| Flow | Status | Reason & Rationale |
|------|--------|--------------------|
| Live2D visual model rendering & character assets | 🚫 BLOCKED | Requires external Live2D Cubism WebGL runtime and model assets |
| Live external voice streaming & hardware microphone | 🚫 BLOCKED | Requires physical microphone device permissions and external speech synthesis service |
| PIN pad UI button clicks | 🚫 BLOCKED | Runtime digit selectors unverified in static CI; authenticated API fallback used |
| Direct DB teardown / bulk tenant purge | 🚫 BLOCKED | No public delete API; requires disposable test database |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_ALLOW_MUTATIONS` | unset / `0` | Set to `1` to authorize mutating tests (registration, child creation, lesson completion, privacy updates) |
| `E2E_DISPOSABLE_DB` / `E2E_DISPOSABLE_DB_ATTESTATION` | unset / `0` | Set to `1` to attest that the target database is disposable and safe for test writes |
| `E2E_BASE_URL` | `http://127.0.0.1:3000` | Base URL of the target server. When omitted, Playwright starts local dev server |
| `DATABASE_URL` | from `.env.local` | Database connection string for the dev server started by Playwright |
| `CI` | unset | Enables `forbidOnly`, 2 retries, and `line` reporter |
