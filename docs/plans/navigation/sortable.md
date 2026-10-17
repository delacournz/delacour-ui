# NAV-06 — Sortable

`import { Sortable, reorderItems } from "@delacour/react-native-ui/sortable";`

## Purpose on mobile

A vertical list the user reorders by dragging — a playlist, a home-screen shortcut list,
priorities, checklist steps. Rows keep their laid-out positions and are moved with transforms on
the UI thread during a drag, so a drag costs no React renders; React hears about the new order
once, after the row lands.

## API

```tsx
const [order, setOrder] = useState(["a", "b", "c"]);

<Sortable value={order} onReorder={(next) => setOrder(next)} gap={8}>
  {order.map((id) => (
    <Sortable.Item key={id} id={id}>
      <Item>
        <Item.Content><Item.Title>{rows[id].title}</Item.Title></Item.Content>
        <Sortable.Handle />
      </Item>
    </Sortable.Item>
  ))}
</Sortable>
```

```ts
type SortableActivation = "handle" | "long-press";

type SortableReorderDetails = { id: string; from: number; to: number };

type SortableProps = Omit<ViewProps, "children"> & {
  /** Row ids in render order. Caller-owned. */
  value: readonly string[];
  onReorder: (order: string[], details: SortableReorderDetails) => void;
  gap?: number;                               // default 0
  activation?: SortableActivation;            // default "handle"
  longPressDelay?: number;                    // default 220
  haptic?: false | { lift: HapticFeedback; pass: HapticFeedback }; // default { lift: "medium", pass: "selection" }
  isDisabled?: boolean;
  /** The enclosing scroller, for auto-scroll near its edges. */
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  autoscrollThreshold?: number;               // default 72
  autoscrollSpeed?: number;                   // default 8 (points/frame at the edge)
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string) => void;
  children: ReactNode;
  className?: string;
};

type SortableItemProps = ViewProps & {
  id: string;
  isDisabled?: boolean;     // cannot be lifted; others move past it
  isPinned?: boolean;       // never moves; others reorder around it
  activeClassName?: string;
  className?: string;
};

type SortableHandleProps = ViewProps & { accessibilityLabel?: string; className?: string }; // default "Drag to reorder"
```

`useSortableItem()` exposes `{ id, index, isActive: SharedValue<boolean>, moveUp, moveDown }`
for a custom handle or row.

## Mechanics

- Each `Item` reports its height via `onLayout` into a shared `heights` SharedValue map
  (id → height); `offsets` (cumulative tops including `gap`) derived on the UI thread. Variable
  heights supported.
- Drag: `Gesture.Pan` on the handle (`activation="handle"`) or
  `Gesture.Pan().activateAfterLongPress(longPressDelay)` on the row. The active row follows the
  finger (`translateY`), raised `zIndex`, `scale 1.02`, opaque `bg-card` + shadow so lower rows
  never show through.
- **Slot rule**: the active row moves to the first slot whose midpoint it crosses (not nearest
  slot). Other rows animate `translateY` by ± the active row's height + gap with `withSpring`.
  Pinned rows keep their slot; the active row skips over them.
- On release the row springs into its slot; `onReorder` fires **after the spring settles**
  (`scheduleOnRN` from the animation callback), then transforms reset in the same commit as the
  new order renders (avoid a one-frame jump: reset transforms in a `useLayoutEffect` keyed on
  `value`).
- Auto-scroll: when the finger is within `autoscrollThreshold` of the scroller's visible edge,
  `scrollTo(scrollRef, 0, y + speed * ramp)` each frame via `useFrameCallback`, adding the scroll
  delta to the drag translation.
- No virtualisation: all rows mounted (document a soft ceiling ~100 rows).

## Pure logic (`sortable.variants.ts`, worklet-safe)

- `reorderItems(order, from, to)` → new array (exported publicly).
- `computeOffsets(order, heights, gap)` → tops.
- `resolveTargetIndex({ activeIndex, activeTop, activeHeight, offsets, heights, pinned })`
  → index by midpoint-crossing; never lands on a pinned slot.
- `resolveShift(index, activeIndex, targetIndex, activeHeight, gap)` → translateY for a resting row.
- `resolveAutoscrollStep(fingerY, viewportTop, viewportHeight, threshold, speed)` → signed step,
  tapered linearly to 0 at the threshold.
- `resolveMoveAction(order, id, direction, pinned)` → `{ kind: "move"; to: number } | { kind: "blocked" }`.
- `sortableVariants` slots `root`, `item`, `itemActive`, `handle`, `handleIcon`; axis
  `isDisabled`.

## Accessibility

- Drags are invisible to screen readers. The handle (or the row in `long-press` mode) publishes
  `accessibilityActions` `[{ name: "moveUp", label: "Move up" }, { name: "moveDown", label: "Move down" }]`
  and `accessibilityValue.text` "Position 2 of 5". Actions call `onReorder` immediately and
  announce the new position (`AccessibilityInfo.announceForAccessibility`).
- Handle: `accessibilityRole="button"`, label "Drag to reorder", hit area ≥ 44pt.
- Disabled/pinned rows omit the actions they cannot perform.

## Motion

Lift scale/shadow 150ms; shifts `withSpring` (critically damped). Reduce motion: shifts and drop
use `withTiming(…, { duration: 0 })` except the finger-following row (that is direct
manipulation, not animation).

## Reuses

Gesture Handler, Reanimated, Worklets (`scheduleOnRN`), `playHaptic`, `Icon`
(`IconGrip`/nearest Central drag-handle glyph), `Item` / `ListGroup` in demos.

## Decisions

- `activation` value is `"long-press"` (kebab, house string style).
- Vertical only in v1; horizontal and grid recorded as out of scope.
- `haptic` is an object so lift and pass can differ; `false` disables both.

## Playground demos

`handle` (hero, capture), `long-press` (capture), `variable-heights` (capture), `pinned`
(capture), `in-scroll-view` (long list with auto-scroll, `Screen.ScrollArea` + `useAnimatedRef`),
`list-group` (rows inside a `ListGroup`; capture).

## Acceptance

- [ ] `reorderItems`, `resolveTargetIndex` (incl. pinned + variable heights), `resolveAutoscrollStep`
      fully table-tested.
- [ ] No React render during a drag (render counter demo).
- [ ] `onReorder` fires once, after settle, with correct details; no one-frame jump.
- [ ] Auto-scroll reaches both ends of a 40-row list.
- [ ] VoiceOver Move up/Move down actions work and announce position.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
