# Snow UI Tech Stack

## Recommended stack

```txt
Framework: Next.js App Router
Language: TypeScript
Styling: Tailwind CSS with CSS variables
UI primitives: shadcn/ui + custom Snow components
Animation: Framer Motion or Motion One
2D companion: Open LLM VTuber frontend adapted to Snow
Live2D renderer: keep Open LLM VTuber approach first
State: Zustand for UI/client state
Server data: React Query / TanStack Query if needed
Forms: React Hook Form + Zod
Docs/UI workshop: Storybook
Testing: Vitest + Playwright + Storybook tests
Lint/format: ESLint + Prettier
Package manager: pnpm
```

## Open LLM VTuber compatibility decision

Open LLM VTuber Web currently uses React 18, Vite/Electron, Chakra UI, React Router, RxJS, Zustand, VAD/ONNX runtime files, and Live2D WebSDK assets.

Snow UI should not import the Open LLM VTuber Chakra/Electron shell directly. Snow should port the product structure and interaction model into the Snow stack:

- Next.js App Router instead of React Router.
- Tailwind CSS variables from Snow tokens instead of Chakra style props.
- Snow component primitives instead of Open LLM VTuber Chakra wrappers.
- Open LLM VTuber stage, subtitle, WebSocket, VAD, and Live2D concepts reused as implementation references.
- Static Live2D/VAD runtime assets served from `public/libs` or an equivalent Next-compatible static path when real runtime integration begins.

For the UI-first MVP, build a Snow-compatible companion stage with mock state and Snow assets first. Integrate Live2D, VAD, WebSocket, and backend session behavior after the mockup-matched UI shell is stable.

## Why this stack

Next.js App Router gives a clear route system and modern React structure. Tailwind theme variables keep design tokens consistent. shadcn/ui uses CSS variables well and is easy to customize. Storybook gives isolated component previews and states for UI review.

## Folder strategy

Keep `app/` route-first. Keep reusable components outside `app/`.

```txt
src/
├─ app/
│  ├─ (marketing)/
│  ├─ (child)/
│  ├─ (parent)/
│  └─ api/
├─ components/
│  ├─ app-shell/
│  ├─ companion/
│  ├─ lessons/
│  ├─ parent/
│  ├─ settings/
│  └─ ui/
├─ config/
├─ data/
├─ hooks/
├─ lib/
├─ styles/
├─ types/
└─ stories/
```

## Rule for AI agents

Do not place reusable components directly inside route folders unless they are page-private.

## CSS strategy

Use CSS variables for semantic tokens:

- `--background`
- `--foreground`
- `--primary`
- `--surface`
- `--snow-ice`
- `--snow-lavender`
- `--radius-card`
- `--shadow-soft`

Use Tailwind utility classes only through the token system.
