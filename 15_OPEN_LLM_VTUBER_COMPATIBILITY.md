# Open LLM VTuber Compatibility Notes

## Purpose

Snow AI Companion should reuse the Open LLM VTuber interaction structure without inheriting its visual system or Electron-specific app shell.

## Stack comparison

| Area | Snow UI target | Open LLM VTuber Web | Decision |
|---|---|---|---|
| Framework | Next.js App Router | Vite + Electron | Use Next routes for Snow. Port structure, not router code. |
| React | React 19 | React 18 | Rebuild UI components in Snow. Avoid direct copy until tested. |
| Styling | Tailwind CSS variables | Chakra UI style props | Convert to Snow tokens and Tailwind classes. |
| Routes | `/(child)/companion` | `/vtuber` via React Router | Use Snow route map. |
| Settings | Snow `CompanionSettingsPanel` | Chakra drawer/tabs | Recreate tabs and fields with Snow styling. |
| Stage | Snow 2D mascot stage | Live2D canvas + background | Keep stage anatomy. Start with Snow asset placeholder, then wire Live2D. |
| Subtitle | Snow child-readable overlay | `Subtitle` component | Recreate visual overlay and reuse display concept. |
| Controls | Snow `BottomControlBar` | footer with mic/input/interrupt | Recreate with Snow tokens and child-safe labels. |
| State | React context/Zustand if needed | React context + Zustand | Use local/context first; add Zustand only if state becomes shared. |
| WebSocket | Next-compatible client service | RxJS-backed singleton service | Port message contract later; keep URL/Base URL fields now. |
| ASR/VAD | Later runtime integration | `@ricky0123/vad-web` + ONNX | Do not block UI MVP on VAD. Plan static assets for Next. |
| Live2D runtime | Later runtime integration | Cubism WebSDK copied by Vite | Serve runtime assets from `public/libs` when needed. |

## Reuse from Open LLM VTuber

- Settings tabs: General, Live2D, ASR, TTS, Agent, About.
- Stage anatomy: background, character canvas/area, connection badge, subtitle.
- AI states: idle, listening, thinking/speaking, interrupted, loading/connection-lost.
- Bottom controls: mic, mute, text input, send, interrupt/stop.
- Developer settings: WebSocket URL and Base URL.
- Message/service concepts for future backend connection.

## Do not reuse directly

- Chakra UI components or style props.
- Electron title bar, window mode, pet mode, or desktop-only APIs.
- React Router route definitions.
- Open LLM VTuber dark/neon/default colors.
- Anime character assets or romantic companion patterns.
- Chat-first layout where the message list becomes the primary center.

## Snow adaptation rules

1. Use the Snow mockups as the visual source of truth, especially `ui_mockup/ai_compainon_2.png` for AI Companion.
2. Use `08_TOKENS.md` and `design-system/tokens.css` for all colors, radius, and shadows.
3. Build `CompanionShell`, `CompanionSettingsPanel`, `CompanionStage`, `SubtitleOverlay`, and `BottomControlBar` as Snow components.
4. Keep chat history secondary: right panel, drawer, or collapsed session panel only.
5. Keep child-safe controls visible: Child Safe Mode, Parent Access, calm voice, subtitle.
6. Use observation/supportive copy and avoid diagnosis language.

## Implementation phases

### Phase 1: Mockup-matched UI shell

- Build `/companion` route in the child route group.
- Use static Snow mascot/background assets.
- Support all companion states visually with mock state.
- Include all required settings tabs and fields.
- Add responsive desktop/tablet layout.

### Phase 2: Interaction wiring

- Add client state for mic, subtitle, expression, connection, selected settings.
- Add mock send/interrupt behavior.
- Add optional compact chat/session panel.

### Phase 3: Runtime integration

- Port WebSocket service contract.
- Add VAD only after static runtime files are available in a Next-compatible path.
- Add Live2D renderer only after the stage shell passes visual review.
- Keep fallback Snow mascot rendering if Live2D fails or is unavailable.

## Required checks before coding

- Read `01_DESIGN.md`, `06_AI_COMPANION_UI_SPEC.md`, and `references/OPEN_LLM_VTUBER_MAPPING.md`.
- Inspect the target mockup image.
- Declare files to touch and UI states to support.
- Confirm no new design style is introduced.

## Required checks after coding

- Run `13_IMPLEMENTATION_CHECKLIST.md`.
- Verify the page renders at desktop and tablet sizes.
- Verify text does not overflow controls.
- Verify the 2D stage remains primary.
- Report any mismatch against `ai_compainon_2.png`.
