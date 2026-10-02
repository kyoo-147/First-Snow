# Taste Skill Usage for Snow

Taste Skill is useful as an anti-generic frontend guardrail. Use it before AI generates or redesigns UI.

## Snow design dials

Use these as the default Snow design dials:

```txt
DESIGN_VARIANCE: 7
MOTION_INTENSITY: 5
VISUAL_DENSITY: 4 for child screens, 6 for parent screens
```

## New screen prompt pattern

```txt
I have loaded Taste Skill v2 and the Snow UI Governance Pack.

Brief:
- Product: Snow
- Page: [page name]
- Audience: [child / parent / clinician]
- Vibe: gentle, child-safe, cozy winter classroom, premium pastel
- Avoid: generic SaaS, anime girlfriend style, dark AI neon, adult chatbot layout

Step 1: Declare design read in one sentence and set DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY. Stop.
Step 2 after approval: implement only using Snow tokens and components.
Step 3: run UI audit using 13_IMPLEMENTATION_CHECKLIST.md.
```

## Redesign prompt pattern

```txt
Audit the current screen first. Do not code yet.
Report:
- which Snow tokens are used or missing
- which components match COMPONENTS.md
- which layout rules are violated
- which accessibility rules are violated
- what must be preserved
- what must be changed
Stop after audit.
```

## Taste Skill helps Snow by enforcing

- Better hierarchy
- More deliberate spacing
- Less generic AI UI
- Page-level composition checks
- Hero and section discipline
- Final written audit

## Snow-specific addition

Taste Skill is not enough for AI Companion. For AI Companion, always combine Taste Skill with `06_AI_COMPANION_UI_SPEC.md` and `references/OPEN_LLM_VTUBER_MAPPING.md`.
