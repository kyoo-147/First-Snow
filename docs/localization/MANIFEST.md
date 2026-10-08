# AgentKid Localization — Manifest & Architecture

> **Wave:** 1 — Foundation
> **Branch:** kyoo-147/snow-vi-foundation-cmdc
> **Locale:** vi (Vietnamese, vi-VN for Intl APIs)
> **Committed at:** See git log for SHA

---

## Overview

This document defines the localization architecture for AgentKid's main Next.js application. It covers:

1. **Catalog-based i18n layer** — `src/i18n/**`
2. **VTuber i18next subsystem** — `src/vtuber-app/src/i18n.ts` (separate runtime)
3. **Boundary contract** between the two systems
4. **Namespace registry**
5. **Format utilities**
6. **Wave roadmap**

---

## 1. Main App — Catalog Layer (`src/i18n/`)

### Architecture

The main app uses a **static-catalog, pure-function** approach:

```
src/i18n/
  index.ts          ← public API: t(), interpolate(), re-exports
  catalog.ts        ← getCatalogMap(), getNamespaceCatalog(), lookupKey()
  types.ts          ← Locale, Namespace, InterpolationVars, DottedKey
  locales/
    vi/
      common.json   ← shared UI chrome
      auth.json     ← login/register/session/password
      child.json    ← child-facing learning UI
      parent.json   ← parent dashboard/monitoring
      learning.json ← lesson catalog, quiz, progress
      companion.json← AI companion chat/voice/states
```

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Server/client safe** | No browser globals. Safe in Server Components, Client Components, Route Handlers, Node.js tests. |
| **No runtime loading** | All catalogs are statically bundled via import. No `fetch`, no `fs.readFile`. |
| **Pure functions** | `t()`, `interpolate()`, `lookupKey()` have no side effects and no module-level mutable state. |
| **Catalog-based, not runtime** | Messages are pre-bundled JSON; no i18next instance, no React context, no async provider. |
| **Typed API** | `Namespace`, `Locale`, `InterpolationVars` types. Typed re-exports from `@/i18n`. |
| **Vietnamese-first** | `DEFAULT_LOCALE = "vi"`. Wave 1 supports only `vi`. |
| **Interpolation convention** | `{{varName}}` placeholders, matching VTuber catalog convention for future unification potential. |

### Public API

```typescript
import { t, interpolate } from "@/i18n";

// Simple lookup
t("common", "save")                           // → "Lưu"
t("common", "date.today")                     // → "Hôm nay"

// Interpolation
t("child", "greeting", { name: "An" })        // → "Xin chào, An!"
t("common", "date.daysAgo", { count: 3 })     // → "3 ngày trước"
t("learning", "lesson.quiz.question", { number: 1, total: 10 })

// Standalone interpolation (for dynamic templates)
interpolate("{{count}} bài học", { count: 5 }) // → "5 bài học"
```

### Missing Key Behavior

- In `development`/`test`: `console.warn` + returns sentinel `"namespace:key"`
- In `production`: silently returns sentinel (no crash)

This ensures missing keys surface during development without crashing production.

---

## 2. VTuber Subsystem — i18next Runtime (`src/vtuber-app/src/i18n.ts`)

### What It Is

The VTuber companion panel is an embedded Electron-adjacent React app that pre-dates the main AgentKid UI. It has its own fully independent i18n stack:

- **Library:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Entry point:** `src/vtuber-app/src/i18n.ts`
- **Catalogs:** `src/vtuber-app/src/locales/{en,vi,zh}/translation.json`
- **Current default locale:** `vi` (already Vietnamese-first)
- **Namespaces:** single `translation` namespace
- **Runtime language switch:** Yes — reads from `localStorage`, updates `document.documentElement.lang`

### Boundary Contract

> **These two systems MUST remain completely separate.**

| Rule | Reason |
|------|--------|
| Never `import i18next` or `react-i18next` in `src/i18n/**` | The main catalog layer is server-safe; i18next is browser-only |
| Never import `src/i18n/**` into `src/vtuber-app/**` | VTuber has its own catalog, its own runtime, its own language switch |
| Do NOT merge the `translation` namespace from VTuber into the main namespaces | Different key structures, different teams, different lifecycles |
| Do NOT add `LanguageDetector` to the main app layer | Wave 1 is Vietnamese-fixed; language detection belongs to a later wave with route-based locale |
| VTuber's `document.documentElement.lang` writes are scoped to its own component mount | The root `layout.tsx` `lang="vi"` is the authoritative HTML lang for the main app |

