# ACT-01-P4 — Swipe (swipeable row)

Read [README.md](README.md) first. The closest relatives are `item/` and `list-group/` (what goes
inside a row), `slider/` (pan, haptics) and `tabs/` (gesture versus scroll arbitration). Read
their `AGENTS.md` files.

## Purpose on mobile

A row that slides aside to reveal actions behind it: delete, archive, snooze, mark done. The
actions sit **behind** the row rather than beside it, so nothing reflows when one opens. Only the
row moves, on the UI thread. It acts on one row. For many rows at once, use SelectionMode.

## Anatomy

```tsx
<Swipe.Group>                       {/* optional: one row open at a time */}
  <Swipe haptic="selection">
    <Swipe.Start>
      <Swipe.Action icon={IconCheckmark2} label="Done" color="success" onPress={complete} />
    </Swipe.Start>
    <Swipe.End>
      <Swipe.Action icon={IconBell} label="Snooze" color="warning" onPress={snooze} />
      <Swipe.Action icon={IconTrashCan} label="Delete" color="destructive" onPress={remove} />
    </Swipe.End>
    <Item>…</Item>                  {/* the row: anything that is not a panel */}
  </Swipe>
</Swipe.Group>
```

`Swipe.Start` and `Swipe.End` are **markers**. The root lifts their children out by element type
and lays the tiles out itself, because only the root knows the current gap width. Everything else
in `children` is the row. Order does not matter.

## API

```ts
type SwipeSide = "start" | "end";
type SwipeOpenSide = SwipeSide | null;
type SwipeActionColor = "default" | "primary" | "success" | "warning" | "info" | "destructive";

type SwipeProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;
	contentClassName?: string;           // the moving row
	isFullSwipe?: boolean;               // default true — a drag far past the panel fires the outermost action
	isDisabled?: boolean;                // gesture off; tiles (if somehow open) remain tappable
	haptic?: false | HapticFeedback;     // tick when crossing the full-swipe point
	onOpenChange?: (side: SwipeOpenSide) => void;
	ref?: Ref<SwipeHandle>;
};
type SwipeHandle = { open: (side: SwipeSide) => void; close: () => void };

type SwipePanelProps = { children: ReactNode };          // Swipe.Start / Swipe.End
type SwipeActionProps = {
	label: string;                      // required — tile caption AND accessibility action name
	icon?: IconComponent;                 // component type, rendered via <Icon icon={…}/> sized/tinted by the tile
	color?: SwipeActionColor;           // default "default"
	onPress: () => void;
	isKeptOpen?: boolean;               // default false — row closes after the action runs
	className?: string;
	labelClassName?: string;
};
type SwipeGroupProps = ViewProps & { className?: string; isExclusive?: boolean /* default true */ };
```

`useSwipeGroup()` returns `{ closeAll(): void }`. Outside a group it returns a no-op rather than
throwing.

