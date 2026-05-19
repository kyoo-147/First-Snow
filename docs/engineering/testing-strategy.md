# Testing Strategy

## Test Levels
- Unit: utility logic, prompt builders, schema mappers, ownership helpers
- Integration: API routes, DB access patterns, auth checks, alert routing
- Manual: browser media flows, dashboard review flows, pilot readiness checks

## Phase Matrix
- Phase 1: auth, child profile CRUD, media permissions, session shell rendering
- Phase 2: STT/chat/TTS flow, session persistence, memory extraction paths
- Phase 3: emotion detection, lesson generation, dashboard charts and transcript views
- Phase 4: alert routing, consent UX, bug bash, pilot scenarios

## Browser Matrix
- Chrome desktop
- Edge desktop
- Android tablet Chrome
- iPad Safari

## Manual Readiness Checks
- Permission flows are understandable
- Mia child-facing surface is not overwhelming
- Dashboard data is readable and accurate
- Alerts reach at least one viable channel under warning and critical conditions