### Why Two Systems

The VTuber subsystem needs:
- Browser-only APIs (`document`, `localStorage`)
- Runtime language switching (user can change mid-session)
- React Suspense with `useSuspense: true`
- Detection from `navigator.language`

The main AgentKid app needs:
- Server Component compatibility (no browser APIs at render time)
- Zero-JS-overhead string lookup (no React context, no hydration)
- Static bundling for Edge/SSR performance

These requirements are incompatible in a single runtime. The boundary is a feature, not a workaround.

---

## 3. Namespace Registry

| Namespace | File | Ownership | Description |
|-----------|------|-----------|-------------|
| `common` | `vi/common.json` | All lanes | Shared UI chrome: buttons, status, ARIA labels, relative dates |
| `auth` | `vi/auth.json` | Auth lane | Login, register, session, password management |
| `child` | `vi/child.json` | Child lane | Child-facing learning UI, greetings, gamification |
| `parent` | `vi/parent.json` | Parent lane | Parent dashboard, monitoring, safety, settings |
| `learning` | `vi/learning.json` | Learning lane | Lesson catalog, subjects, quiz, progress |
| `companion` | `vi/companion.json` | Companion lane | AI companion chat states, safety messages, session |

### Adding a New Namespace (future lanes)

1. Create `src/i18n/locales/vi/<namespace>.json`
2. Add to `Namespace` union in `src/i18n/types.ts`
3. Import and add to `CATALOGS_VI` in `src/i18n/catalog.ts`
4. Verify `catalog-integrity.test.ts` passes (it iterates all registered namespaces)
5. Update this document

---

## 4. Format Utilities (`src/lib/format.ts`)

Centralised on `vi-VN` locale (Wave 1).

| Function | Output Example (UTC+7) | Notes |
|----------|----------------------|-------|
| `formatSnowDateTime(value)` | `15/1/2026, 16:05` | Date + time, runtime TZ |
| `formatSnowDate(value)` | `15/1/2026` | Date only, runtime TZ |
| `formatSnowTime(value)` | `16:05` | Time only, runtime TZ |

**Timezone semantics:** No `timeZone` option is set. The runtime's local timezone (Asia/Ho_Chi_Minh on production server) is used. This is intentional — all timestamps surface in the user's local time. Do not add `timeZone: "UTC"` without reviewing every call site.

---

## 5. Root Layout (`src/app/layout.tsx`)

- `lang="vi"` — BCP-47 document language for screen readers and SEO.
- Title: `"AgentKid – Trợ lý học tập thông minh"`
- Description: Vietnamese product description.

Later lanes that add locale-prefixed routes (`app/[lang]/`) will override `lang` per-layout via `generateStaticParams`. The root `lang="vi"` is the safe default for Wave 1.

---

## 6. Wave Roadmap

| Wave | Scope | Status |
|------|-------|--------|
| **Wave 1** (this branch) | Vietnamese-first catalog foundation, `t()` API, format utilities, glossary | ✅ Done |
| Wave 2 | Wiring `t()` into Server Components for auth + child + parent UI pages | Pending |
| Wave 3 | Client Component wrapper / hook for `t()`, thin client-safe re-export | Pending |
| Wave 4 | Additional locales (en, zh), locale expansion in `Locale` type, catalog parity tests | Pending |
| Wave 5 | Locale-prefixed routes (`app/[lang]/`), locale negotiation proxy, SEO hreflang | Pending |

---

## 7. Testing

Tests live in `src/__tests__/i18n/` and run via `vitest run`:

| Test file | What it verifies |
|-----------|-----------------|
| `catalog-integrity.test.ts` | All namespaces present, non-empty, no empty-string values; `lookupKey` resolution |
| `interpolation.test.ts` | `interpolate()` standalone, `t()` pipeline, edge cases (missing vars, zero, multi-placeholder) |
| `format.test.ts` | `formatSnowDateTime/Date/Time` accept all input types, vi-VN locale shape (day-first regression) |

Run: `npx vitest run src/__tests__/i18n/`

---

## 8. Constraints Preserved (Wave 1)

- ✅ No locale-prefixed routes
- ✅ No browser language detector in main app
- ✅ No runtime language switch
- ✅ No DB locale field or schema change
- ✅ No auth/proxy/safety behavior changes
- ✅ No broad UI component modifications
- ✅ No `.env` or secret changes
- ✅ VTuber i18next subsystem untouched
- ✅ API routes untouched
- ✅ `.commandcode` untouched
