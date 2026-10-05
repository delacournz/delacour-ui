# StackCard

A pile of cards taken one at a time by **throwing the top one off**. Compound
root plus `Card`, `Stamp`, `Empty`, `Actions` and `Action`. For a queue where
each item gets one decision and is then gone — a review queue, flashcards,
suggestions. It shows one card, so it is wrong for anything the reader must
compare or skim: browsing wants a carousel, and one row's actions want a swipe
row.

`import { StackCard } from "@delacour/react-native-ui/stack-card";`

```tsx
<StackCard className="h-[460px]" onSwipe={(dir, i) => decide(people[i], dir)}>
  <StackCard.Stamp direction="right" color="success">Yes</StackCard.Stamp>
  <StackCard.Stamp direction="left" color="destructive">No</StackCard.Stamp>
  {people.map((p) => <StackCard.Card key={p.id}>…</StackCard.Card>)}
  <StackCard.Empty>All caught up</StackCard.Empty>
  <StackCard.Actions>
    <StackCard.Action action="left" icon={IconCrossSmall} label="Skip" />
    <StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} />
    <StackCard.Action action="right" icon={IconCheckmark2} label="Save" />
  </StackCard.Actions>
</StackCard>
```

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/stack-card` |
| `stack-card.tsx` | Root: partitions children, owns the pan, the throw, undo, decline, the mounted window |
| `stack-card-slot.tsx` | Internal animated box one card sits in — reads the shared offset, places itself |
| `stack-card-card.tsx` | `StackCard.Card` — the card's look, and the top card's accessibility actions |
| `stack-card-stamp.tsx` | `StackCard.Stamp` — fades in with progress toward its direction |
| `stack-card-empty.tsx` | `StackCard.Empty` |
| `stack-card-actions.tsx` | `StackCard.Actions` — the centred row under the pile |
| `stack-card-action.tsx` | `StackCard.Action` — a round `Button` that throws or undoes |
| `stack-card.context.tsx` | `StackCardProvider`, `useStackCard()`, `useStackCardContext()`, `useStackCardPart()`, the slot context |
| `stack-card.types.ts` | `StackCardHandle`, `StackCardState` — shared by the root and the context |
| `stack-card.variants.ts` | The slotted `tv()` and every pure resolver, the gesture's worklets included — no RN imports |
| `stack-card.variants.test.ts` | |

## Axes

- **`directions`**: any of `left`, `right`, `up`, `down`. Default left and right.
- **`layout`** (the cards behind only): `stack` steps each down 8 and smaller by
  4%; `fan` rotates them ±3° per step, alternating, about the bottom centre;
  `flat` hides them.
- **`depth`**: cards drawn behind the top, 0..4, default 2.
- **`threshold`**: the fraction of the card's width (or height) a drag must
  cover, default 0.3.
- **Stamp `color`**: `primary`, `success`, `warning`, `info`, `destructive` —
  each a token declared in both themes, which the test checks.

## Design

- **One shared value drives everything: the top card's `{x, y}`.** The top card
  follows it and tilts `x / width · 12°`, the stamps read progress toward their
  direction from it, and the cards behind interpolate toward the slot ahead of
  them on the furthest progress (`resolveDragProgress`). A drag writes shared
  values and nothing else, so **nothing re-renders during a drag** — React only
  hears about a throw after it lands.
- **The card behind is in place at the moment of release.** Progress reaches 1
  at the threshold, and `resolveBehindTransform` at progress 1 is exactly the
  transform of the slot ahead — a test asserts it for every layout. So when the
  top card is thrown, the next card is already where the top was, and advancing
  moves nothing. Without it the pile would jump a step on every throw.
- **The top moves on the UI thread, ahead of React.** `top` is a shared value the
  throw sets the frame it lands; every slot places itself from `cardIndex − top`.
  Waiting for React to re-render the new index would leave a frame where the
  thrown card is gone and the next one has not been promoted.
- **Each worklet is self-contained**, and the resolvers it calls each carry
  `"worklet"` and call no other module helper (see
  [Pressable](../pressable/AGENTS.md) for the crash a module-scope helper
  causes). `resolveBehindTransform`'s inner `at` is declared inside its body for
  that reason.
- **Release:** `resolveStackRelease` projects the position 0.15 s along the
  release velocity, so a flick throws from a short drag and a flick back cancels
  a long one. Each axis is measured as a fraction of the card's own size along
  it, and the dominant axis alone decides. A direction the deck does not allow
  gives `null` and the card springs back.
- **A disallowed direction still gives a quarter** (`resolveDragOffset`) and
  returns. A card that does not budge at all reads as frozen, where one that
  gives and returns reads as "not that way".
- **A horizontal-only deck lets vertical drags through** — `activeOffsetX` and
  `failOffsetY`, so it sits inside a vertical `ScrollView`. Vertical-only is the
  mirror. A deck that throws all four ways claims both axes with `minDistance`
  and **must not be nested in a scroller** — the doc comment says so. This is
  the opposite of `Slider`'s `minDistance(0)`: a slider must win every touch on
  its track, a deck must give up the ones that are scrolls.
- **A controlled deck that does not move `index` declines.** A throw calls
  `onSwipe`, then `onIndexChange`, and records the throw as pending. The effect
  after the next render compares: an index that moved is accepted and pushed to
  the undo history; an index that stayed put flies the card back in from the
  side it left. The pending record is state, not a ref, so the deck re-renders
  and checks even when the parent's `onIndexChange` changes nothing. A confirm
  step is built on this: decline, ask, and on "yes" call `ref.swipe(dir)` again
  and accept it — the `controlled-decline` demo.
- **Undo restores from the side it left.** The deck keeps a history of the
  directions it threw; `undo` pops one, steps the index back and flies the card
  in from that side. `onSwipe` is not called for an undo. An index changed from
  outside (a refill) clears the history, since the cards it remembers may not be
  the ones now in the deck.
- **A card returns on a critically damped spring.** An underdamped return
  overshoots rest to the other side, and the stamp for the opposite direction
  fades in there — a card undone from the left would land flashing the
  right-hand answer. The damping sits just above `2·√(stiffness·mass)`, so the
  card arrives without crossing.
- **Only a window is mounted:** `[index − 1, index + depth + 1]` —
  one behind for undo, one beyond the visible depth so the next card fades in
  rather than popping. A deck of 500 mounts what a deck of five does
  (`resolveMountedWindow`). The one beyond starts at opacity 0 and reaches the
  last visible slot's opacity at progress 1.
- **Slots render deepest first**, so the top card draws over the ones behind and
  the card just thrown — kept mounted for undo, hidden — draws over everything
  when it flies back in.
- **Every transform pivots on the bottom centre.** That is what makes `fan` fan,
  and what makes a smaller `stack` card's lower edge peek out below the one in
  front. The pile keeps `depth · 8` points clear under the cards in `stack` so
  that edge is not clipped by whatever sits below.
- **Anything that is not a `Stamp`, `Empty` or `Actions` is a card.** A caller
  who wraps `StackCard.Card` in a component of their own still gets a card,
  rather than a child silently dropped for having the wrong type
  (`partitionStackChildren` takes the predicate as an argument to stay free of
  the parts and of React Native).
- **Stamps are declared once on the deck and drawn on the top card**, on the side
  they answer for — a right-hand stamp sits top-start, tilted −12°, where a card
  leaning right lifts it into view. A stamp stays dark while the other axis
  dominates, so a diagonal drag in a four-way deck shows one answer, not two.
  Their text colour is on `stampLabel`, never on the stamp (rule 1).
- **An action's glyph takes the colour of its direction's stamp**, so the button
  and the stamp read as one answer. `undo` is a `ghost` button; the directions
  are `secondary`; all are `icon-lg` circles. A direction button works whether or
  not the gesture allows that direction — a button is an explicit answer.
- **Haptics default to `selection`**, which is a deliberate departure from the
  package's off-by-default: the tick when a drag crosses the threshold is the
  feedback that says "let go now", and a deck without it feels uncertain. It
  re-arms when the drag crosses back. A throw knocks with `medium`. `haptic={false}`
  silences both.

## Reduced motion

- **A card leaves by fading, not flying**, and an undone or declined card fades
  back in at rest. Which card is on top is the information, so the swap itself
  is kept.
- **The pile swaps without stepping:** under reduced motion the cards behind do
  not interpolate during a drag; they take their new places when the throw lands.
- A short drag released returns at once rather than springing.

## Accessibility

- **The top card is one `accessible` element** with a custom action per allowed
  direction — named by `directionLabels[dir]`, or "Swipe left" and so on — plus
  "Undo" while there is a card to bring back. No role is set: it is not
  `adjustable`, since the actions are not a value going up and down.
- **Every card but the top is hidden** — `importantForAccessibility="no-hide-descendants"`
  on Android, `accessibilityElementsHidden` on iOS — and takes no touches.
- Because the top card is one element, a control inside it is not separately
  reachable. The deck's controls belong in `StackCard.Actions`, whose buttons
  carry the same labels.
- Stamps are hidden from assistive technology; the actions say the same thing in
  words.

## Out of scope

- A carousel or any browsing mode: one card shows, by design.
- RTL mirroring of stamp placement — the stamps sit by physical side, because the
  direction they answer for is physical too.
- A render callback per card, or virtualising beyond the mounted window.
