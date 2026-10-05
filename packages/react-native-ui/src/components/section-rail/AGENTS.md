# SectionRail

A thin rail of bars along one screen edge — one bar per section of a long screen, the active one
highlighted — that expands into a labelled outline. Compound root plus `SectionRail.Trigger`,
`SectionRail.Bar`, `SectionRail.Content` and `SectionRail.Item`; the scrim is internal.

`import { SectionRail } from "@delacour/react-native-ui/section-rail";`

Pair it with [`useScrollSections`](../../hooks/use-scroll-sections.ts): `value={sections.activeId}`
and `onValueChange={sections.scrollTo}`.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/section-rail` |
| `section-rail.tsx` | Root — value and open state, the close timer, bar bookkeeping, back handler, and the `Object.assign` |
| `section-rail-trigger.tsx` | `SectionRail.Trigger` — the bars' column, the tap-or-scrub gesture, the adjustable element |
| `section-rail-bar.tsx` | `SectionRail.Bar` — a resting track with a faded active layer |
| `section-rail-content.tsx` | `SectionRail.Content` — the panel, its fade and scale, always mounted |
| `section-rail-item.tsx` | `SectionRail.Item` — one row; registers its title with the root |
| `section-rail-scrim.tsx` | The transparent outside-tap layer — internal |
| `section-rail.context.tsx` | The context, `useSectionRail`, and the part guard |
| `section-rail.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `section-rail.variants.test.ts` | |

## Design

- **Placement is logical.** `placement` is `end` (default, the right in left-to-right) or `start`;
  `align` is `center` (default) or `bottom`, which sits the rail in the thumb's reach and grows the
  panel upward from the bottom corner. `resolveRailPlacementStyle` turns placement, align, the
  safe-area insets and `offset` into one padded frame; the physical insets are mapped onto logical
  padding there, so right-to-left reads the other inset.
- **The trigger and the panel each sit in a full-screen frame** (`frame` slot, `absolute inset-0`,
  `pointerEvents="box-none"`). A percentage `maxWidth` on the panel — `78%` by default — is then a
  share of the usable screen, not of a box with no width of its own.
- **Nesting shortens bars and indents rows from one ladder.** `resolveBarLength` (`w-4`, `w-3`,
  `w-2`) and `resolveItemIndent` (`ps-3`, `ps-6`, `ps-9`) both clamp at `SECTION_RAIL_MAX_LEVEL`
  through one helper, so the rail and the outline it mirrors never disagree about what nests.
- **The bar's colour is two layers.** `bar` is the muted track; `barFill` is a `bg-foreground`
  layer over it whose opacity eases over 120ms. A colour can ease without resolving either token
  in JavaScript, and both stay classes a theme repaints. The suite asserts every colour token the
  slots name is declared in both themes.
- **The label owns its colour** (rule 1). `itemLabel` carries the active colour and weight; the
  row carries only the active background.
- **The scrim is transparent.** It catches the outside tap; it does not dim the page the reader is
  choosing a place in.
- **Not portalled.** No Overlays dependency: the rail is mounted as the last child of the screen's
  container, a sibling of the scroll view, and fills it with `pointerEvents="box-none"` so the
  content keeps scrolling everywhere but the rail's own hit area.

## Interaction

- **The trigger is not a `Pressable`.** Its one touch is a tap (open) or a scrub (open, follow the
  finger, commit on release), and a `Pressable` would nest a second tap inside the scrub's pan —
  `Rating.Stars`' reason. `Gesture.Exclusive(pan, tap)` decides it: the pan activates after 4pt of
  vertical travel and fails after 16pt sideways, and the tap fires only when the pan never does.
- **The scrub runs on the UI thread.** Each bar reports its box through `onLayout`; the root keeps
  them in a map and publishes them, sorted by `resolveBarOrder`, to a shared value. The worklet
  maps the finger through `resolveScrubIndex` (nearest bar, gap midpoints as boundaries, clamped
  at the ends) and crosses to React only when the section under the finger changes — once per
  row, which is also when `haptic` ticks via `playHaptic`.
- **A bar must be a direct child of the trigger.** Its `onLayout` box is relative to its parent,
  and the scrub's `event.y` is relative to the trigger; a wrapper between them shifts every box.
- **Highlight is not value.** While scrubbing the row under the finger is drawn active
  (`activeValue`); `value` moves only on release. A cancelled scrub hands the highlight back.
- **A pick lingers.** A row tap or a scrub release commits, then closes after `closeDelay` (300ms)
  so a mis-tap can be corrected; picking again restarts the timer. `shouldEmitSection` keeps a
  re-pick of the active section from calling `onValueChange`.
- **`value={undefined}` stays controlled.** A scroll hook's `activeId` is `undefined` before the
  first scroll, and `useControllableState` reads `undefined` as uncontrolled. The root checks
  whether `value` was passed at all and carries an empty value as `null` internally.
- **Outside tap and Android back close.** The scrim is rendered only while open, under the
  children; `BackHandler` is subscribed only while open.

## Accessibility

- **The trigger is one `adjustable` element** named "Sections" and valued by the active row's
  title, which each `Item` registers with the root — the reason the panel stays mounted while
  closed. Swipe up or down steps through the sections in rail order (`resolveAdjacentSection`,
  stops at the ends rather than wrapping); double-tap toggles the panel; `expanded` reflects it.
- **Bars are hidden from assistive technology.** The trigger speaks for them.
- **Rows are `button`s, `selected` when active.** When the panel opens, focus moves to the
  committed row after the 160ms fade, so the reader starts where they are.
- **The open panel is modal to VoiceOver** and closes on the escape gesture; closed, it is hidden.
- **Titles wrap to two lines, then truncate.** Rows are at least 44pt tall; the trigger is at
  least 44pt wide however thin its bars.

## Motion

- The panel fades and scales (0.92 → 1) from its anchor corner over 160ms, ease-out
  (`resolvePanelTransformOrigin` maps the logical anchor to a physical origin). Reduce motion keeps
  the fade and drops the scale.
- A bar's active layer eases over 120ms; reduce motion snaps it.

## What it does not do

- **No derived bars.** Bars and rows are written separately and should mirror each other — same
  values, same order, same `level`s. Deriving one from the other would need children walking
  across two subtrees; the doc comment and the demos show the mirrored shape.
- **No pager mode.** A pager is the same component with `value` driven by the pager's index — the
  `pager` demo, not a prop.
- **No portal.** Mount it inside the screen it outlines.
