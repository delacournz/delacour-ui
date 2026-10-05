# Plan OVL — Overlays

Six overlay components for `@delacour/react-native-ui`, plus the one shared foundation every
one of them stands on. Each component has its own spec in this folder; each spec is written so an
agent holding only that file (and the repository) can build the component.

| ID | Component | Spec | Phase | Depends on |
| --- | --- | --- | --- | --- |
| OVL-P0 | Overlay foundation | [overlay.md](overlay.md) | P0 — category lead, before any child | teleport (existing optional peer) |
| OVL-P1-DIALOG | Dialog | [dialog.md](dialog.md) | P1 | OVL-P0 |
| OVL-P1-DRAWER | Drawer | [drawer.md](drawer.md) | P1 | OVL-P0 |
| OVL-P1-POPOVER | Popover | [popover.md](popover.md) | P1 | OVL-P0 |
| OVL-P1-TOAST | Toast | [toast.md](toast.md) | P1 | OVL-P0, `alert` (merged) |
| OVL-P2-FEEDBACK | Feedback | [feedback.md](feedback.md) | P2 | OVL-P1-DIALOG merged into the category branch |
| OVL-P2-TOOLTIP | Tooltip | [tooltip.md](tooltip.md) | P2 | OVL-P1-POPOVER merged into the category branch |

## Build order

```
OVL-P0  overlay foundation (lead, in the category branch)
   │
   ├── OVL-P1-DIALOG ──► OVL-P2-FEEDBACK
   ├── OVL-P1-POPOVER ─► OVL-P2-TOOLTIP
   ├── OVL-P1-DRAWER
   └── OVL-P1-TOAST
```

P1 children branch from the category branch once P0 is committed and run in parallel. A P2 child
branches from the category branch **after** its P1 dependency has been merged into it — never from
the P1 child's branch.

## Why a foundation phase

Dialog, Drawer, Popover, Tooltip, Toast and Feedback all draw over the app, and four of the six
need the same five things: a portal that escapes every ancestor's clipping, a z-order that puts
the overlay above an open bottom sheet, a scrim, a mount/unmount lifecycle that survives the exit
animation, and an Android back button that closes only the topmost overlay. Built six times in six
parallel branches, those five things would conflict at merge and disagree at runtime. So the lead
builds them once (`overlay/`, see [overlay.md](overlay.md)) and every child consumes them.

The decision that forced it: **there must be exactly one teleport `PortalProvider` in an app.**
Teleport registers hosts natively by name, and the bottom-sheet engine's `BottomSheetProvider`
already mounts a provider with a `"root"` host. A second provider — one per overlay component —
would mean two native hosts called `"root"`. So `OverlayProvider` owns the teleport provider, the
engine's `BottomSheetProvider` learns to skip its own when one is already above it, and every
overlay and every sheet teleports into the same `"root"` host, ordered by `zIndex`.

## Shared decisions every spec inherits

- **Open state is `isOpen` / `defaultOpen` / `onOpenChange(isOpen)`**, through
  `hooks/use-controllable-state`, exactly as `Alert` and `BottomSheet` spell it. Booleans are
  `isX` (`isDismissible`, `isDisabled`, `isScrollable`).
- **Triggers donate the press** (`asChild`), the way `BottomSheet.Trigger` does — never wrap a
  `Button` in a second tap gesture. Without `asChild` a trigger is this library's `Pressable`.
- **Every overlay renders through `Overlay.Portal`** and takes its `zIndex` from the overlay
  registry. Without an `OverlayProvider` it renders inline and warns once in development.
- **Motion runs through `useOverlayPresence`** and respects `useReducedMotion()`: under reduce
  motion every transform collapses to an opacity fade. Overlay motion is behaviour, not
  decoration, so `isMotionCalm` does **not** still it (see `lib/calm-motion.ts`) — but every
  animation is finite, so an E2E runner's settle wait ends.
- **Scrims are `bg-overlay` at opacity 1**, the token carrying its own alpha — the same rule as
  `BottomSheet.Overlay`. A scrim is never focusable; dismissal for assistive technology is the
  panel's `onAccessibilityEscape` (iOS two-finger Z) and the Android back button.
