# Snow UI Implementation Checklist

## Visual consistency

- [ ] Uses Snow tokens only
- [ ] No random hex colors
- [ ] Same radius system
- [ ] Same shadow system
- [ ] Same typography scale
- [ ] Mascot style matches Snow mockups

## Route consistency

- [ ] Uses route map from `05_ROUTE_MAP.md`
- [ ] AI Companion route is `/companion`, not `/chat`
- [ ] Child and parent route groups are separated

## AI Companion

- [ ] 2D character stage is primary
- [ ] Settings panel includes General, Live2D, ASR, TTS, Agent, About
- [ ] Connection badge visible
- [ ] Subtitle overlay visible
- [ ] Bottom control bar includes status, mic, input, send, stop
- [ ] Chat history is secondary
- [ ] Child Safe Mode visible in settings
- [ ] Character is Snow, not anime human

## Child UX

- [ ] One main task per screen
- [ ] Buttons are large
- [ ] Copy is short
- [ ] No diagnosis language
- [ ] No adult chatbot UI

## Parent UX

- [ ] Insights use observation language
- [ ] Safety controls are easy to find
- [ ] No medical overclaiming

## Accessibility

- [ ] Text readable
- [ ] Touch targets large
- [ ] Contrast acceptable
- [ ] Motion is calm

## Final AI output required

At the end of an AI coding task, the agent must list:

- Files changed
- Components created or reused
- Tokens used
- Checklist pass/fail
- Remaining mismatch against mockup
