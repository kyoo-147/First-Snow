# AI Companion UI Spec

## Base reference

The AI Companion screen is structurally based on Open LLM VTuber Web Mode.

The layout must include:

- Left settings panel
- Tabs: General, Live2D, ASR, TTS, Agent, About
- Large central 2D character stage
- Background scene selector
- Character preset selector
- Connection status badge
- Subtitle overlay
- Bottom control bar
- AI status pill
- Microphone button
- Interrupt / stop button
- Text input
- Send button

## Visual priority

The 2D character stage is primary.

Chat history is secondary and may be placed in a drawer, small right panel, or collapsible panel.

## Stage anatomy

```txt
+------------------------------------------------------+
| Connection badge                                     |
|                                                      |
|        Cozy classroom / room background              |
|                                                      |
|              Snow 2D character                       |
|                                                      |
|       Subtitle overlay: Snow speaks here             |
+------------------------------------------------------+
| AI status | mic | mute | input | send | stop         |
+------------------------------------------------------+
```

## Required AI states

```ts
export type CompanionState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'connection-lost';
```

## Required expression states

```ts
export type SnowExpression =
  | 'calm'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'encouraging'
  | 'sleepy'
  | 'sad-supportive';
```

## Settings panel

### General

- Language
- Show Subtitle
- Child Safe Mode
- Calm Voice
- Parent Access
- Background Scene
- Character Preset
- WebSocket URL
- Base URL

### Live2D

- Model preset
- Scale
- Position X
- Position Y
- Eye tracking
- Idle motion
- Touch interaction

### ASR

- Provider
- Language
- Voice activity detection
- Silence threshold
- Wake word optional

### TTS

- Provider
- Voice
- Speed
- Pitch
- Emotion tone

### Agent

- Persona
- Safety profile
- Child age mode
- Lesson context
- Memory mode

### About

- Version
- Source base
- Privacy notes
- Safety disclaimer

## Snow adaptation rules

- Replace anime human character with Snow mascot.
- Keep Live2D-compatible stage area.
- Keep Open LLM VTuber control logic visible in UI.
- Use a cozy child-safe classroom background by default.
- Add child-safe mode controls.
- Add parent access for sensitive settings.

## Forbidden

- Do not make the center area a list of chat bubbles.
- Do not use romantic, dating, girlfriend, or waifu styling.
- Do not put complex settings in the child-facing main area.
- Do not remove WebSocket and Base URL fields from the developer settings version.