Icon prop note: the house rule is that icons are composed. Here a tile has to size and tint its
glyph, so the tile takes the **icon component** (the same type `Icon`'s `icon` prop takes) and
renders `<Icon icon={icon} />` inside an `IconDefaultsProvider`. Record this in AGENTS.md as the
reason the rule bends.

## Visual design

- **Tiles**: equal width (72pt), full row height, icon (`size-icon-md`) above a `text-xs` label,
  both in `{color}-foreground`, on `bg-{color}`. `default` → `bg-muted` + `text-foreground`.
- **The panel is exactly as wide as the gap the row has left behind**: never wider, so it cannot
  paint over the row, and never narrower. Past the tiles' total width, the **outermost** tile
  (the last on `end`, the first on `start`) grows to fill the overshoot, and the panel background
  takes its colour, so an overshoot extends that action rather than opening a hole.
- Tiles emerge from under the row. Each tile's x is interpolated so they pack against the row
  edge and are whole by the time the row clears them.
- The row needs no background of its own, and the two never overlap.

## Behaviour

- Gesture: `Gesture.Pan().activeOffsetX([-10, 10]).failOffsetY([-8, 8])`. It waits for clearly
  horizontal intent and fails once the finger commits vertically, so a list scrolls normally.
- A side with no panel does not open: rubber-band with 0.2 resistance, then return.
- Release snaps to `open(side)` (offset = total tile width) or closed, by projected position
  (`offset + velocity*0.1` vs half the panel width).
- **Full swipe** (`isFullSwipe`): when `|offset| > panelWidth + 0.35 * rowWidth` (or a projected
  equivalent), release fires the outermost action and animates the row off before closing it. The
  haptic ticks once when crossing that point (re-arms if it goes back).
- Tapping a tile runs `onPress`, then closes the row unless `isKeptOpen`.
- Tapping the open row (not a tile) closes it and swallows the tap.
- `Swipe.Group` (`isExclusive` default true): rows **register** through context on mount
  (`register(id, close)`), not by inspecting children, so a row nested in `Item.Group`, a `.map`
  or a custom component still belongs. When one opens, the group closes the others.
- RTL: `I18nManager.isRTL` mirrors the sides. `end` is always the edge text runs toward.

## Reduced motion

Springs become 160ms timings. The full-swipe fly-off becomes a fade.

## A11y

The row publishes **every action as an accessibility action**
(`accessibilityActions=[{ name: label, label }]` plus an `onAccessibilityAction` dispatch). A
swipe is invisible to a screen reader. Tiles are `accessibilityRole="button"` and are hidden from
the a11y tree while closed (`importantForAccessibility="no-hide-descendants"` /
`accessibilityElementsHidden`).

## Pure logic (`swipe.variants.ts` + test first)

- `partitionSwipeChildren(children)` → `{ start: ReactElement[], end: ReactElement[], row: ReactNode[] }`
  by element type. Test it with plain objects; it needs no RN.
- `resolveSwipeRelease({ offset, velocity, startWidth, endWidth, rowWidth, isFullSwipe })` →
  `{ kind: "close" } | { kind: "open"; side } | { kind: "full"; side }`, a discriminated union.
- `resolveOutermostIndex(side, count)` → end: `count-1`, start: `0`.
- `resolveTileLayout({ side, index, count, tileWidth, offset })` → x and width for the
  emerge/overshoot behaviour (pure numbers; the worklet restates it).
- `swipeVariants`, a slotted `tv`: `root`, `row`, `panel`, `tile`, `tileLabel`, with a `color`
  axis. Add the token-existence test.

## Files

`swipe/`: `index.ts`, `swipe.tsx`, `swipe-start.tsx`, `swipe-end.tsx`, `swipe-action.tsx`,
`swipe-group.tsx`, `swipe.context.tsx`, `swipe.types.ts`, `swipe.variants.ts`,
`swipe.variants.test.ts`, `AGENTS.md`.

## Playground demos

`swipe-to-delete` (hero, capture, with rows removed from state), `both-sides` (capture),
`one-open-at-a-time` (Swipe.Group in a ListGroup, capture), `no-full-swipe`, `kept-open`
(toggle bookmark, capture), `imperative` (buttons calling `ref.open("end")` / `close()`).

## Docs

`swipe.mdx` under `---Actions---`, with a "Sharing the screen with a scroller" note and an a11y
note.

## Acceptance checklist

- [ ] Rows open and close smoothly on the UI thread, with no re-render during a drag.
- [ ] The panel never paints over the row. An overshoot extends the outermost tile's colour.
- [ ] A full swipe fires the outermost action and can be disabled.
- [ ] Vertical scrolling of a list of Swipe rows is unaffected.
- [ ] Swipe.Group keeps one row open. `useSwipeGroup().closeAll()` works and is inert outside a
      group.
- [ ] Every action is reachable as a screen-reader action, and tiles are hidden while closed.
- [ ] RTL mirrors.
- [ ] Ref `open` and `close` work. `onOpenChange` reports a side or null.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
