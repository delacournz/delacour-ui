# Splitter

Two or more panes in one box, with a draggable handle on every seam. Sizes are
percentages of the box, so a layout dragged in portrait is the same layout in
landscape. Compound root plus `Splitter.Pane` and `Splitter.Handle`, and
`useSplitter()` for a custom child.

`import { Splitter } from "@delacour/react-native-ui/splitter";`

It is the general engine: 2..N panes, either axis, stopping where the finger
lets go. `SplitView` is the opinionated two-pane, snap-only sibling, and it
imports this folder's maths leaf rather than copying it.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/splitter` |
| `splitter.tsx` | Root — reads the panes' limits, owns the shared values and the settle — + the `Object.assign` surface |
| `splitter-pane.tsx` | `Splitter.Pane`, a flex-ratio region |
| `splitter-handle.tsx` | `Splitter.Handle` — the pan, the double-tap reset, the whole accessibility surface |
| `splitter-grip.tsx` | Internal: the animated grip capsule |
| `splitter.context.tsx` | `SplitterProvider`, `SplitterIndexProvider`, `useSplitter()`, `useSplitterContext()`, `useSplitterPart()` |
| `splitter.types.ts` | `SplitterSlotProps`, shared by every part |
| `splitter.math.ts` | **Shared** pure maths — clamp, step, snap, fraction ↔ percent. No imports, every export a worklet |
| `splitter.math.test.ts` | |
| `splitter.variants.ts` | The slotted `tv()` and every layout resolver, no RN imports |
| `splitter.variants.test.ts` | |

## Design

- **Axes**: `orientation` — `horizontal` (side by side, drags along x) or
  `vertical` (stacked, drags along y). `variant` — `seam` (flush panes, a 1pt
  rule on the seam) or `panes` (each pane a `rounded-lg` card, `gap-2` between).
  Defaults: `horizontal`, `seam`.
- **No `size` axis.** The handle's touch box is fixed at 44pt across the seam,
  the HIG minimum, and the grip at a 4×32 capsule. A size axis could only let a
  caller build a handle nobody can hit.
- **Tokens are semantic only** — `border`, `card`, `muted-foreground`,
  `foreground`. No new tokens. The `panes` surface is `rounded-lg` because
  `--radius` is the card corner.
- **`panes` restates `Surface`'s classes rather than rendering one.** A pane
  needs `overflow-hidden` and an animated `flexGrow` style on its own node, which
  `Surface` deliberately does not expose. If it ever grows an animated escape
  hatch, switch.

## Layout

- **A pane's size is a flex ratio, not a measurement.** `flexGrow` is its
  percentage off one shared array and `flexBasis` is 0, so Yoga divides the box
  on the UI thread. The box is measured only to turn a drag distance into a
  percentage — never to lay a pane out — so nothing is wrong on the first frame.
- **Nothing stores points.** A rotation re-measures `extent` and nothing else;
  every layout survives it unchanged.
- **The handle is laid over the seam, not between the panes.** It is
  absolutely positioned and centred on the shared edge (the middle of the gap,
  in `panes`), so it takes no room and `[30, 70]` is exactly thirty and seventy.
  `z-10` is load-bearing: the trailing pane is a later sibling and would draw
  over the handle and take every touch on its half. The handle stays invisible
  until the box is measured, so it never flashes at the leading edge.
- **Limits are read, not registered.** The root reads each `Splitter.Pane`'s
  `minSize`, `maxSize`, `isCollapsible`, `collapsedSize` and `defaultSize` off
  `Children.toArray(children)` in render — no mount effect, no first frame with
  the wrong bounds. The array is keyed on its serialised content, so a fresh
  array each render does not rebuild every handle's gesture.
- **Every child is wrapped in an index provider.** A pane reads its own index;
  a handle reads the index of the pane before it, so handle `i` is the seam
  between `i` and `i + 1`. A caller never numbers anything.
- **A wrong tree warns, never throws.** `describeSplitterChildren` names the
  problem — a non-part child, a handle at either end, two panes in a row — and
  the root warns once in development and renders anyway. Fragments are not
  flattened by `Children.toArray`, so a `<>` around panes is "not a pane".
- **An invalid layout falls back to equal shares.** A wrong length, a
  non-finite value, defaults that overflow 100, floors that cannot all fit —
  `resolveInitialLayout` returns equal shares and the root warns.

## State

- **`useControllableState` holds the settled layout; a shared value holds the
  live one.** The pan writes the shared value every frame and JS hears about it
  once, on release, through `onLayoutChange`. A controlled `layout` change
  settles the shared value toward it in an effect.
- **A rejected drag snaps back.** The same `settledDrags` token `Slider` uses:
  a controlled parent that ignores `onLayoutChange` leaves `layout` unchanged,
  so without a token that moves on every release the panes would stay where the
  finger let go.
- **A settle is a progress value, not an animated array.** `from`, `to` and a
  0→1 `progress` sprung on `SPLITTER_SETTLE_SPRING`; an animated reaction writes
  `lerpLayout(from, to, progress)` into `sizes`. The spring clamps its
  overshoot, because an overshoot would push a pane through the floor it is
  settling on. A drag that starts mid-settle cancels it first (`interrupt`) and
  snapshots where the panes really are.
- **Reduce Motion makes every settle a jump.** Dragging is behaviour and always
  tracks; a reset, collapse or assistive step lands with no animation.
- **`setLayout`, `togglePane`, `reset`** on `useSplitter()` run the same fit
  as a drag and fire `onLayoutChange`. Each is a no-op when nothing would move.

## Gesture

