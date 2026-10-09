# Task 6e4939dc04f2 — Mia AI-Chat CTA Scanning & Routing Verification Report

## Task Overview
- **Task ID**: `task_6e4939dc04f2`
- **Canonical Base**: `3dd1dad8a8bfd19f3289d94b5f557ba07f4e263c`
- **Worktree**: `C:/Users/hoang/orca/workspaces/snow-ui/snow-agy-mia-v2`
- **Branch**: `kyoo-147/snow-agy-mia-v2`
- **Scope**: Navigation, routes, tests, and audit reporting only.

---

## 1. CTA Audit & Routing Verification

A comprehensive audit of active CTAs across the main application and the embedded VTuber companion app was conducted to verify routing to internal `/mia` for AI chat while preserving auth guards, role guards, accessibility, and back behavior.

### Confirmed AI-Chat CTAs Routing to `/mia`

| Location | Component / File | Purpose | Route Target | Focus Ring / Accessibility |
| :--- | :--- | :--- | :--- | :--- |
| Child Sidebar | `src/data/snow-data.ts:26` | Start AI companion chat from sidebar | `/mia` | Native Link (`snow-focus-ring`) |
| Top Navigation | `src/data/snow-data.ts:34` | Open AI assistant from header bar | `/mia` | Native Link (`snow-focus-ring`) |
| Route Cards | `src/data/snow-data.ts:156` | "Trò chuyện cùng AgentKid" quick launch | `/mia` | Native Link (`snow-focus-ring`) |
| Home Primary Actions | `src/components/pages/home-screen.tsx:124` | Primary "talk" action card | `/mia` | Native Link (`snow-focus-ring`) |
| Home Hero Talk Card | `src/components/pages/home-screen.tsx:184` | Hero "Trò chuyện" interactive card | `/mia` | Native Link (`snow-focus-ring`) |
| Routine Calm Pause | `src/components/pages/child-routine-screen.tsx:137` | Calm pause "Nói chuyện cùng AgentKid" | `/mia` | Native Link (`snow-focus-ring`) |
| Activities Mood Check-in | `src/components/pages/child-activities-screen.tsx:156` | Continue with Snow after mood check-in | `/mia?mood=<selected>` | Native Link (`snow-focus-ring`) |
| Avatar Companion Back Button | `src/app/(child)/companion/avatar/page.tsx:17` | Return from Live2D avatar mode to AI chat | `/mia` | Native Link (`snow-focus-ring`) |

### Preserved Non-Chat Controls & Exclusions

The following controls and destinations were strictly preserved and not redirected to `/mia`:

1. **Lessons & Curriculum**:
   - `src/components/lessons/lesson-card.tsx` routes to `/session/lessons/:lessonId`.
   - `src/components/learning/lesson-catalog.tsx` routes to `/session/lessons/:lessonId`.
   - `src/components/pages/child-routine-screen.tsx:135` routes to `/session/lessons`.
   - `src/components/pages/explore-screen.tsx:81` routes to `/session/lessons`.
2. **Settings & Profiles**:
   - `src/components/pages/settings-screen.tsx:42` routes to `/parent/settings/account`.
   - `src/components/app-shell/app-shell.tsx:103` routes to `/session/settings`.
3. **Safety, Privacy & Consent**:
   - `src/components/safety/emergency-contact-dialog.tsx` preserves internal emergency modal controls.
   - `src/components/safety/data-export-dialog.tsx` preserves data export flows.
   - `src/components/safety/deletion-request-dialog.tsx` preserves deletion request flows.
   - `src/data/snow-data.ts:57-59` preserves `/parent/privacy` and `/parent/consent`.
4. **Transcripts & Alerts**:
   - `src/components/pages/parent-transcripts-screen.tsx` preserves transcript review.
   - `src/components/pages/parent-alerts-screen.tsx` preserves alert inspection.
5. **Compatibility Routes**:
   - `src/app/(child)/companion/page.tsx` remains explicit deprecated compatibility entrypoint.
   - `src/app/(child)/companion/talk/page.tsx` maintains explicit compatibility redirect to `/companion`.
6. **Embedded VTuber Controls**:
   - `src/components/vtuber-wrapper.tsx` hosts `VtuberScreen` featuring Live2D canvas, settings drawer, group drawer, history drawer, and footer (mic toggle, speech interrupt, message input) without redirecting or hijacking external page navigation.

---

## 2. Authentication, Role Guards & Back Behavior

### Proxy Route Guards (`src/proxy.ts`)
- `/mia` is explicitly declared in `CHILD_ROUTES` alongside `/session`, `/companion`, `/lessons`, `/activities`, `/rewards`.
- `config.matcher` includes `/mia/:path*`.
- Unauthenticated requests to `/mia` fail closed with `307` redirect to `/child-login`.
- Requests bearing parent credentials only are rejected and redirected to `/child-login`.
- Active child sessions verify the signed JWT and check revocation against PostgreSQL via `isDbSessionValid`. Revoked or deactivated child sessions immediately fail closed.

### Accessibility & Back Navigation
- All links to `/mia` use Next.js native `<Link>` tags with `snow-focus-ring` classes for accessible keyboard focus and visual indication.
- Avatar mode at `/companion/avatar` includes a dedicated back button `<Link href="/mia">` with `snow-focus-ring` and `ChevronLeft` icon, returning the child cleanly to the canonical `/mia` chat screen.

---

## 3. Test & Verification Matrix

| Verification Check | Command | Result | Summary |
| :--- | :--- | :--- | :--- |
| **Mapping Contract Tests** | `npx vitest run src/__tests__/mia-cta-mapping.test.ts` | **PASSED** | 7/7 tests passed: confirms all AI-chat CTAs route to `/mia`, focus rings present, unrelated controls preserved, proxy guard contracts checked. |
| **Proxy Route Guard Tests** | `npx vitest run src/__tests__/proxy.test.ts` | **PASSED** | 24/24 tests passed: covers unauthenticated, parent token rejection, active session authorization, DB failure fail-closed on `/mia`. |
| **TypeScript Typecheck** | `npm run typecheck` | **PASSED** | Zero type errors across the entire repository. |
| **Unit & Integration Suite** | `vitest run` | **PASSED** | 41 test files, 427 tests passed. |
| **Contracts Suite** | `npm run test:contracts` | **PASSED** | Node contracts, companion server tsx tests, voice-client contracts all passed. |
| **Full Verification Suite** | `npm test` | **PASSED** | Complete Vitest test run + test:contracts run completed cleanly. |
| **Git Diff Check** | `git diff --check` | **PASSED** | Zero whitespace or formatting defects. |

---

## 4. Verification Verdict

**VERIFIED** (SHA: see commit)
