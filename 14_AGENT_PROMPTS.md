# Agent Prompts

## Prompt: Implement AI Companion UI

```txt
You are implementing Snow AI Companion.
Read the UI governance files first:
- 01_DESIGN.md
- 08_TOKENS.md
- 07_COMPONENTS.md
- 06_AI_COMPANION_UI_SPEC.md
- references/OPEN_LLM_VTUBER_MAPPING.md
- 09_ACCESSIBILITY.md
- 13_IMPLEMENTATION_CHECKLIST.md

Task:
Implement the AI Companion UI using Open LLM VTuber structure as the base.
The screen must include settings panel, 2D Snow character stage, connection status, subtitle overlay, and bottom control bar.
The center stage is primary. Chat history is secondary.
Use Snow tokens only. Do not create a normal chatbot layout.

Before coding, output:
1. Files you will touch
2. Components you will create or reuse
3. UI states you will support

After coding, run the implementation checklist and report pass/fail.
```

## Prompt: Audit UI against mockup

```txt
Audit this Snow UI screen against the governance files.
Do not code.
Return:
- visual mismatches
- layout mismatches
- token violations
- accessibility issues
- copy issues
- route/component violations
- exact files/components likely responsible
```

## Prompt: Build Storybook stories

```txt
Create Storybook stories for the Snow components listed in 12_STORYBOOK_PLAN.md.
Each story must show realistic Snow content and the required states.
Do not add new design styles.
```
