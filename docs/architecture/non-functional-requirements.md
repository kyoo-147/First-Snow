# Non-Functional Requirements

## Latency
- Voice response target: under 2 seconds from child stop-speaking to Mia playback start.

## Reliability
- Critical child-facing flows must degrade gracefully on provider or network failure.
- Session interruption should preserve as much useful state as safely possible.

## Device Support
- Desktop Chrome and Edge are primary targets.
- Android tablet Chrome and iPad Safari are important secondary targets.

## Accessibility for ASD
- Avoid abrupt motion and excessive UI density.
- Maintain strong contrast and large touch targets.
- Prefer predictable visual hierarchy and simple language.
