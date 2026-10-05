# Sortable

A vertical list the user reorders by dragging — a playlist, a shortcut list, priorities, checklist
steps. Compound root plus `Sortable.Item` (the row that is measured, lifted and moved) and
`Sortable.Handle` (the grip). `reorderItems` is exported for a caller that needs the same move
outside the gesture.

`import { Sortable, reorderItems } from "@delacour/react-native-ui/sortable";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/sortable` |
| `sortable.tsx` | Root — every shared value a drag touches, the `drag` worklets, auto-scroll, the `Object.assign` |
| `sortable-item.tsx` | `Sortable.Item` — measures itself, follows the finger or its shift, owns the row's context |
| `sortable-handle.tsx` | `Sortable.Handle` — the 44pt pan surface and, in `handle` mode, the accessible element |
| `use-sortable-drag-gesture.ts` | The `Gesture.Pan` both parts build — a relay to the root's worklets |
| `sortable.context.tsx` | The list and row contexts, `useSortableItem` and the part hooks |
| `sortable.types.ts` | `SortableReorderDetails` and `SortableDrag`, shared by root, context and gesture |
| `sortable.variants.ts` | Pure `tv()` slots + every resolver, worklet-safe, no RN imports |
| `sortable.variants.test.ts` | |

## Design

- **A drag renders nothing.** Rows keep their laid-out positions and move by `translateY` on the UI
  thread. The root owns every shared value (`activeId`, `dragY`, `lift`, `shifts`, `phase`,
  `heights`) and builds three worklets — `begin`, `update`, `end` — that the gesture on a row or a
  handle only forwards to. One owner is what lets one finger move every row without any of them
  re-rendering. The lifted row renders twice, at lift and at landing, to swap in `itemActive`.
- **The order is the caller's.** `value` is the ids in render order; the list never reorders
  itself. `onReorder(order, { id, from, to })` fires **once, after the spring settles**
  (`scheduleOnRN` from the animation callback), never per slot passed.
- **No one-frame jump.** Laid out in the new order, a row's "from where it was to where it is"
  transform is already wrong. The root clears every transform from a `useLayoutEffect` keyed on
  `value`, the commit that renders the new order, and a row whose shift goes to zero while `phase`
  reads idle **assigns** it rather than animating — a spring back from there would replay the move
  in reverse. A caller that does not store the order (rejecting the move) still gets a resting list:
  after `UNCOMMITTED_RESET_DELAY` the transforms are dropped anyway.
- **Slot rule: midpoint crossing, not nearest slot.** `resolveTargetIndex` moves the row to the
  furthest slot whose midpoint its leading edge has passed. Nearest-slot feels stuck when a short
  row passes a tall one. Every comparison is against resting geometry, so the answer for a finger
  position does not depend on how the neighbours happen to be animating.
- **Shifts are a layout difference, not `± (height + gap)`.** `resolveShifts` lays the current and
  the projected order out from the same heights and subtracts. That one rule is right for a passed
  row, for the dragged row's landing, and for a pinned row inside the span — which keeps its index
  but moves by whatever now sits above it. `± (height + gap)` is right only for the first.
- **Pinned rows never move; the others reorder around them.** `reorderItems(order, from, to,
  pinned)` moves among the free indices only and writes them back in order. A drag skips over a
  pinned slot; `resolveMoveAction` steps past it. Which rows are pinned is read from the rows' own
  props during render (`collectPinned`, the way `Steps` counts items), so the first render already
  knows each row's actions. A row behind a wrapper component is not found and counts as unpinned.
- **Disabled is per row or for the list.** A disabled row cannot be lifted; the others still move
  past it. The handle fades through `isDisabled` on the `handle` slot.
- **`gap` is laid out by the list**, as a style, not a class — the drag math has to know the
  number.
- **The lifted row is opaque.** `itemActive` is `bg-card` + `rounded-lg` + `shadow-md` + `z-10`, so
  a transparent row never shows the one beneath through it. This is the one shadow in the package:
  a dragged row floats over a sibling of the same fill, and a fill step alone cannot say that.
  `activeClassName` is appended after it.
