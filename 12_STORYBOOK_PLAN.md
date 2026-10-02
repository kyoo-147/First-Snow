# Storybook Plan

Storybook is the UI workshop for Snow. Every important UI state must be visible without running the full app.

## Required stories

```txt
AppShell.Default
Sidebar.ChildMode
TopNav.ChildMode
LessonCard.Default
LessonCard.Locked
MoodCard.Default
MoodCard.Selected
ParentInsightCard.Default
SettingsCard.ToggleOn
SettingsCard.ToggleOff
```

## AI Companion stories

```txt
CompanionShell.Default
CompanionStage.Idle
CompanionStage.Listening
CompanionStage.Thinking
CompanionStage.Speaking
CompanionStage.ConnectionLost
SubtitleOverlay.Short
SubtitleOverlay.Long
BottomControlBar.Idle
BottomControlBar.Listening
BottomControlBar.Speaking
CompanionSettingsPanel.General
CompanionSettingsPanel.Live2D
CompanionSettingsPanel.ASR
CompanionSettingsPanel.TTS
CompanionSettingsPanel.Agent
```

## Visual testing states

Capture screenshots for:

- 1440 desktop
- 1024 tablet
- 390 mobile parent view only

Child AI Companion is desktop/tablet first until MVP is stable.
