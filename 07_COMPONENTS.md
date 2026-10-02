# Snow Components

## AppShell

Used by child dashboard pages.

Props:

```ts
type AppShellProps = {
  activeNav: 'home' | 'lessons' | 'companion' | 'activities' | 'library' | 'progress' | 'settings';
  childName: string;
  childLevel: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
};
```

## CompanionShell

Used only by AI Companion.

Includes:

- CompanionSettingsPanel
- CompanionStage
- SubtitleOverlay
- CompanionControlBar
- OptionalSessionPanel

## CompanionStage

Required states:

- idle
- listening
- thinking
- speaking
- connection-lost

Props:

```ts
type CompanionStageProps = {
  state: CompanionState;
  expression: SnowExpression;
  subtitle?: string;
  backgroundScene: string;
  characterPreset: string;
  connected: boolean;
};
```

## BottomControlBar

Includes:

- status pill
- microphone button
- mute button
- input field
- send button
- interrupt button

## LessonCard

Includes:

- illustration
- subject tag
- title
- duration
- rating or progress
- CTA

## MoodCard

Includes:

- icon
- label
- selected state
- accessible label

## ParentInsightCard

Use observational language only.

Good title examples:

- Expressing more feelings
- Responded well to visual choices
- Needed extra time during transitions

Bad title examples:

- Behavior problem
- Failed communication
- Autism score

## SettingsCard

Used in parent settings.

Includes:

- icon
- title
- description
- value or status
- toggle or chevron