- **Modal overlays** (Dialog, Drawer, Feedback, Popover) set `accessibilityViewIsModal` on the
  panel and move accessibility focus to the title on open, back to the trigger on close.
  **Non-modal overlays** (Tooltip, Toast) never take focus.
- **Pure decisions live in `{name}.variants.ts` (and `{name}.position.ts` etc.) and are written
  test-first.** `bun test` cannot render; behaviour is verified on a simulator.
- **No new native peer.** Frosted (`blur`) backdrops need `expo-blur`, which is not a peer of this
  library; every spec scopes blur out and records it as a follow-up.
- **Haptics are pulsar presets** through `Pressable`'s `haptic` / `playHaptic`, never a new API.

## Cross-category dependencies

| Consumer (other category) | Needs from Overlays | Status |
| --- | --- | --- |
| Menu, Context Menu (Actions) | Popover's anchored panel: `popover.position.ts`, `use-anchor-measure.ts`, `Popover.Arrow` | Must wait for Overlays to merge into `develop`; never import from this branch |
| Select, Combobox, Date / Time Picker (Forms) | Popover (anchored list) or BottomSheet | Same |
| FAB (Actions) speed-dial | `Overlay.Portal` + `Overlay.Scrim` | Same |
| Selection Mode, Swipe (Actions) | Toast for undo | Same |

Nothing in Overlays depends on another category. `Alert` (status glyphs and tokens, used by Toast)
and `BottomSheet` are already in `develop`.

## Where each component lives

Each component stays on its own child branch, branched from this one, so it can be reviewed and
merged on its own. This branch holds only the specs and the shared foundation (OVL-P0).

| Branch | Holds | Stacked on |
| --- | --- | --- |
| `feature/cat-overlays` | specs + overlay foundation | `develop` |
| `feature/overlays-dialog` | Dialog | `feature/cat-overlays` |
| `feature/overlays-popover` | Popover | `feature/cat-overlays` |
| `feature/overlays-drawer` | Drawer | `feature/cat-overlays` |
| `feature/overlays-feedback` | Feedback | `feature/overlays-dialog` |
| `feature/overlays-tooltip` | Tooltip | `feature/overlays-popover` |
| `feature/overlays-toast` | Toast | `feature/overlays-dialog` (its over-dialog demo) |

Merge in stack order. Generated files (below) are regenerated on each branch, so whichever lands
second regenerates them again.

## Files every child touches (merge hot spots)

Shared lists and generated files; whoever merges second keeps both entries and regenerates.

| File | Resolution |
| --- | --- |
| `packages/react-native-ui/package.json` `exports` | regenerate — `bun run gen-exports` |
| `apps/playground/src/demos/registry.ts` | regenerate — `bun run gen-demos` |
| `packages/cli/registry/**` | regenerate — `bun --filter delacour run registry:build` |
| `packages/react-native-ui/AGENTS.md` Components table | keep both rows, alphabetical |
| `packages/cli/src/registry/config.ts` `ITEM_META` | keep both entries, alphabetical |
| `apps/web/content/docs/native/components/meta.json` | keep both, under `---Overlays---` |
| `apps/playground/src/app/index.tsx` icon map / rows | keep both |

`bun run previews` drives a simulator through the argent CLI, which is retired on the
maintainer's machine, and `demos.test.ts` fails for any demo marked `capture` with no media in the
manifest. So **no overlay demo is marked `capture` yet.** The flows each child wrote stay in
`.argent/flows/previews/<component>/`, ready for the follow-up below.

## Out of scope (recorded)

- Preview media. Re-add `capture` to each component's demos and shoot them with
  `bun run previews -- -- --only <component>` once a capture tool is available. Dialog's were:
  `confirm` `{ flow: "dialog/confirm", frame: "device", hero: true }`, and `alert-dialog`, `form`,
  `sizes` `{ flow: "dialog/<id>", frame: "device" }`.

- Frosted backdrops (`blur`) — needs `expo-blur` as a new optional peer; a follow-up decision.
- Popover `presentation="bottom-sheet"` — would couple Popover to the optional sheet engine;
  callers compose `BottomSheet` themselves for now.
- A native SwiftUI popover — needs `@expo/ui`.
- Web focus-return semantics beyond what React Native's accessibility API exposes.
