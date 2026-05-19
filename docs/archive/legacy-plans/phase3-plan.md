# Phase 3 Plan - Vision, Lessons, Dashboard

## Objective
Bổ sung lớp nhận diện cảm xúc, lesson engine AI-generated, approval flow của phụ huynh, và dashboard báo cáo song ngữ.

## Inputs / Prerequisites
- Phase 2 complete
- Stable session persistence
- Realtime event flow available

## Build Items
- Integrate `face-api.js` models and emotion detection hook
- Persist emotion events for timeline and context use
- Implement lesson generation route and lesson runner primitives
- Implement parent lesson approval UI
- Build dashboard overview, sessions detail, and progress views
- Add i18n support for dashboard surfaces

## Acceptance Checks
- Emotion events are captured and viewable in session detail
- Lesson suggestions can be generated and approved
- Approved lessons can participate in session flow
- Dashboard displays transcript, emotion timeline, and progress data accurately

## Risk Watchouts
- Emotion accuracy in poor lighting
- LLM lesson quality drift
- i18n coverage gaps in dashboard copy
