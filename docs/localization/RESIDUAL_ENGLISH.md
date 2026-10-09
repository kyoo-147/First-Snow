# Residual English Audit Report

This report summarizes the final status of active Vietnamese-first localization across AgentKid Snow (`snow-ui`).

## Intentional & Protocol Exceptions (Non-Residuals)

The following items are intentionally preserved in English or technical formatting and are not user-facing localization residuals:
- Brand and product names: `AgentKid`, `Snow`, `COPPA`, `FERPA`.
- Technical protocol identifiers, route segments, and API contract parameters (`/api/auth/*`, `/api/children`, `/api/safety/*`, query params like `callbackUrl`, `scope`, `token`).
- Database values, schema column names, and enum literals (e.g. `granted`, `revoked`, `completed`, `pending`).
- Machine error codes and server status codes (e.g. `SAFETY_ERROR`, `AUTH_REQUIRED`, `HTTP 401`, `HTTP 500`).
- Standard file-format identifiers and technical abbreviations (`JSON`, `CSV`, `ZIP`, `WSS`, `PIN`).
- Developer diagnostics and system logs.

## Active Residuals Resolved

All active user-facing localization residuals, accessibility labels, states, metadata, and VTuber parity gaps have been resolved:

1. **Root Loading, Error & 404 Screens**:
   - `src/app/loading.tsx`: Root accessible loading skeleton with `role="status"`, `aria-busy="true"`, and Vietnamese progress feedback (`t("common", "loading")`, `t("common", "aria.loading")`).
   - `src/app/error.tsx`: Root error boundary with `role="alert"`, Vietnamese guidance (`t("common", "errorState.defaultTitle")`, `t("common", "errorState.defaultDescription")`), retry actions (`reset()`), and home navigation.
   - `src/app/not-found.tsx`: Localized Vietnamese title, descriptive message, metadata, and accessible home navigation button.

2. **Route Metadata Coverage**:
   - Vietnamese `Metadata` exported across all active parent (`/parent`, `/parent/alerts`, `/parent/children/[childId]/*`, `/parent/consent`, `/parent/privacy`, `/parent/settings/*`), child (`/companion`, `/companion/avatar` via layout, `/mia`, `/session/*`), and admin (`/admin`, `/admin/companion`, `/admin/vision`, `/admin/system`) routes.

3. **Common Primitives & States**:
   - `ErrorState` (`src/components/ui/error-state.tsx`): Default title, message, and retry actions read from `src/i18n/locales/vi/common.json`.
   - `EmptyState` (`src/components/ui/empty-state.tsx`): Added default fallback title `t("common", "emptyState.noData")` and accessible `role="status"`.
   - `ProgressStrip` (`src/components/ui/progress-strip.tsx`): Added accessible `role="progressbar"` and Vietnamese `aria-label` defaulting to `t("common", "progress")`.
   - `AuthShell` (`src/components/auth/auth-shell.tsx`): Mascot image alt attribute localized to `t("common", "snowMascot")` ("Linh vật Snow").

4. **Learning & Activity Screens**:
   - `InteractiveLessonRunner` (`src/components/learning/interactive-lesson-runner.tsx`): Replaced hardcoded "Ordering list" with `t("learning", "runner.orderingList")`.
   - `ParentLearningView` (`src/components/learning/parent-learning-view.tsx`): Localized "Unable to load learning data" to `t("parent", "learningView.unableToLoad")`, practice time unit to `t("parent", "learningView.minutesUnit")` ("phút"), and completed lessons fraction to `t("parent", "learningView.ofAvailable")`.
   - `ChildRoutineScreen` & `ParentRoutinesScreen`: Localized API request error messages to `t("common", "error")`.

5. **Parent Governance, Transcripts & Account**:
   - `ParentTranscriptsScreen` (`src/components/pages/parent-transcripts-screen.tsx`):
     - Localized `formatTranscriptStatusTiles` return values with Vietnamese status tags and time formats (`t("parent", "transcripts.*")`).
     - Localized fallback error banners (`errorChildId`, `errorLoad`).
   - `ParentAccountScreen` (`src/components/pages/parent-account-screen.tsx`):
     - Localized account load/save errors and unknown device fallback (`t("parent", "account.*")`).
   - `ParentDashboard` (`src/components/pages/parent-dashboard.tsx`):
     - Localized fallback child name via `t("parent", "dashboard.defaultChildName")` ("Học sinh") and age via `t("parent", "dashboard.ageYears")`.
   - `ParentPrivacyScreen` (`src/components/pages/parent-privacy-screen.tsx`):
     - Localized default export recipient to `t("parent", "safety.export.household")` ("gia đình của bạn").
     - Synchronized eyebrow, titles, status tiles, toggle `aria-label`, select options (`{count} ngày`), and server action toasts.
   - `ParentTimelineScreen` (`src/components/pages/parent-timeline-screen.tsx`):
     - Localized dynamic child eyebrow (`Dòng thời gian của {name}`) and fallback `activityTimeline`.
     - Replaced corrupted character artifacts with standard unicode em-dashes (`—`).
   - `SimpleParentScreen` (`src/components/pages/simple-parent-screen.tsx`):
     - Localized all settings, safety, and reporting row summaries and sidebar metrics.

6. **Auth & Child Onboarding**:
   - `ChildProfileSelector` (`src/components/auth/child-profile-selector.tsx`):
     - Guardian requirement notices and fallback messages wired to Vietnamese catalog keys.

7. **Embedded VTuber vi/en/zh Parity & Accessibility**:
   - Added `CoursesPage.tsx` to `wired` test suite in `src/vtuber-app/src/__tests__/i18n-catalog.test.mjs`.
   - Added `kid.likeLesson` and `kid.unlikeLesson` across `vi`, `en`, and `zh` catalogs preserving 100% key parity.
   - Added accessible `role="button"` and dynamic `aria-label` to favorite heart button in `CoursesPage.tsx`.

## Verification

- **TypeScript Typecheck**: Passed cleanly (`npm run typecheck` / `tsc --noEmit`).
- **Vitest Suite**: 41 test files passed, 428 tests passed (`npx vitest run`).
- **Contracts Suite**: 87/87 tests passed (`npm run test:contracts`).
- **i18n Regression Suite**: All 7 i18n test files passed, 126/126 tests passed (`npx vitest run src/__tests__/i18n/`).
- **VTuber Catalog Test**: 5/5 tests passed (`node --test src/vtuber-app/src/__tests__/i18n-catalog.test.mjs`).
- **Git Diff Hygiene**: Clean diff verified via `git diff --check`.
