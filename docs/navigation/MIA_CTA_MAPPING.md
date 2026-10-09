# Mia AI-chat CTA mapping

Reviewed in the Snow child UI. The canonical internal route for starting, opening, or continuing the child AI chat is `/mia`. Navigation uses Next.js `Link`, so keyboard activation, focus indication, auth middleware, and the existing child session/API contracts remain unchanged.

## Confirmed AI-chat CTAs

| Reviewed file:line | Classification | Old behavior | New behavior |
| --- | --- | --- | --- |
| `src/data/snow-data.ts:26` | Child sidebar AI assistant | `/companion` | `/mia` |
| `src/data/snow-data.ts:34` | Child top navigation assistant | `/companion` | `/mia` |
| `src/data/snow-data.ts:156` | Route-card “Trò chuyện cùng AgentKid” | `/companion` | `/mia` |
| `src/components/pages/home-screen.tsx:124` | Home primary “talk” action | `/companion` | `/mia` |
| `src/components/pages/home-screen.tsx:184` | Home hero talk card | `/companion` | `/mia` |
| `src/components/pages/child-routine-screen.tsx:137` | Calm-pause “talk with AgentKid” CTA | `/companion` | `/mia` |
| `src/components/pages/child-activities-screen.tsx:156` | Continue with Snow after mood check-in | `/companion?mood=...` | `/mia?mood=...` |
| `src/app/(child)/companion/avatar/page.tsx:17` | Return from avatar companion to chat | `/companion` | `/mia` |

## Route compatibility and exclusions

- `src/app/(child)/mia/page.tsx` is the canonical route and renders the existing `TalkScreen` with the same `AppShell`, right rail, child-session lookup, and companion API contracts.
- `src/app/(child)/companion/page.tsx` remains available as a compatibility entry point for bookmarks and existing deep links. It is not an active CTA target.
- `src/app/(child)/companion/talk/page.tsx` remains a compatibility redirect. It is not an active CTA.
- `src/components/pages/talk-screen.tsx:40` (`/companion/avatar`) is an explicit avatar-mode presentation switch, not a text-chat start/continue CTA; it remains unchanged to preserve the existing VTuber route.
- Learning, routine, settings, safety, transcript, emergency, support, parent, admin, and unrelated activity controls were not rewired. The mood check-in CTA is included only because its label explicitly continues with Snow AI chat.

## Accessibility and negative coverage

Mapped links retain `snow-focus-ring` and native `Link` semantics, so they are keyboard reachable and visibly focused. `src/__tests__/mia-cta-mapping.test.ts` checks the positive `/mia` destinations and rejects accidental `/mia` rewiring in representative learning, settings, safety, transcript, and emergency surfaces.
