# Open Design / DESIGN.md Usage for Snow

Open Design style documentation is useful because it turns visual taste into a machine-readable design contract.

## Why use it

AI agents drift when style rules are vague. A `DESIGN.md` file reduces drift by defining:

- Brand personality
- Tokens
- Component anatomy
- Layout rules
- Allowed patterns
- Forbidden patterns
- Review checklist

## Snow implementation model

Use these files as the design contract:

- `01_DESIGN.md`: product and visual direction
- `08_TOKENS.md`: colors, type, spacing, radius, shadows
- `07_COMPONENTS.md`: reusable component rules
- `05_ROUTE_MAP.md`: route and page structure
- `06_AI_COMPANION_UI_SPEC.md`: Open LLM VTuber adaptation
- `13_IMPLEMENTATION_CHECKLIST.md`: audit before merge

## Rule

All UI implementation must reference tokens and components. Never write one-off hex colors, one-off shadows, or new card styles unless added to the design system first.
