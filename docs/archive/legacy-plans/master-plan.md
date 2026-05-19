# AgentKid Master Plan

## Summary
MVP is organized into four sequential phases. Each phase has explicit exit criteria so progress is measurable and implementation work can be scheduled without re-scoping the product every day.

## Phase Overview
| Phase | Status | Focus | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| Phase 1 | planned | Foundation | canonical docs | app scaffold, auth shell, schema, child profiles, session shell |
| Phase 2 | planned | Voice Core | Phase 1 | end-to-end STT -> chat -> TTS loop works in Vietnamese |
| Phase 3 | planned | Vision, Lessons, Dashboard | Phase 2 | emotion tracking, lesson system, parent reporting work together |
| Phase 4 | planned | Safety, Polish, Deploy | Phase 3 | alerts, privacy checks, optimization, pilot readiness |

## Phase Dependencies
- Phase 1 must establish auth, schema, and session UI shell before voice work begins.
- Phase 2 must stabilize the voice loop before lesson orchestration and dashboard reporting.
- Phase 3 depends on stable session and persistence primitives from earlier phases.
- Phase 4 depends on end-to-end product behavior being functionally complete.

## Exit Rules
- Do not mark a phase complete unless its acceptance checks pass in the relevant `phaseN-plan.md`.
- Record any major scope change in `docs/decisions.md` and reflect it in the current phase plan.
