# Snow E2E – Verification & Blocked Flows

Generated: 2026-10-03  
Suite: `e2e/critical-flow.e2e.ts`  
Config: `playwright.config.ts` (testDir: `./e2e`)

---

## Overview & Safety Policy

The Snow browser E2E suite validates critical release workflows while protecting shared environments from unintended data corruption.

### Read-Only vs. Mutating Tests

1. **Public Smoke (Read-Only):**
   - Executed by default when running `npx playwright test`.
   - Exercises unauthenticated public routes (`/register`, `/session/home` redirect to `/child-login`).
   - Performs zero mutations against the target database.

2. **Authenticated Flows (Mutating):**
   - Exercises real user registration, child creation, session tokens, lesson attempts, companion sessions, cross-household isolation boundaries, admin RBAC denial, and privacy consent updates.
   - **Strictly requires BOTH environment flags:**
     - `E2E_ALLOW_MUTATIONS=1`: Explicit authorization to write records.
     - `E2E_DISPOSABLE_DB=1` (or `E2E_DISPOSABLE_DB_ATTESTATION=1`): Attestation that the target database is a dedicated throwaway test environment.
   - If either flag is omitted, mutating tests are skipped automatically to protect non-disposable staging and development databases.
   - If `E2E_ALLOW_MUTATIONS=1` is provided without disposable DB attestation, the suite fails immediately with an error.

---

## Executable Flows Converted from Previous Blocks

Where current product contracts permit without external third-party dependencies, previously blocked areas have been converted into executable real API/browser tests:

### 1. Companion Provider-Unavailable Flow
- **Coverage:** Executable in `e2e/critical-flow.e2e.ts`.
- **Contract Tested:** When a child initiates a companion session (`POST /api/companion/sessions`) and submits a message (`POST /api/companion/sessions/:id/messages`) without an external AI provider configured, the server truthfully responds with HTTP 503 `PROVIDER_UNAVAILABLE` while persisting the child message in session history.

### 2. Cross-Household Tenant Data Isolation
- **Coverage:** Executable in `e2e/critical-flow.e2e.ts`.
- **Contract Tested:** Multi-tenant isolation verified by provisioning two independent guardian households (Household A and Household B) with distinct child profiles across separate browser contexts. Probes from Household B to Household A's transcripts (`/api/children/:id/transcripts`), alerts (`/api/alerts?childId=:id`), and companion messages (`/api/companion/sessions/:id/messages`) all receive HTTP 403 `FORBIDDEN`.

### 3. Parent Admin Access Denial (Strict RBAC)
- **Coverage:** Executable in `e2e/critical-flow.e2e.ts`.
- **Contract Tested:** Authenticated parents (role: `parent`) attempting to access administrative API endpoints (`GET /api/admin/dashboard`) receive HTTP 403 `FORBIDDEN` with `"Admin access required"`. Navigating to `/admin/companion` in the browser renders the truthful error denial state (`"Unable to load admin data"` / `"Admin access required"`).

### 4. Privacy Consent & Re-Authentication Flows
- **Coverage:** Executable in `e2e/critical-flow.e2e.ts`.
- **Contract Tested:** Authenticated guardians navigate to `/parent/privacy`, verifying that capability consent controls (Microphone, Camera) render. The test executes `GET /api/privacy`, asserts rejection of consent modifications with invalid password (`401 INVALID_CREDENTIALS`), and persists updated capability consents with valid password verification (`200 OK` on `PATCH /api/privacy`), confirming database persistence.

---

## Genuinely Blocked External Flows

The following flows cannot be executed in browser E2E without real hardware or third-party external services and remain **BLOCKED**:

### 1. Live2D Visual Canvas & Character Assets
- **Status:** 🚫 **BLOCKED (GENUINELY EXTERNAL)**
- **Why Blocked:** Requires the proprietary Live2D Cubism WebGL canvas runtime and external character model assets (`.moc3` / textures) that are unconfigured in headless CI.

### 2. Live External Voice Streaming & Hardware Microphone Capture
- **Status:** 🚫 **BLOCKED (GENUINELY EXTERNAL)**
- **Why Blocked:** End-to-end voice loopback requires physical operating system microphone hardware access and an active upstream speech synthesis/transcription provider.

### 3. PIN Pad UI Button Clicks
- **Status:** 🚫 **BLOCKED (Handled via API Session Fallback)**
- **Why Blocked:** Sourced from runtime dynamic component attributes not statically verifiable without visual inspect tooling; the critical path child login is executed via authenticated API (`POST /api/auth/child-login`).

### 4. Direct Database-Owned Teardown / Bulk Tenant Purge
- **Status:** 🚫 **BLOCKED (Relies on Disposable DB Attestation)**
- **Why Blocked:** The application exposes no administrative bulk-deletion endpoint. Decoupled Playwright runs must run against disposable databases.

---

## Comprehensive Flow Coverage Matrix

| Flow | Category | Status | Verification & Evidence |
|------|----------|--------|-------------------------|
| Unauthenticated redirect to `/child-login` | Public Smoke | ✅ COVERED | `e2e/critical-flow.e2e.ts` (read-only) |
| Guardian registration page render | Public Smoke | ✅ COVERED | `e2e/critical-flow.e2e.ts` (read-only) |
| Guardian registration submission | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Child profile creation | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Child PIN authentication (API) | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Child PIN pad UI button click | Authenticated | 🚫 BLOCKED | Sourced from runtime component; API fallback used |
| Child session home access | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Lesson list retrieval | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Lesson attempt creation & completion | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Child logout & Guardian re-login | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Parent views child learning progress | Authenticated | ✅ COVERED | `e2e/critical-flow.e2e.ts` (gated by `E2E_ALLOW_MUTATIONS=1`) |
| Companion provider-unavailable truthful error | Companion | ✅ COVERED | `e2e/critical-flow.e2e.ts` (503 response & message persistence) |
| Multi-household tenant data isolation | Security | ✅ COVERED | `e2e/critical-flow.e2e.ts` (403 on cross-household transcripts/alerts/sessions) |
| Parent admin access denial (strict RBAC) | Admin | ✅ COVERED | `e2e/critical-flow.e2e.ts` (403 on `/api/admin/dashboard` & UI denial) |
| Privacy consent & re-authentication | Privacy / Safety | ✅ COVERED | `e2e/critical-flow.e2e.ts` (UI, 401 on bad reauth, 200 on consent PATCH) |
| Live2D visual model rendering | External | 🚫 BLOCKED | Requires external Live2D runtime and model assets |
| Live external voice streaming & hardware mic | External | 🚫 BLOCKED | Requires physical microphone and external voice provider |
| Test-owned DB cleanup | Teardown | 🚫 BLOCKED | No public delete API; requires disposable test database |
