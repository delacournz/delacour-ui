# Navigation — design specs (plan NAV-01)

Seven components for `@delacour/react-native-ui`'s Navigation category. `Steps` and `Tabs`
already exist and are the house references for this category: read
`packages/react-native-ui/src/components/steps/AGENTS.md` and `…/tabs/AGENTS.md` before any spec.

| Phase | ID | Component | Spec | Shape | Size |
| --- | --- | --- | --- | --- | --- |
| 0 | NAV-00 | shared scroll-sections hook | [section below](#nav-00--shared-scroll-sections-lead-branch) | hook + pure lib | S |
| 1 | NAV-01 | Breadcrumb | [breadcrumb.md](breadcrumb.md) | compound, pure collapse | S |
| 1 | NAV-02 | Pagination | [pagination.md](pagination.md) | compound, pure range | M |
| 1 | NAV-03 | Tree | [tree.md](tree.md) | compound, recursive context | M |
| 2 | NAV-04 | SectionProgress | [section-progress.md](section-progress.md) | floating pill + Skia-free SVG ring | M |
| 2 | NAV-05 | SectionRail | [section-rail.md](section-rail.md) | floating rail + panel | M |
| 2 | NAV-06 | Sortable | [sortable.md](sortable.md) | gesture + UI-thread transforms | L |
| 2 | NAV-07 | Tour | [tour.md](tour.md) | Modal overlay + SVG cutout | L |

All seven can be built in parallel — none imports another. Phase 2 only reads the NAV-00 hook,
which lands on the category branch **before** any child workspace is created, so every child
branches with it already present.

## Shared rules every spec inherits

- **Patterns.** Compound + context (pattern B), one slotted `tv()` in `{name}.variants.ts`
  holding every pure resolver, one file per part, `Object.assign` root with a `function`
  declaration, `DelacourUI.`-prefixed `displayName` on every component, provider and internal
  leaf. `{name}.context.tsx` and `{name}.types.ts` leaves — a part never imports its root or its
  own `index.ts`.
- **Interaction is `Pressable`** (`@delacour/react-native-ui/pressable`). Haptics only through
  its `haptic` prop or the exported `playHaptic` (Pulsar) — never `expo-haptics`. A component
  exposes `haptic?: false | HapticFeedback`, not a boolean.
- **State is `useControllableState`** for every `value`/`defaultValue`/`onValueChange` triple
  (and `open`/`defaultOpen`/`onOpenChange`).
- **Props are `is*` booleans** (`isDisabled`, `isReadOnly`) — the house spelling, not
  `disabled`.
- **Motion.** Reanimated on the UI thread; respect reduce motion (`useReducedMotion`) — state
  changes snap rather than travel. `useCalmMotion` only for *decorative loops* (none of these
  have one).
- **Colour.** Text colour on the `Text` (rule 1). Glyph colour through
  `IconDefaultsProvider`/`useThemeColor`, token names asserted against `theme.css` in the variants
  test (the `Steps` pattern).
- **Icons.** Central Icons only, from `../../icons/central`.
- **RTL.** `start`/`end` (`ps-*`, `pe-*`, `start-*`) never `left`/`right`; mirror directional
  chevrons with `I18nManager.isRTL`.
- **Touch targets ≥ 44pt.** A visually smaller control gets `hitSlop` to 44.
- **No new peer dependency in this category.** Everything here is built from the existing
  required peers: Reanimated, Gesture Handler, Worklets, Pulsar, react-native-svg,
  safe-area-context. No component imports `react-native-teleport` or the bottom-sheet engine
  (both optional peers): overlays use React Native's own `Modal` (Tour) or absolute
  positioning inside the caller's screen (SectionRail, SectionProgress).

## Delivery checklist — every component

1. `{name}.variants.test.ts` first, then `{name}.variants.ts`; `bun test <path>` after each change.
2. Parts, context, types, `index.ts`.
3. `src/components/{name}/AGENTS.md` (file map, design, a11y, motion, what it does not do) and a
   row in `packages/react-native-ui/AGENTS.md`'s **Components** table (alphabetical).
4. `bun run gen-exports` (from `packages/react-native-ui`).
5. `ITEM_META` entry in `packages/cli/src/registry/config.ts`; `bun --filter delacour run registry:build`; commit `registry/`.
6. Demos in `apps/playground/src/demos/{name}/` + `index.ts`, route
   `apps/playground/src/app/(components)/{name}.tsx` (six-line `DemoGallery` shell), a row on
   `src/app/index.tsx`, `bun run gen-demos`. 4–6 demos marked `capture`, one `hero`.
7. Docs page `apps/web/content/docs/native/components/{name}.mdx` + `meta.json` entry, matching
   `steps.mdx`.
8. `bun run changeset` — `minor` on `@delacour/react-native-ui`.
9. `bun test`, `bun run typecheck`, `bun run check` green.
10. Simulator check via `warden claim ios --json` + agent-device; release the lease.

## NAV-00 — shared scroll sections (lead branch)

`SectionProgress` and `SectionRail` both need "which section is the reader in, and how far down
are they". Built once, on the category branch, before the children are created:

- `src/lib/scroll-sections.ts` (pure, worklet-safe, no RN imports) + `scroll-sections.test.ts`
  - `type SectionOffset = { id: string; y: number }`
  - `resolveActiveSection(sections: readonly SectionOffset[], scrollY: number, readingLine: number): string | undefined`
    — the last section whose `y` is ≤ `scrollY + readingLine`; first section above the first
    offset; sections sorted by `y` before reading.
  - `resolveScrollProgress(scrollY: number, contentHeight: number, viewportHeight: number): number`
    — clamped 0–1; 1 when nothing scrolls.
  - `resolveSectionScrollTarget(y: number, readingLine: number): number` — `max(0, y - readingLine)`.
- `src/hooks/use-scroll-sections.ts` — `useScrollSections({ readingLine?: number })` returns
  `{ scrollRef, scrollHandler, register(id) → onLayout, activeId (React state, changes only on
  section change), progress: SharedValue<number>, scrollY: SharedValue<number>, scrollTo(id) }`.
  `scrollHandler` is a `useAnimatedScrollHandler` to pass to an `Animated.ScrollView`'s
  `onScroll`; the active section is resolved on the UI thread and reported with `scheduleOnRN`
  only when it changes.
- The hook is documented in `packages/react-native-ui/AGENTS.md`'s directory structure list.

## Cross-category dependencies

| Needed by | What | Owner category | Decision |
| --- | --- | --- | --- |
| Breadcrumb ellipsis menu | a Menu / Popover listing hidden crumbs | Overlays / Actions (unmerged) | **Scoped out.** `onEllipsisPress` hands the caller the hidden items; the demo opens a `BottomSheet` (already on develop). |
| Tour card | a Popover with an arrow | Overlays (unmerged) | **Built internally** — the card is a positioned `Surface` inside Tour's own `Modal`; no arrow in v1. |
| SectionRail / SectionProgress panel | a Popover / portal | Overlays (unmerged) | **Built internally** as an absolutely positioned panel in the component's own tree; caller mounts the component as a sibling of the scroll view. |
| Sortable rows inside a `Screen.ScrollArea` | an animated ref to the scroller | Screen (merged) | Caller passes `scrollRef`; Screen is untouched. |
| Tree multi-select checkboxes | tri-state checkbox | Forms (Checkbox merged) | Tree draws selection itself; caller may put a `Checkbox` in `Tree.Icon`. Tri-state cascade is out of scope for v1. |

## Unresolved

None blocking. Defaults chosen are recorded in each spec under **Decisions**.
