# How to Use This Pack With AI Agents

## Before coding

Paste or attach these files to the agent in this order:

1. `01_DESIGN.md`
2. `08_TOKENS.md`
3. `07_COMPONENTS.md`
4. `05_ROUTE_MAP.md`
5. `06_AI_COMPANION_UI_SPEC.md` if working on the companion screen
6. `15_OPEN_LLM_VTUBER_COMPATIBILITY.md` if porting Open LLM VTuber UI or logic
7. `09_ACCESSIBILITY.md`
8. `10_COPY_GUIDE.md`
9. `13_IMPLEMENTATION_CHECKLIST.md`

## AI instruction

Use this exact instruction before every UI task:

```txt
You are implementing Snow UI. Before writing code, read the Snow UI governance files. Do not invent a new design style. Use the tokens, components, routes, and copy rules exactly. If building AI Companion, follow the Open LLM VTuber structure: settings panel, 2D character stage, connection status, subtitle overlay, and bottom control bar. Port structure and interaction concepts, not the Chakra/Electron shell. Chat history is secondary. The 2D companion stage is primary.
```

## Expected AI output per task

The AI must output:

1. A short implementation plan.
2. Files it will touch.
3. Components it will reuse.
4. Any deviations from this UI spec.
5. A final UI audit against `13_IMPLEMENTATION_CHECKLIST.md`.

## Do not allow

- Random colors.
- Different radius system per page.
- A normal chatbot layout for AI Companion.
- Anime girlfriend styling.
- Adult SaaS dashboard density in child mode.
- Medical diagnosis language.
