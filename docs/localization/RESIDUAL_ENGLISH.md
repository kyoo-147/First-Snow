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

All active user-facing localization residuals have been resolved:

1. **Root 404 Not Found Screen** (`src/app/not-found.tsx`):
   - Localized Vietnamese title, descriptive message, metadata, and accessible home navigation button.

2. **Common Primitives & States**:
   - `ErrorState` (`src/components/ui/error-state.tsx`): Default title, message, and retry actions now read from `src/i18n/locales/vi/common.json`.
   - `ProgressStrip` (`src/components/ui/progress-strip.tsx`): Added accessible `role="progressbar"` and Vietnamese `aria-label` defaulting to `t("common", "progress")`.

3. **Parent Safety & Governance Controls**:
   - `ParentPrivacyScreen` (`src/components/pages/parent-privacy-screen.tsx`):
     - Synchronized eyebrow, titles, status tiles, toggle `aria-label`, select options (`{count} ngày`), and server action toasts with `src/i18n/locales/vi/parent.json`.
     - Localized export and deletion dialog trigger buttons and calm-copy privacy banners.
   - `CapturePolicyBanner` and `ConsentScopeCard`: Full Vietnamese translations verified and regression tested.

4. **Parent Timeline & Progress Screens**:
   - `ParentTimelineScreen` (`src/components/pages/parent-timeline-screen.tsx`):
     - Localized dynamic child eyebrow (`Dòng thời gian của {name}`) and fallback `activityTimeline`.
     - Replaced corrupted character artifacts with standard unicode em-dashes (`—`).
   - `ProgressScreen` (`src/components/pages/progress-screen.tsx`):
     - Localized minute formatting via `progressScreen.zeroMinutes`, `hoursMinutesUnit`, and `minutesUnit`.
   - `SimpleParentScreen` (`src/components/pages/simple-parent-screen.tsx`):
     - Localized all settings, safety, and reporting row summaries and sidebar metrics.

5. **Auth & Child Onboarding**:
   - `ChildProfileSelector` (`src/components/auth/child-profile-selector.tsx`):
     - Guardian requirement notices and fallback messages wired to Vietnamese catalog keys.

6. **Child Companion & Mockup Views**:
   - `ActivitiesScreen`, `LibraryScreen`, `CreateStoryScreen`: Localized headings, steps, button text, search placeholders, and tags into Vietnamese.

7. **VTuber Companion App Boundary**:
   - Maintained strict i18next runtime boundary.
   - Added assistant names (`kid.assistant1Name`, `assistant2Name`, `assistant3Name`) across `vi`, `en`, and `zh` translation catalogs, preserving full 3-way key parity.
   - Connected `ModeSelectionScreen` and `AssistantsPage` to translated assistant titles.

## Verification

- **TypeScript Typecheck**: Passed cleanly (`tsc --noEmit`).
- **Vitest & Contract Suite**: 36 test files passed, 386 tests passed.
- **Regression Suite**: Added and verified `src/__tests__/i18n/residuals-regression.test.tsx` (7/7 tests passing).
- **VTuber Catalog Test**: Verified 3-way parity via `node --test src/vtuber-app/src/__tests__/i18n-catalog.test.mjs` (5/5 tests passing).
- **Git Diff Hygiene**: Clean diff without whitespace errors or corrupted encoding.
