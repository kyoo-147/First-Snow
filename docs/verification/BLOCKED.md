# Snow E2E – Verification & Blocked Flows

Generated: 2026-10-03  
Suite: `e2e/critical-flow.e2e.ts`  
Config: `playwright.config.ts` (testDir: `./e2e`)

---

## Overview & Safety Policy

The Snow browser E2E suite is designed to validate critical release workflows while protecting shared environments from unintended data corruption.

### Read-Only vs. Mutating Tests

1. **Public Smoke (Read-Only):**
   - Executed by default when running `npx playwright test`.
   - Exercises publicly accessible routes (`/register`, `/session/home` redirect to `/child-login`).
   - Performs zero mutations against the target database.

2. **Authenticated Flows (Mutating):**
   - Exercises real user registration, child creation, session tokens, and lesson attempts.
   - **Strictly requires BOTH environment flags:**
     - `E2E_ALLOW_MUTATIONS=1`: Explicit authorization to write records.
     - `E2E_DISPOSABLE_DB=1` (or `E2E_DISPOSABLE_DB_ATTESTATION=1`): Attestation that the target database is a dedicated throwaway test environment.
   - If either flag is omitted, mutating tests are skipped automatically to protect non-disposable staging and development databases.
   - If `E2E_ALLOW_MUTATIONS=1` is provided without disposable DB attestation, the suite fails immediately with an error.

---

## Blocked Flows (Not Covered in E2E)

The following four major application subsystems are **NOT COVERED** by browser E2E tests and are explicitly marked **BLOCKED**:

### 1. Companion Flows (Voice & Chat)
- **Routes / Components:** `/companion`, `/companion/talk`, `/companion/avatar`, `/api/companion/sessions`, `/api/companion/ws-ticket`, `/api/alerts`, `/api/children/[childId]/transcripts`
- **Status:** 🚫 **BLOCKED — NOT COVERED in browser E2E**
- **Why Blocked:**
  - Full voice companion interaction requires live browser audio capture permissions (`getUserMedia`), WebAudio processing, and the ONNX / `@ricky0123/vad-web` voice activity detection model.
  - Requires a persistent WebSocket connection to an active companion streaming server with real-time speech/LLM synthesis.
  - Headless browser runners cannot reliably instantiate audio devices or emulate bi-directional voice streams without a specialized audio fixture.
- **Current Coverage:** Verified at the unit and contract test level via `src/__tests__/companion/*.test.ts` and `src/vtuber-app/src/__tests__/*.test.mjs`.
- **To Unblock for E2E:** Implement a mock audio input stream injector in Playwright or an HTTP-mocked WebSocket sidecar for the companion voice protocol.

### 2. Multi-Household Tenant Data Isolation
- **Routes / Components:** Cross-household data boundaries (`src/server/__tests__/cross-household.test.ts`), household-scoped API endpoints (`/api/children`, `/api/alerts`, `/api/privacy`).
- **Status:** 🚫 **BLOCKED — NOT COVERED in browser E2E**
- **Why Blocked:**
  - Validating tenant isolation requires setting up multiple distinct guardian accounts with separate households, maintaining independent authenticated browser contexts in parallel, and attempting cross-household reads/writes to assert `403 Forbidden` responses.
  - Single-user smoke flows cannot attest to multi-tenant safety without an orchestrator for cross-household credential exchange.
- **Current Coverage:** Enforced at the database and server route handler level; verified via integration tests in `src/server/__tests__/cross-household.test.ts`.
- **To Unblock for E2E:** Create a dedicated multi-tenant fixture that provisions Household A and Household B and asserts forbidden cross-access across two browser contexts.

### 3. Admin Dashboard & Privileged Controls
- **Routes / Components:** `/admin/companion`, `src/components/admin/admin-shell.tsx`, `src/components/pages/admin-dashboard-screen.tsx`
- **Status:** 🚫 **BLOCKED — NOT COVERED in browser E2E**
- **Why Blocked:**
  - Admin surfaces require pre-provisioned administrator role credentials and session cookies.
  - There is no public self-service registration route for administrative accounts.
  - Seeding admin users and credentials into live test databases requires direct database access or administrative auth fixtures that are out of scope for public smoke testing.
- **Current Coverage:** Covered via component tests and server middleware unit tests.
- **To Unblock for E2E:** Provide an administrative seed profile or an environment-gated admin SSO mock in staging.

### 4. Privacy Controls & Account Deletion
- **Routes / Components:** `/parent/privacy`, `/api/privacy`, `src/components/safety/deletion-request-dialog.tsx`, `src/components/safety/reauth-modal.tsx`
- **Status:** 🚫 **BLOCKED — NOT COVERED in browser E2E**
- **Why Blocked:**
  - Privacy flows involve irreversible data deletion (purging guardian, child, and lesson progress records).
  - Executing real deletion during an E2E run destroys the test subject and invalidates subsequent test assertions.
  - Deletion requests require parent safety re-authentication (password confirmation modal), which requires dedicated modal and asynchronous job testing fixtures.
- **Current Coverage:** Verified via server-level safety tests in `src/server/safety/safety.test.ts`.
- **To Unblock for E2E:** Build an isolated teardown verification test that runs strictly as the final step of a disposable container run.

---

## Infrastructure Blockers in Authenticated Flows

### 5. PIN Pad UI Interaction
- **Status:** 🚫 **BLOCKED — Handled via API Fallback**
- **Why Blocked:** Digit buttons in `ChildLoginView` depend on dynamic runtime ARIA labels that could not be verified against a live UI server at commit time.
- **Mitigation:** The child session is authenticated deterministically via `POST /api/auth/child-login` using the real database session API (no mocking).

### 6. Test-Owned Database Cleanup
- **Status:** 🚫 **BLOCKED — Relies on Disposable DB Attestation**
- **Why Blocked:** The application exposes no administrative bulk-deletion API endpoint. Direct SQL connection from the Playwright process is intentionally avoided to keep the test runner decoupled from database internals.
- **Mitigation:** Test records use unique timestamped emails (`e2e-<timestamp>-<rand>@example.test`) and mutating runs are gated on disposable DB attestation (`E2E_DISPOSABLE_DB=1`).

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
| Test-owned DB cleanup | Teardown | 🚫 BLOCKED | No public delete API; requires disposable DB |
| Companion voice & chat interactions | Companion | 🚫 BLOCKED (NOT COVERED) | Audio/VAD/WebSocket infrastructure required |
| Cross-household tenant isolation | Security | 🚫 BLOCKED (NOT COVERED) | Multi-tenant browser test fixture required |
| Admin dashboard & system configuration | Admin | 🚫 BLOCKED (NOT COVERED) | Privileged admin credential seeding required |
| Privacy controls & data deletion | Safety | 🚫 BLOCKED (NOT COVERED) | Destructive deletion & safety reauth required |
