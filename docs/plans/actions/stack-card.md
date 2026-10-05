# ACT-01-P5 — StackCard (swipeable deck)

Read [README.md](README.md) first. The closest relatives are `card/` and `surface/` (a card's
look), `tabs/` (the pager gesture, the measured layout) and `slider/` (haptic ticks). Read their
`AGENTS.md` files.

## Purpose on mobile

A pile of cards taken one at a time by **throwing the top one off**. It suits a queue where each
item gets one decision and is then gone: a review queue, flashcards, suggestions. The gesture is
the answer. It shows one card, so it is wrong for anything the reader must compare or skim. For
browsing, use a carousel; for one row's actions, use Swipe.

## Anatomy

```tsx
<StackCard className="h-[460px]" onSwipe={(dir, i) => decide(people[i], dir)}>
  <StackCard.Stamp direction="right" color="success">Yes</StackCard.Stamp>
  <StackCard.Stamp direction="left" color="destructive">No</StackCard.Stamp>
  {people.map((p) => <StackCard.Card key={p.id}>…</StackCard.Card>)}
  <StackCard.Empty>…</StackCard.Empty>
  <StackCard.Actions>
    <StackCard.Action action="left" icon={IconCrossSmall} label="Skip" />
    <StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} />
    <StackCard.Action action="right" icon={IconCheckmark2} label="Save" />
  </StackCard.Actions>
</StackCard>
```

The root partitions children by type: `Stamp`s, `Card`s (in order), `Empty`, `Actions`.

## API

```ts
type StackCardDirection = "left" | "right" | "up" | "down";
type StackCardLayout = "stack" | "fan" | "flat";
type StackCardStampColor = "primary" | "success" | "warning" | "info" | "destructive";

type StackCardProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;                   // give it a height
	pileClassName?: string;
	index?: number;                       // controlled top-card index
	defaultIndex?: number;                // default 0
	onIndexChange?: (index: number) => void;
	onSwipe?: (direction: StackCardDirection, index: number) => void; // fires before onIndexChange
	onEmpty?: () => void;                 // once, when the last card leaves
	directions?: readonly StackCardDirection[]; // default ["left","right"]
	layout?: StackCardLayout;             // default "stack"
	depth?: number;                       // cards drawn behind the top, default 2, clamp 0..4
	threshold?: number;                   // fraction of card width/height, default 0.3
	isDisabled?: boolean;
	haptic?: false | HapticFeedback;      // default "selection": tick at point of no return; knock on throw
	directionLabels?: Partial<Record<StackCardDirection, string>>;
	ref?: Ref<StackCardHandle>;
};
type StackCardHandle = { swipe: (direction: StackCardDirection) => void; undo: () => void };
type StackCardStampProps = ViewProps & { direction?: StackCardDirection; color?: StackCardStampColor; children: ReactNode; className?: string; labelClassName?: string };
type StackCardActionProps = { action: StackCardDirection | "undo"; icon: IconComponent; label?: string; onPress?: () => void; className?: string };
```

`useStackCard()` returns `{ index, count, swipe, undo, canUndo }`.

## Visual design

- **Card**: `Surface`/`Card` look (`bg-card border border-border rounded-lg`), absolutely filling
  the pile.
- **Layouts** (behind-cards only): `stack` gives each card behind `translateY = 8*i`,
  `scale = 1 - 0.04*i`. `fan` gives an alternating `rotate = ±3°*i` around the bottom centre.
  `flat` hides them.
- **Stamps** are positioned on the side they answer for (right → top-start corner, rotated −12°,
  the classic "approve" stamp). They are a bordered label in `{color}` and fade in with drag
  progress toward their direction.
- **Actions** are round `Button`s (`size="icon-lg"`, `variant="secondary"`, icon tinted by
  direction colour). `undo` is `ghost`. `StackCard.Actions` lays them out in a centred row under
  the pile. The pile takes the remaining height (`flex-1`).
- **Empty** renders centred in the pile when `index >= count`.

## Behaviour

- **One shared value drives everything**: the top card's `{x, y}`. Stamps read progress toward
  each direction. Cards behind interpolate toward the top position on the furthest progress, so
  when the top card leaves, the second is already in place and advancing moves nothing. React
  work happens only in the callback after a throw.
