# Snow UI Fidelity Rebuild Plan

## Summary

Audit hiện tại kết luận: app đã bỏ được outer rounded frame, nhưng **chưa đạt fidelity mockup**. Vấn đề chính không còn là thiếu component, mà là layout scaffold đang ép nhiều route vào cùng một công thức, khiến vị trí sidebar/topbar/right rail/stage/card sai so với mockup.

Chuẩn triển khai tiếp theo: **mockup-first, route-specific layout trước; component reuse sau**. Snow governance và ảnh trong `snow-ui-governance/ui_mockup` là source of truth; Taste Skill chỉ dùng để chống layout generic, kiểm soát card/elevation/rhythm và audit chất lượng.

## Audit Findings

- `/home`: **Fail fidelity**. Outer frame đã hết, nhưng hero, spacing, right rail và các section chưa khớp `ui_ (0).png` / `ui_ (13).png`.
- `/explore`: **Fail fidelity**. Sidebar đang highlight nhầm `Activities`; featured banner, topic chips, recommendation/right rail chưa khớp `ui_ (4).png`.
- `/companion`: **Hard fail** so với `ai_compainon_2.png`. Stage dùng sai background/asset, Snow mascot là crop chữ nhật, settings tabs bị tràn, tablet layout vỡ.
- `/settings`: **Prototype only**. Có mockup riêng `ui_ (8).png`, nhưng current screen chưa bám bố cục Settings and Parent Controls.
- `/parent`: **Prototype only**. Copy an toàn, nhưng layout là dashboard generic, chưa map theo mockup/parent-control direction.
- Global shell: **Partial pass**. Không còn app nằm trong card bo góc, nhưng route mapping, active nav, layout widths và right panel cần chỉnh theo từng mockup.

## Key Changes

- Tạo bước mapping mockup bắt buộc trước khi sửa UI:
  - Home: `ui_ (0).png`, `ui_ (13).png`
  - Lessons/practice: `ui_ (10).png`, `ui_ (15).png`
  - Talk with Snow: `ui_ (2).png`, `ui_ (12).png`
  - AI Companion: `ai_compainon_2.png` primary, `ai_compainon_1.png` secondary
  - Explore: `ui_ (4).png`
  - Activities: `ui_ (5).png`
  - Rewards: `ui_ (6).png`
  - Create: `ui_ (7).png`
  - Settings/Parent Controls: `ui_ (8).png`
- Refactor `AppShell` thành full-viewport shell đúng mockup:
  - No outer rounded container.
  - Fixed left sidebar width, full height, with hut illustration bottom.
  - Top nav stays in main area, aligned like mockup.
  - Right rail is route-specific, not reused blindly.
  - Remove bad active rule where Explore maps to Activities.
- Rebuild route compositions against mockups:
  - Home: exact hero/card/right-panel rhythm, correct Snow asset placement, correct recommendation/explore sections.
  - Explore: icon topic chips, Ocean Explorers banner, Snow Recommends, Daily Exploration Goal, New This Week, Discover/Trending sections.
  - Companion: rebuild around `ai_compainon_2`: 420px left settings panel, clean classroom stage, large Snow mascot, connection badge, subtitle overlay, bottom control bar; remove extra mood/expression panels from primary viewport unless matching `ai_compainon_1`.
  - Settings: match `ui_ (8).png` with Child Profile, Topic Allowed, Screen Time, Privacy/Data, Safe Lock, Calm Path, right insight rail.
  - Parent: keep observational language, but visually align to parent/settings mockup instead of generic dashboard cards.
- Asset cleanup:
  - Stop using screenshot crops that include wrong rectangular backgrounds.
  - Replace `snow-classroom.png`/stage assets with mockup-correct classroom and Snow mascot assets.
  - Keep mascot style consistent across shell, cards, companion, and settings.

## Checklist

- Layout:
  - [ ] App fills viewport, no enclosing rounded card.
  - [ ] Sidebar/topbar/right rail match mockup positions.
  - [ ] Each route uses its own mockup-specific composition.
  - [ ] No accidental shared right rail where mockup differs.
- Visual:
  - [ ] Snow tokens only.
  - [ ] No random hex outside token files.
  - [ ] Radius system consistent.
  - [ ] Shadows used only for real hierarchy.
  - [ ] Mascot style consistent.
- Companion:
  - [ ] Settings tabs complete: General, Live2D, ASR, TTS, Agent, About.
  - [ ] WebSocket URL and Base URL visible.
  - [ ] Stage is primary.
  - [ ] Connection badge visible.
  - [ ] Subtitle visible.
  - [ ] Bottom controls include status, mic, mute, input, send, stop.
  - [ ] Tablet layout has no horizontal overflow.
- Child/Parent Safety:
  - [ ] Short child-facing copy.
  - [ ] No diagnosis/medical overclaiming.
  - [ ] Parent copy remains observational.
  - [ ] Safety controls easy to find.

## Test Plan

- Run `npm run lint`.
- Run `npm run build`.
- Capture screenshots:
  - `/home` desktop at mockup-sized viewport.
  - `/explore` desktop.
  - `/companion` desktop.
  - `/companion` tablet `1024x768`.
  - `/settings` desktop.
  - `/parent` or settings/parent-control mobile `390px`.
- Compare screenshots manually against mapped mockups and mark each checklist item pass/fail.
- Run DOM overflow check for each audited route: `scrollWidth <= innerWidth`.
- Run color audit with `rg "#[0-9a-fA-F]{3,8}" src` and migrate non-token colors.

## Assumptions

- Fidelity target is desktop-first, matching the provided mockup proportions before mobile polish.
- Current implementation can be refactored aggressively where shared components are causing wrong layout.
- Backend, Live2D runtime, VAD, WebSocket behavior, auth, and persistence remain out of scope for this pass.
