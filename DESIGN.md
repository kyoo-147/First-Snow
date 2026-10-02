# Snow Design System

## 1. Visual Theme & Atmosphere
Snow is a "Daily App Balanced" interface designed specifically for neurodiverse children. The atmosphere is warm, gentle, and highly structured. It uses predictable, somewhat symmetric layouts with clear visual boundaries (cards) to reduce cognitive load. The design language avoids sharp contrasts, favoring soft gradients, glassmorphic elements, and playful but non-overwhelming typography. Motion should be fluid and calming.

## 2. Color Palette & Roles
- **Canvas / Background**: `bg-snow-ice` (#F4F7FB) / `bg-snow-lavender` (#F0EDFF) gradients — Soft, airy backdrop.
- **Pure Surface**: `bg-white` / `bg-snow-surface` — Card and container fill for clear content grouping.
- **Charcoal Ink**: `text-snow-primary-dark` (#1E1B4B) — Primary text, ensuring high contrast without harsh black.
- **Muted Steel**: `text-snow-muted` (#64748B) — Secondary text, descriptions, metadata.
- **Accent Primary (Purple)**: `bg-snow-primary` (#8B5CF6) — Primary CTAs, active states, important badges.
- **Accent Warning (Orange/Gold)**: `text-snow-warning` (#F59E0B) — Streaks, stars, interactive playful highlights.
- **Accent Success (Green)**: `text-snow-success` (#10B981) — Calm states, completed tasks.
- **Accent Aqua (Blue)**: `bg-snow-aqua` (#06B6D4) — Secondary visual interest, math/science subjects.

*(Note: Neon gradients and pure black #000000 are strictly banned).*

## 3. Typography Rules
- **Display/Headlines**: `Nunito` or `Quicksand` (friendly rounded sans-serif). Heavy weights (`font-black`) for clear hierarchy.
- **Body**: Relaxed leading, maximum 65 characters per line for readability by children.
- **Banned**: Generic serif fonts, overly complex script fonts, dense tracking.

## 4. Component Stylings
- **Buttons**: Pill-shaped (`rounded-full`). Primary buttons use solid accent fills. Secondary buttons use border outlines with text color matching the border. Tactile press animations.
- **Cards**: Generously rounded corners (`rounded-[var(--radius-lg)]` usually 24px). Soft, diffused shadows (`shadow-sm` or custom soft shadow) to lift them off the gradient background.
- **Icons**: Soft, chunky icons (Lucide/Heroicons with 2px or 2.5px stroke).
- **Avatars/Characters**: Always placed within clear circular boundaries or organically overlapping cards to break the rigid grid safely.
- **Right Rails**: Contextual to the route. Used for secondary information (Progress, Contextual Tips, Goals) to keep the primary view uncrowded.

## 5. Layout Principles
- **Grid-first Architecture**: Use CSS Grid for robust 2, 3, or 4 column layouts depending on viewport.
- **No Overlapping Clutter**: Elements must have generous padding (typically `p-5` or `p-6`). No overlapping text on complex image backgrounds.
- **Sidebar Navigation**: Fixed left sidebar for top-level routing, keeping navigation predictable.

## 6. Motion & Interaction
- **Spring Physics**: Gentle, slightly damped spring animations for page transitions and hover states.
- **Micro-interactions**: Hovering over cards should produce a slight lift (`-translate-y-1`) to indicate interactivity without sudden flashes.

## 7. Anti-Patterns (Banned)
- No emojis as primary icons (use proper SVG icons).
- No pure black (`#000000`).
- No sharp corners (`rounded-none` or `rounded-sm`).
- No dense walls of text.
- No 3-column equal card layouts for main content (use asymmetrical splits or horizontal scrolling for variety).