- **One pan per handle, `minDistance(0)` and `shouldCancelWhenOutside(false)`**,
  for `Slider.Track`'s reasons: it wins the race against a scroll view's slop,
  and a finger dragging a seam to the box's edge routinely leaves the handle.
- **The drag resolves against a snapshot.** `onBegin` copies `sizes`;
  `onUpdate` runs `resolveDrag` from that snapshot and the total translation,
  never from the live value, so it cannot accumulate error.
- **Only the two panes beside the seam move.** `resolveDrag` holds the leading
  pane between its own bounds and its neighbour's — whichever bites first — and
  the neighbour takes the rest, so the sum never moves and the other panes never
  shift.
- **Collapse is a halfway line, not a mode.** A collapsible pane dragged below
  its floor stops there until the drag passes half of it, then snaps to
  `collapsedSize`; dragging back over the half reopens it at its floor.
- **A release rounds the *seam*, not the pane, to `step`.** Rounding pane widths
  would leave every later seam off the grid. The rounded seam is run back
  through `resolveDrag`, so an off-grid floor still holds. A tap moves nothing
  and settles nothing.
- **A double tap resets, and runs `Simultaneous` with the pan.** `Exclusive`
  would make the pan wait for the tap to fail — a dead zone at the start of
  every drag.
- **The edge haptic fires on the way in.** A worklet remembers whether the
  last frame was held by a bound or collapsed; only the change from free to
  stopped plays. `playHaptic` and `HapticFeedback` come from `pressable.tsx`, the
  library's one haptic vocabulary. Default `"light"`, `false` silences it.
- **Not built on `Pressable`.** Its Tap and its animated transform would fight
  the pan and the position style — `Slider`'s reasoning, unchanged.
- **The grip grows across the seam while held**, 1 → 1.25 on a spring derived
  from the held flag, and turns `bg-foreground`. Along the seam it stays put;
  growing there would read as the handle moving.

## Accessibility

- **`Splitter.Handle` is `adjustable`.** Its value is the pane before it —
  `{ min: 0, max: 100, now, text: "35 percent" }` — and its label defaults to
  "Resize". Say which panes: `accessibilityLabel="Resize sidebar"`.
- **Actions**: `increment` / `decrement` move the seam by `step` and land on the
  step grid; `reset` ("Reset sizes"); and `collapse` / `expand` when a pane beside
  the handle is collapsible. `resolveSplitterAction` maps an action to what the
  root does, as a discriminated union, so the mapping is reachable from `bun test`.
- **`accessibilityState.expanded`** reports the adjacent collapsible pane;
  `disabled` reports a frozen seam.
- **A collapsed pane is hidden from screen readers**, with everything in it —
  a region with no size has nothing a finger could reach either.
- **Tree order is pane, handle, pane**, so a screen reader meets each handle
  between the two regions it resizes.
- **Hardware-keyboard arrows are not wired.** React Native 0.86 has no
  cross-platform `onKeyDown` on a `View`, so a keyboard user reaches the handle
  through the assistive actions above (Full Keyboard Access on iPad maps to
  them). Revisit when RN ships key events on views.

## Shared maths

- **`splitter.math.ts` is the one copy of the size maths.** `SplitView` imports
  it as a leaf — `../splitter/splitter.math`, never `../splitter`. It imports
  nothing and every export carries `"worklet"`; `splitter.math.test.ts` pins both
  by reading the source. Keep its API stable: `clamp`, `snapToStep`,
  `percentToFraction`, `fractionToPercent`, `nearestSnapIndex`, `projectSnap`,
  `DEFAULT_DECELERATION_RATE`.
- `nearestSnapIndex` and `projectSnap` are unused here — no snap points — and
  exist for `SplitView`.
- **A worklet helper is declared above its first caller.** The worklets plugin
  captures a worklet's closure where the function is *declared*, so a worklet
  calling a helper further down the file captures `undefined` and throws
  "undefined is not a function" on a device — while `bun test`, which runs no
  plugin, passes. It shipped once (`resolveInitialLayout → sumDefaults`); the
  "worklet declaration order" test in `splitter.variants.test.ts` now reads the
  source and fails by name.

## Out of scope

Snap points and flings (`SplitView`); switching side-by-side / stacked by window
width (Navigation); persisting the layout (save `onLayoutChange`); point-based
limits; a pointer cursor; nested-splitter arbitration beyond "the inner handle
wins the touch".

## Notes

- **Simulator check, 2026-10-05** (iPhone 17 sim via warden, agent-device, dev
  client): a drag moves both panes and the handle with them and rounds to
  `step` on release; a floor clamps (three columns: the editor stops at 55 with
  the inspector at its 15 floor) and the other seam does not move; a collapsible
  pane snaps to 0 past half its floor and `togglePane` restores it; double tap
  resets; vertical drags along y; the controlled readout updates once per
  release; a disabled handle reports `enabled=false`; inside the gallery's pager
  the handle wins the touch. The handle's value reads "N percent". Not checked:
  the edge haptic (no haptics on a simulator), rotation, Reduce Motion, and a
  VoiceOver increment (agent-device cannot fire an accessibility action).
- **No captured previews yet.** The preview capture needs the argent CLI, which
  is not installed on the build machine, so no demo carries `capture` and the
  docs page has no `<Preview>`. When it is back: mark `anatomy` (hero, flow
  `splitter/anatomy` — the flow file is already in `.argent/flows/previews/`),
  `panes`, `three-columns`, `vertical` and `collapsible` as captured, run
  `bun run previews -- -- --only splitter`, and add the `<Preview>`s back.
- **A collapsed leading pane puts half the handle outside the box.** The touch
  box is centred on the seam, so at 0 its leading 22pt hang past the root's
  edge. The trailing half is still a full-height target; nothing clips it.
