# TASK-007 Platform Media Hooks Spike

## Status
Done.

## Goal
Validate microphone and camera access patterns before the full voice runtime is implemented.

## Acceptance
- Desktop browser viability is confirmed at implementation level.
- Safari and iPad constraints are documented.
- Hook API shape aligns with the production architecture.

## Completed Implementation
- Added `useSessionMedia()` under `apps/web/app/session/_hooks/use-session-media.ts`.
- Hook status model:
  - `idle`
  - `requesting`
  - `granted`
  - `denied`
  - `unsupported`
  - `error`
- Hook actions:
  - `requestAudio()`
  - `requestVideo()`
  - `stopAll()`
- The hook uses `navigator.mediaDevices.getUserMedia()` only after explicit user action.
- Streams are stopped on `stopAll()` and component unmount.
- The hook does not record, upload, transcribe, or persist raw audio/video.

## Browser Notes
- Desktop Chrome/Edge should support the hook on secure origins and localhost.
- iPad Safari requires user gesture before permission prompts and may suspend streams when the tab loses focus.
- Camera availability, labels, and permission persistence vary by device/browser.
- Future STT and emotion runtime must keep browser permission prompts user-initiated.

## Verification
- `npm.cmd run build` passed in `apps/web`.
- Runtime permission behavior still needs manual device validation before pilot.