- **Haptics are an object** — `{ lift, pass }`, default `{ lift: "medium", pass: "selection" }`,
  `false` for neither — played from the worklet with `playHaptic`. `resolveSortableHaptics`
  destructures it to primitives so a rebuilt object does not rebuild the gesture.
- **Auto-scroll is opt-in through `scrollRef`.** A `useFrameCallback`, active only while dragging,
  measures the scroller and the list each frame; `resolveAutoscrollStep` tapers linearly from 0 at
  `autoscrollThreshold` to `autoscrollSpeed` at the edge, and `clampAutoscrollStep` stops once the
  list's own edge is in view — which keeps `scrollTo` inside the content without knowing its height.
  The scroll delta is folded into `dragY` in `retarget`, the one function both the pan and the frame
  callback call, so the row stays under the finger while the content moves.

## Gesture

- **`handle` (default)** puts the pan on `Sortable.Handle` with `minDistance(0)`, the
  `Slider.Track` reasoning: a React Native scroll view races the pan, and one that activates on
  touch wins its slop. The rest of the row stays free for taps and scrolls.
- **`long-press`** puts `activateAfterLongPress(longPressDelay)` on the row; a move before the hold
  completes belongs to the scroll view.
- **`shouldCancelWhenOutside(false)`** — a drag leaves the handle's 44pt square at once.
- **`onFinalize` drops the row**, since it is the one callback a cancelled gesture also reaches.
- **The handle is not a `Pressable`.** A tap recogniser inside would race the pan for the touch, and
  a press means nothing here.

## Accessibility

- **A drag is invisible to a screen reader**, so the accessible element — the handle in `handle`
  mode, the row in `long-press` mode — publishes `accessibilityActions` Move up / Move down and
  `accessibilityValue.text` "Position 2 of 5". An action calls `onReorder` immediately and announces
  the new position with `AccessibilityInfo.announceForAccessibility`.
- **Only the actions a row can perform.** None for a disabled or pinned row; no Move up at the top;
  a step skips pinned slots.
- **The handle** is `accessibilityRole="button"`, labelled "Drag to reorder", 44pt (`size-11`). In
  `long-press` mode it is a visual hint only and is hidden, so the row is not announced twice.

## Motion

Lift and drop of the scale (`SORTABLE_LIFT_SCALE`, 1.02) over `SORTABLE_LIFT_DURATION` (150ms).
Shifts and the landing ride `SORTABLE_SHIFT_SPRING`, critically damped — a test holds
`damping = 2√(stiffness·mass)` so a retune cannot make a row overshoot into its neighbour. Reduce
motion: shifts assign, the landing and lift take `duration: 0`; the finger-following row is direct
manipulation and is never reduced.

## Deviations from the design spec

- **`resolveShifts(order, projected, heights, gap)` replaces `resolveShift(index, …)`** and returns
  every row's shift at once — see Design for why the per-row `±` formula is wrong around pinned rows.
- **`resolveMoveAction` returns `{ kind: "move"; from; to }`**, carrying `from` so the dispatcher
  does not look the row up twice.
- **Added resolvers:** `clampAutoscrollStep`, `resolveSortableHaptics`, `resolveSortablePosition`.
- **`useSortableItem()` also exposes** `count`, `isPinned`, `isDisabled`, `canDrag`, `positionText`,
  `accessibilityActions` and `onAccessibilityAction`, so a custom handle can be as accessible as the
  built-in one.
- **`sortableVariants` has no `isActive` axis.** The lifted surface is the `itemActive` slot, added
  by `cn()` beside `item`, because the row learns it is lifted from a shared value, not a prop.

## What it does not do

- **Vertical only.** Horizontal and grid are out of scope for v1.
- **No virtualisation.** Every row is mounted and measured; comfortable to about a hundred rows.
- **No drag between lists**, no drop zones, no multi-select drag.
- **No nested scroller discovery.** Auto-scroll needs the caller's `scrollRef`
  (`useAnimatedRef<Animated.ScrollView>()`); `Screen` is untouched.
