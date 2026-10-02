# Snow Route Map

## Route groups

Use Next.js App Router route groups:

```txt
src/app/
├─ (marketing)/
│  ├─ page.tsx
│  ├─ features/page.tsx
│  ├─ parents/page.tsx
│  ├─ clinicians/page.tsx
│  ├─ pricing/page.tsx
│  └─ demo/page.tsx
├─ (child)/
│  ├─ home/page.tsx
│  ├─ lessons/page.tsx
│  ├─ lessons/[lessonId]/page.tsx
│  ├─ companion/page.tsx
│  ├─ explore/page.tsx
│  ├─ activities/page.tsx
│  ├─ library/page.tsx
│  ├─ rewards/page.tsx
│  ├─ create/page.tsx
│  └─ progress/page.tsx
├─ (parent)/
│  ├─ parent/page.tsx
│  ├─ parent/insights/page.tsx
│  ├─ parent/settings/page.tsx
│  ├─ parent/safety/page.tsx
│  ├─ parent/reports/page.tsx
│  └─ parent/team/page.tsx
└─ api/
   ├─ companion/session/route.ts
   ├─ companion/ws/route.ts
   ├─ lessons/route.ts
   └─ parent/report/route.ts
```

## Navigation rules

### Child app nav

Top nav:

- Home
- Learn
- Explore
- Rewards
- Create

Left sidebar:

- Home
- Lessons
- AI Companion
- Activities
- Library
- Progress
- Settings

### Parent app nav

- Dashboard
- Learning
- Emotions
- Progress
- Safety
- Reports
- Settings

## Important route decision

The route for the VTuber-style interface must be:

```txt
/(child)/companion
```

Do not put this screen under `/chat` because that encourages a normal chatbot layout.

## Page responsibilities

### `/companion`

- 2D character stage
- settings drawer
- connection state
- subtitle overlay
- mic/text input
- Live2D/ASR/TTS/Agent settings

### `/lessons/[lessonId]`

- one task at a time
- Snow guidance
- visual choices
- stepper
- hint and repeat

### `/parent`

- today summary
- timeline
- what Snow noticed
- safety controls
- recommended next steps