- Gesture: `Gesture.Pan()`. If `directions` contains only left and right, add `activeOffsetX` and
  `failOffsetY` so a vertical scroll passes through. With all four, take both axes, and document
  "do not nest in a scroller".
- Rotation while dragging: `rotate = x / width * 12°`.
- Release: `dir = resolveStackRelease(...)`. If `dir` is an allowed direction, fly off with
  velocity to 1.5× the card size, then `scheduleOnRN(advance, dir)`. Otherwise spring back.
- **A disallowed direction still follows the finger a little** (0.25 resistance) and returns. A
  card that does not budge reads as frozen.
- `advance`: calls `onSwipe(dir, i)`, then `setIndex(i + 1)` through `useControllableState`. **A
  controlled deck that does not move its `index` declines**: when the prop stays put after
  `onIndexChange`, the thrown card flies back in. Implement this by checking on the next render
  whether `index` advanced; if not, animate the returning card from its exit position.
- `undo`: index − 1, and the previous card flies in from the direction it left (keep a history
  stack of directions). `onSwipe` is not called.
- `onEmpty` fires once when the index reaches `count`.
- **Mounted window**: `[index - 1, index + depth + 1]` only (one behind for undo, one beyond the
  visible depth so the next one fades in). A deck of 500 costs what a deck of 5 does.
- Haptic: tick when the drag first crosses the threshold (re-arms), knock (`"medium"`) on throw.

## Reduced motion

A card leaves by **fading**, not flying. The pile swaps without stepping. Which card is on top is
the information, so that is kept.

## A11y

The top card has `accessible`, the role of an adjustable-free group, and
`accessibilityActions` for every allowed direction, named by `directionLabels[dir] ?? "Swipe left"`,
plus `undo` when possible. Every card but the top is `importantForAccessibility="no-hide-descendants"`.
`StackCard.Action` buttons carry the same labels.

## Pure logic (`stack-card.variants.ts` + test first)

- `partitionStackChildren(children)` → `{ stamps, cards, empty, actions }`.
- `resolveStackRelease({ x, y, vx, vy, width, height, threshold, directions })` →
  `StackCardDirection | null`. Momentum counts (`x + vx*0.15`). The dominant axis wins. A
  disallowed direction gives `null`.
- `resolveStampOpacity({ x, y, width, height, direction })` → 0..1.
- `resolveBehindTransform({ layout, position, progress })` → `{ translateY, scale, rotate, opacity }`
  for position 1..depth+1, interpolated toward position − 1 by progress.
- `resolveMountedWindow({ index, count, depth })` → `[from, to)`.
- `resolveStackDepth(d?)` → default 2, clamp 0..4.
- `stackCardVariants`, a slotted `tv`: `root`, `pile`, `card`, `stamp`, `stampLabel`, `empty`,
  `actions`, with a stamp `color` axis. Add the token test.

## Files

`stack-card/`: `index.ts`, `stack-card.tsx`, `stack-card-card.tsx`, `stack-card-stamp.tsx`,
`stack-card-empty.tsx`, `stack-card-actions.tsx`, `stack-card-action.tsx`,
`stack-card.context.tsx`, `stack-card.types.ts`, `stack-card.variants.ts`,
`stack-card.variants.test.ts`, `AGENTS.md`.

## Playground demos

`review-queue` (hero, capture: stamps and actions), `layouts` (stack/fan/flat switcher with
ToggleButton.Group, capture), `four-directions` (capture), `controlled-decline` (a confirm step
that declines on "No"), `undo` (capture), `empty` (refill button).

## Docs

`stack-card.mdx` under `---Actions---`.

## Acceptance checklist

- [ ] Throwing past the threshold (or flicking) advances. A short drag springs back. A
      disallowed direction gives and returns.
- [ ] The card behind is in place at the moment of release (no jump on advance).
- [ ] No re-render during a drag (verify with React DevTools highlight or a render counter in a
      demo).
- [ ] A controlled deck can decline, and the card returns.
- [ ] Undo restores from the side it left. `onSwipe` is not called for undo.
- [ ] Only the window around the index is mounted (500-card demo stays smooth).
- [ ] Horizontal-only decks scroll inside a vertical ScrollView.
- [ ] Screen-reader actions per direction with custom labels. Non-top cards are hidden.
- [ ] Reduced motion fades.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
