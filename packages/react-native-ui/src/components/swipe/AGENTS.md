# Swipe

A row that slides aside to reveal actions behind it — delete, archive, snooze, mark done. Compound
root plus `Swipe.Start`, `Swipe.End`, `Swipe.Action` and `Swipe.Group`, with `useSwipe()` and
`useSwipeGroup()`. It acts on one row; for many rows at once, a selection mode is the pattern.

`import { Swipe } from "@delacour/react-native-ui/swipe";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/swipe` |
| `swipe.tsx` | Root — the partition, the pan, the release, the imperative handle and the accessibility actions |
| `swipe-start.tsx` | `Swipe.Start`, a marker that renders nothing |
| `swipe-end.tsx` | `Swipe.End`, a marker that renders nothing |
| `swipe-action.tsx` | `Swipe.Action`, one tile, positioned by its own animated style |
| `swipe-panel.tsx` | The layer behind one edge — internal, one per side that has tiles |
| `swipe-group.tsx` | `Swipe.Group`, the registry that keeps one row open |
| `swipe.context.tsx` | Row, tile and group contexts, `useSwipe()`, `useSwipeGroup()` |
| `swipe.types.ts` | `SwipePanelProps`, shared by the two markers |
| `swipe.variants.ts` | Pure `tv()` slots + the partition, release and tile-layout resolvers, no RN imports |
| `swipe.variants.test.ts` | |

## Design

- **Colours**: `default`, `primary`, `success`, `warning`, `info`, `destructive` — Badge's set. A
  tile is `bg-{color}` with its glyph and label in `{color}-foreground`; `default` is `bg-muted`
  with `text-foreground`, since there is no `muted` surface ink stronger than that.
- **Tiles are 72pt, all of them.** A panel's width is a count times `SWIPE_TILE_WIDTH`, so nothing
  is measured and the release can be judged on the UI thread the moment the finger lifts. The
  `tileContent` slot spells the same number as `w-18`, and a test pins the pair.
- **The panel is exactly as wide as the gap the row has left.** Never wider, so it cannot paint
  over a row that has no background of its own; never narrower, so no hole opens. The row slot
  sets no `bg-*` and a test holds it to that — the two never overlap, so the row needs none.
- **Past the tiles' total the outermost tile grows, and the panel wears its colour.** An overshoot
  then reads as *more of that action* rather than as an empty strip. The outermost is the last
  tile on `end` and the first on `start` — `resolveOutermostIndex`.
- **Tiles emerge from under the row.** Short of fully open each is overlapped by the one outside
  it, spread in proportion to the gap; they are whole and edge to edge exactly when the gap
  reaches their total. `resolveTileLayout` is the rule, and a test sweeps it to prove the tiles
  always cover the gap and never reach past it once open.
- **A tile's content box is pinned to its inner edge**, so when the outermost grows its glyph
  stays beside its neighbours rather than drifting to the middle of a widening slab.

## Anatomy

- **`Swipe.Start` and `Swipe.End` are markers, lifted out by element type.** Only the root knows
  the gap, so only the root can lay the tiles out; a marker that rendered its own children would
  need the offset passed back down to it anyway. Everything that is not a marker is the row, and
  order does not matter.
- **The match is on `displayName`, not on function identity.** The package ships raw source, so
  React Compiler or a second module instance can hand the root an element whose `type` is a
  different object standing for the same component — the failure
  [Switch](../switch/AGENTS.md)'s thumb detection records. `partitionSwipeChildren` reads only
  `type.displayName` and `props.children`, which is also what lets the test feed it plain objects.
- **A tile has to be written directly inside its marker.** `Swipe.Action` reads a tile context the
  root supplies as it lays each tile out, and throws by name if it is rendered anywhere else.
  Wrapping actions in a custom component inside the marker therefore does not work — the wrapper
  would be the tile. This is the trade the lift-out makes.
- **The icon is a component prop, and that bends the house rule on purpose.** Icons are composed
  everywhere else, but a tile has to size its glyph to `size-icon-md` and tint it to its
  foreground. It takes the same `IconComponent` type `Icon`'s `icon` prop takes and renders
  `<Icon icon={…} />` inside an `IconDefaultsProvider`, so the glyph still flows through the one
  icon path the package has.

