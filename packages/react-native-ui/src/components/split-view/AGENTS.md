# SplitView

Two stacked panes with a 44pt drag row between them that settles on one of a
few named heights, flung there by the release velocity. Compound root plus
`SplitView.Top`, `SplitView.DragArea`, `SplitView.Bottom` and `SplitView.Handle`,
and `useSplitView()` for a custom child.

`import { SplitView } from "@delacour/react-native-ui/split-view";`

The in-flow, snap-to-stops layout for a screen with a primary region and a
secondary one: a map over its results, a camera preview over a form, a chart
over its table.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/split-view` |
| `split-view.tsx` | Root — resolves the stops, owns the shared height and the settle — + the `Object.assign` surface |
| `split-view-top.tsx` | `SplitView.Top`, the pane whose height animates |
| `split-view-bottom.tsx` | `SplitView.Bottom`, `flex-1` |
| `split-view-drag-area.tsx` | `SplitView.DragArea` — the pan, tap-to-cycle, the whole accessibility surface |
| `split-view-handle.tsx` | `SplitView.Handle`, the grip capsule |
| `split-view.context.tsx` | `SplitViewProvider`, `useSplitView()`, `useSplitViewContext()`, `useSplitViewPart()` |
| `split-view.types.ts` | `SplitViewSlotProps`, `SplitViewPaneProps` |
| `split-view.variants.ts` | The slotted `tv()` and every pure resolver, no RN imports |
| `split-view.variants.test.ts` | |

## SplitView, Splitter or BottomSheet

| | SplitView | Splitter | BottomSheet |
| --- | --- | --- | --- |
| Panes | exactly 2 | 2..N | content over the app |
| Axis | vertical | either | vertical |
| Release | a named stop, velocity-projected | where it was let go, rounded to `step` | a snap point, or dismissed |
| Controlled value | `snapIndex` | `layout` (percent) | the sheet's index |
| Handle | a 44pt row with layout height | a touch box over the seam, no height | the sheet's own grabber |
| Dismisses, backdrop, keyboard | no | no | yes |

- **Two components, one owner of the maths.** Release, pane count, axis, unit
  and handle anatomy all differ, so one API covering both would carry props
  meaningless half the time. What they share is generic maths, and that lives in
  `splitter/splitter.math.ts`, imported here as a **leaf** —
  `../splitter/splitter.math`, never `../splitter`, which would pull the whole
  compound in. Only `clamp` and `projectSnap` are used. The registry therefore
  pulls the `splitter` item along with this one; accepted, rather than forking
  three functions.
- **Not master–detail.** It never switches to side by side on a tablet or
  pushes a screen on a phone. That is a navigation decision; an app that wants it
  renders a horizontal `Splitter` on a wide window and a `SplitView` on a narrow
  one, chosen with `useWindowDimensions`. The docs page carries that recipe.
- **Not `BottomSheet`'s engine.** Its snap points track a floating sheet with a
  backdrop and keyboard handling, and reusing it would drag in
  `react-native-teleport` for a layout that never leaves the screen.
- **Not `Splitter.Handle`.** That is an overlay on a seam; this is a row with
  height. The grips are a few classes each, and sharing one would be a
  cross-folder component import for nothing.

## Design

- **Axes**: `variant` — `panes` (two `rounded-lg` card surfaces with the drag
  row between) or `seam` (flush panes, a 1pt `bg-border` rule behind the grip,
  for inside a `Card` or sheet). Default `panes`. Also `isActive` (finger down:
  the grip turns `bg-foreground`) and `isDisabled` (`opacity-50`).
- **No `size` or `color` axis.** The row is 44pt, the HIG minimum, and is a
  touch target, not a size step. The grip is chrome, not an accent.
- **Tokens are semantic only** — `border`, `card`, `muted-foreground`,
  `foreground`. No new tokens.
- **The drag row is layout in both variants.** It takes 44pt of the column, so
  neither pane loses its edge to a touch box. Stops are therefore resolved
  against the box **less** the row: fraction `1` is everything but the row.

## Stops

- **A stop `<= 1` is a fraction; `> 1` is points.** They can be mixed:
  `[120, 0.5, 1]`. Fractions round to whole points.
- **The index is into the stops ordered by resolved height.** `sortSnapPoints`
  validates, sorts and dedupes the raw values; `resolveSnapHeights` then sorts
  the *heights*, because mixed units only have an order once the box is known —
  `[0.5, 1, 120]` is `120, half, all`. With one unit the two orders agree. A
  mixed list whose order flips between portrait and landscape keeps its index
  and so changes which stop it means; that is the price of mixing, and why the
  docs recommend one unit unless a stop has to be a fixed size.
- **No stop crushes either pane.** Each is held between `minTopHeight` and the
  usable height less `minBottomHeight`.
- **Stops that clamp together are kept.** The index is the public value; dropping
  one would shift every index above it.
- **Fewer than two stops is an error value, not a throw.** `sortSnapPoints`
  returns a `SplitViewResult` — the same shape as `@delacour/types`' `Result`,
  restated because that package is private and this file is copied into
  consumers' repos and shipped to npm. The root warns and uses the defaults.
- **Infeasible floors** (`minTop + minBottom` above the usable height): every
  stop is the middle of the box and the root warns once in development.

## State

- **`useControllableState<number>` holds the index; one shared value holds the
  height.** A drag writes the shared value every frame; JS hears once, through
  `commitDrag`, when the release has picked a stop.
- **The sync effect distinguishes a new box from a new index.** When the heights
  change — first measurement, rotation, new stops or floors — the pane **jumps**
  to the same index (no spring on an extent change). When only the index changes
  — controlled, `snapTo`, an assistive action, a tap — it springs. A drag has
  already started its spring by the time it reports, so `settledIndex` is set
  first and the effect does not restart it and throw away the finger's velocity.
- **A rejected drag still snaps back.** A controlled parent that ignores
  `onSnapIndexChange` leaves `snapIndex` unchanged; a `settledDrags` counter
  re-runs the sync so the pane returns to the parent's stop rather than staying
  where the finger left it.
- **Before measurement both panes flex 1.** The top pane's animated style reads
  `extent`; at `0` it is `flexGrow: 1` like the bottom, so the first frame is an
  even split rather than a garbage height.
- **An invalid `snapIndex` is clamped** and warns in development.
- **The child shape warns, never throws.** Anything but `Top`, `DragArea`,
  `Bottom` in that order — `describeSplitViewChildren` names it.

## Motion

- **Pan on the drag row only**: `minDistance(0)`, `shouldCancelWhenOutside(false)`
  — the `Slider.Track` recipe. A scrollable in either pane is unaffected.
- **The drag follows the finger from a snapshot**, rubber-banded past the
  lowest and highest stop (`rubberBand`, iOS's `0.55` coefficient over half the
  box) and never negative.
- **The release is projected** with `projectSnap` at UIScrollView's *fast*
  deceleration (`0.99`), not the maths leaf's *normal* default: at `normal` a
  1000pt/s release travels half a screen and every lazy release skips a stop. At
  `fast` it travels about a hundred points, so a flick skips and a drop does not.
- **The settle springs with the finger's velocity** — `damping 28, stiffness
  260, mass 0.9`. Reduce Motion assigns the height instead: the drag still
  tracks (it is behaviour), the release jumps.
- **The haptic follows the projected stop.** Each frame works out where a
  release would land; when that changes it plays once. A tap or assistive cycle
  plays it from JS through `scheduleOnUI`.
- **Tap and pan share one slop** (`SPLIT_VIEW_TAP_SLOP`, 6pt). The tap runs
  simultaneously with the pan, with `maxDistance` at the slop; the pan only
  settles a drag that moved further than it, and otherwise puts the pane back
  on its stop. One touch is a tap or a drag, never both.

## Accessibility

- **The drag row is the adjustable element**: `accessibilityRole="adjustable"`,
  label default "Resize panes", value `{ min: 0, max: count − 1, now, text:
  "Position 2 of 3" }`. The grip is hidden from assistive technology.
- **Increment and decrement are offered only where they move something.**
  `increment` is the next larger top pane. At the ends the action is removed, so
  the list never offers a no-op.
- **Activate cycles like a tap** and announces "Position N of M" when a screen
  reader is on. Increment and decrement do not announce: VoiceOver reads an
  adjustable's new value itself, and announcing too would read it twice.
- **Disabled**: the pan and tap are disabled, `accessibilityState.disabled`, no
  actions registered, the grip at half opacity.
- Panes are layout and have no role. Reading order: top, drag row, bottom.

## Out of scope

- Horizontal split, three or more panes — `Splitter`.
- Width-adaptive master–detail and push navigation — the Navigation category.
- Overlaying content, backdrops, dismissal — `BottomSheet`.
- Persisting the chosen stop — `onSnapIndexChange` is the hook for it.
- Dragging the panes' content. Only the drag row is a handle.

## Notes

- **Worklet helpers are declared above their callers.** The worklets plugin
  captures a worklet's closure where the function is declared; `Splitter` shipped
  that bug once. The "worklet declaration order" test reads the source.
- Simulator check: see the card comment and the entry below.