## Gesture

- **`activeOffsetX([-10, 10])` under `failOffsetY([-8, 8])`**, [Tabs](../tabs/AGENTS.md)' pairing.
  The pan waits for clearly sideways intent and fails the moment the finger commits vertically, so
  a list of rows scrolls normally. This is the opposite of [Slider](../slider/AGENTS.md)'s
  `minDistance(0)`: a slider owns every touch on its track, a row owns only the sideways ones.
- **A side with no panel rubber-bands at 0.2 and returns.** The row still answers the finger, so
  the touch does not feel dead, but it never promises an action that is not there.
- **The release is judged on a projection**: `offset + velocity × 0.1` against half the panel. A
  projection that crosses the rest position closes rather than flinging the row open on the other
  side.
- **A full swipe needs the finger itself past the point.** `|offset| > panel + 0.35 × row`, with
  the projection still beyond it. A flick alone never fires the outermost action, because that
  action is routinely Delete; and pulling back from past the point before letting go cancels it.
  This is the one reading of "or a projected equivalent" that cannot delete by accident. The
  haptic ticks once at exactly that crossing and re-arms if the finger goes back, so the person
  letting go knows what will happen.
- **The fly-off fires the action when it lands, then brings the row back a beat later.** An action
  that removes the row from state unmounts it during that beat, so it never visibly slides back
  in; one that does not (Done, Archive into the same list) sees its row return closed.
- **Tapping the open row closes it and swallows the tap.** A transparent shield covers the row
  only while a side is open, behind its own `Gesture.Tap()`, so the row's own `Pressable`s never
  see that tap.
- **The release runs in `onFinalize`, gated on the pan having started.** `onFinalize` also fires
  for a touch that never activated; without the gate a stray tap would re-judge, and stomp on, an
  imperative `open()` still springing.
- **Nothing re-renders during a drag.** The offset, the grab, the full-swipe latch and the measured
  width are shared values; React state changes only when a release settles a side.
- **Every worklet body is self-contained.** `resolveSwipeRelease`, `resolveSwipeDrag` and
  `resolveTileLayout` are restated inside the gesture and the animated styles rather than called,
  and the tests pin the pure versions. A module-scope worklet calling a sibling is the crash
  [Slider](../slider/AGENTS.md) documents.

## Group

- **Rows register through context, never by the group walking its children.** A row nested in a
  `ListGroup`, a `.map()` or a custom component still belongs. The registry is a ref, so joining
  or leaving it re-renders nothing.
- **The group closes only rows that are open.** A close aimed at a shut row would restart its
  spring and cancel a drag already under way on it.
- **`useSwipeGroup()` outside a group is a no-op, not a throw**, so a screen can call
  `closeAll()` whether or not its rows are grouped.

## Motion

- **Under reduced motion every spring becomes a 160ms timing, and the fly-off becomes a fade.**
  The row still follows the finger — direct manipulation is not decorative — and the fade keeps
  the outcome visible rather than cutting.

## RTL

- **`I18nManager.isRTL` flips one sign — the row's translation and the pan's reading of it.** The
  offset is held in logical points (positive reveals `start`), and the panels and tiles are pinned
  with Yoga's logical `start` / `end`, which mirror on their own. `end` is always the edge text
  runs toward.

## Accessibility

- **Every action is published on the row as an accessibility action**, named and labelled by its
  `label`, and dispatched by name. A swipe is invisible to a screen reader, so without this the
  actions would not exist for one.
- **The row is a single accessibility element** (`accessible`), the shape a list row with custom
  actions takes; `accessibilityLabel` and `accessibilityHint` passed to `Swipe` land on it. A row
  that needs its own separately focusable controls is not a swipe row.
- **Tiles are `button`s, hidden while the row is shut** (`accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` on each panel), so a screen reader does not
  walk into actions nobody can see.

## Out of scope

- A controlled `openSide` prop. The imperative handle and `onOpenChange` cover the cases that came
  up; a controlled pair can follow through `useControllableState` if one appears.
- Wrapped tiles (see Anatomy), per-tile widths, and vertical swipes.
- Undo. A demo keeps local state; a toast belongs to the overlays.
