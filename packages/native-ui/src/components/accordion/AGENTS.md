# Accordion

Rows that each disclose a panel. Compound root plus `Accordion.Item`,
`Accordion.Trigger`, `Accordion.Title`, `Accordion.Description`,
`Accordion.Indicator` and `Accordion.Content`. It takes
[ListGroup](../list-group/AGENTS.md)'s axes and its divider insertion outright,
so read that section first — what follows is only where a disclosure differs from
a list of rows.

`import { Accordion } from "@delacour/native-ui/accordion";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/native-ui/accordion` |
| `accordion.tsx` | Root, the selection narrow, the divider insertion, the `Object.assign` |
| `accordion-item.tsx` | `Accordion.Item` — owns `progress`, the measured height and the spring |
| `accordion-trigger.tsx` | `Accordion.Trigger`, and the row it assembles from its children |
| `accordion-title.tsx` | `Accordion.Title` |
| `accordion-description.tsx` | `Accordion.Description` |
| `accordion-indicator.tsx` | `Accordion.Indicator`, the one rotation |
| `accordion-content.tsx` | `Accordion.Content` — the measured clip |
| `accordion.context.tsx` | `AccordionContext` and `AccordionItemContext`, with their hooks |
| `accordion.types.ts` | Prop types shared by two or more parts |
| `accordion.variants.ts` | Pure `tv()` slots + the selection maths, no RN imports |
| `accordion.variants.test.ts` | |

## Design

- **Variants**: `default`, `secondary`, `tertiary`, `transparent`. **Sizes**:
  `sm`, `md`, `lg` — driving the trigger's metrics, the title and description
  type scale, the indicator's glyph step, the panel's padding *and* the divider
  inset. Six numbers on one axis rather than in six places that can drift, and
  the tests pin the inset against the trigger's own padding as a **pair**.
- **The variant paints the root and nothing else.** Only the root has a surface;
  a trigger or a panel that also changed with it would be a second source for one
  colour. A test asserts every variant's root is distinct, because two cells
  collapsing means a caller can set the axis and see nothing change.

## The measured panel

- **A panel's height is measured, never laid out.** `Accordion.Content` clips,
  and its height is an animated style running from zero to whatever its inner
  view's `onLayout` reported. The alternative — unmounting the content and
  letting a `LinearTransition` reflow the tree — makes every sibling on the
  screen a participant in this component's animation, and other implementations
  of this control document exactly that as a requirement. Here the animation is
  contained to the accordion's own node: a real height is changing, so whatever
  sits below follows it smoothly through ordinary layout, without opting into
  anything and without a transition painted on it.
- **The measured layer is out of flow.** `contentInner` is absolutely positioned,
  so its height is purely its content's and can never be fed back the clip's own
  animated one. `left-0 right-0` is the other half: an absolute child is
  content-width without it, and a paragraph would measure as a single unwrapped
  line.
- **One shared value per item drives three properties** — the panel's height, the
  panel's opacity and the indicator's rotation, all off `progress` through one
  `ACCORDION_SPRING`. `Switch`'s rule, and the failure it prevents is visible:
  two springs a few hundred stiffness apart leave the chevron lagging the panel
  on every tap. A test pins that both read the same constant.
- **The spring is critically damped**, which is `Switch`'s reason turned inside
  out. A switch damps its thumb because an overshoot squashes against a capsule
  that clips it; a panel damps its height because an overshoot draws the panel
  *taller* than its content measured, flashing the surface behind it for a frame
  at the end of every expand.
- **The fade runs ahead of the height.** Opacity ramps across
  `ACCORDION_CONTENT_FADE` rather than tracking `progress` linearly, because a
  panel half transparent at the midpoint of every expand reads as content
  struggling to arrive rather than as a panel opening.
- **A panel mounts on first expand and stays mounted.** Nothing renders until an
  item is first opened, so a screen of collapsed panels costs an empty view each;
  once opened, the subtree survives every later collapse with its scroll
  position, its form state and its media intact. `hasExpanded` is adjusted during
  render rather than in an effect, so the panel mounts in the same commit as the
  tap — waiting a frame would put the first measurement, and therefore the start
  of the travel, one frame later still.
- **That is what the three accessibility props on the clip are for.** Mounted
  content is content a screen reader reads and a finger reaches, so a collapsed
  panel sets `accessibilityElementsHidden`, `importantForAccessibility` and
  `pointerEvents`. A component that unmounted its content never has to think
  about this; the trade is worth making, but it is not free.
- **The first expand starts from the panel's own layout, not from the item's
  effect.** A panel that has never mounted has no height to travel against, so
  springing on the state change would run the whole animation at zero and jump
  the moment a measurement arrived. The item's effect skips exactly that one
  case and `accordion-content.tsx`'s `onLayout` starts it instead. Every later
  toggle, in either direction, is the item's.
- **`ACCORDION_UNMEASURED` is negative, and that is load-bearing.** A panel that
  measured `0` is a real answer — content that rendered nothing — and an item
  treating it as "still waiting" would never start its spring, leaving the
  indicator pointing the wrong way. Only a value no layout can produce can mean
  *unmeasured*, so the height style floors it.

## Selection

- **`selectionMode` is a true discriminated union**, so `single` with an array
  `defaultValue` is a compile error. Intersecting the union with a widened
  `defaultValue?: string | string[]` defeats it entirely — every member re-admits
  both shapes, and `onValueChange` ends up typed as a function *returning* a
  union rather than a union of functions, which is what forces a cast in the
  toggle. `AccordionRoot` is nothing but the narrow, and it happens **before
  anything is destructured**; destructure first and the correlation is gone.
- **The state is one internal `string[]` whichever mode is in play.**
  `useControllableState` cannot be called conditionally, and two hooks would be
  two pieces of state for one answer, so the caller's shape is converted at the
  boundary — `toExpandedList` on the way in, a narrow on `selectionMode` on the
  way out. `value={null}` in single mode is a controlled *empty*, not an absence,
  which is why `undefined` is preserved rather than normalised away.
- **`isCollapsible` bounds the set, never a single item.** In `multiple` mode an
  item still closes while another is open and only the last one is refused.
  Reading it as "no item may ever close" makes a multiple accordion **add-only** —
  a control that fills up and never empties — and that is the bug this rule
  exists to name.
- **A refused tap returns its own input, by identity.** `toggleExpandedValue`
  hands back the array it was given when the rules reject the change, so the root
  can skip it: a rejected tap must not re-render and must not report an
  `onValueChange` for a change that did not happen. A real change is always a new
  array, because React bails out of a re-render on an unchanged reference.
- **`toggle` and the change callback are both ref-backed trampolines**, so the
  accordion's context keeps its identity across every expansion and across a
  caller passing a fresh arrow. Without them every item re-renders on every
  toggle, which is what the implementations that hand a fresh object literal to
  their provider actually do.

## The trigger

- **A trigger is a `Pressable`**, so `feedback`, `haptic` and the rest are
  inherited rather than restated. Two defaults differ: `fade`, because a
  full-bleed row that scales reads as the whole card flexing — `ListGroup.Item`'s
  reason — and `haptic="selection"`, because an item is a state toggle and the
  panel landing is the confirmation, which is `Checkbox`'s and `Switch`'s.
  `onPress` is the one prop `Omit`ed rather than forwarded: the press *is* the
  toggle, and a side effect belongs on `onValueChange`. `Checkbox`'s trade.
- **The disabled fade lands on the item, never on the trigger.** The trigger is a
  `Pressable`, whose root `Animated.View` writes `opacity` every frame through a
  `useAnimatedStyle` of its own — a class on that node is overwritten silently,
  the failure `Switch` and `Radio` both record. A test sweeps for it.
- **The trigger assembles its own row.** Titles and descriptions stack in a
  column, anything else — a leading `Icon`, a `Badge` — stays where it was
  written as a row sibling, and the indicator is moved to the end and composed in
  when the children hold none. That is what makes an `Accordion.TriggerContent`
  part unnecessary rather than merely absent. Bare string children are wrapped in
  an `Accordion.Title`, consecutive strings collapsing into one — the same rule,
  and the same reason, as `Button`.
- **The indicator rotates off the item's own `progress`**, so a *custom* glyph
  turns exactly like the default one. Passing children and silently dropping the
  animated style is a real trap in other implementations of this control, and the
  opt-out here is explicit: `isAnimated={false}`, for a plus becoming a minus,
  which reads as broken when it also spins. The rotation lives on the indicator's
  node rather than the trigger's because `Pressable` already owns `transform`
  there.
- **An indicator has to be a direct `Accordion.Indicator` child of the trigger.**
  The trigger finds it by element type, so one wrapped in a component of the
  caller's own is invisible to it and a second, default one is composed in
  beside it — two glyphs on the row, with nothing to explain them.
  `hasThumbChild` carries the same limitation for `Switch`. What closes it here
  is that the indicator takes a **render function**, handed the item's settled
  state: reading `isExpanded` means calling a hook, a hook cannot be called in
  the parent's JSX, and that is the only thing a wrapper was ever for.
  `Slider.Track` takes a function for the same reason.
- **The indicator takes `muted-foreground`, a step quieter than the title.** The
  chevron is chrome saying the row opens; the title is the content. A test pins
  that the two tokens differ.

## Accessibility and structure

- **There is no separate heading element.** Wrapping the trigger in one and
  setting `aria-expanded` there as well as `accessibilityState.expanded` on the
  button inside is state written twice, and a screen reader reads it out twice.
  `Pressable` already supplies the role, `accessible` and the state merge.
- **The root is a plain `View` with no role.** Announcing a container as a
  control puts an actionless element in front of every child — `Checkbox.Group`'s
  rule.
- **Dividers are inserted, not written out**, `ListGroup`'s implementation
  verbatim in shape: `Children.toArray` drops the nulls a conditional item leaves
  behind, and a hand-placed `Separator` suppresses the automatic one on either
  side. Counting indices against the raw children instead — `index < count - 1` —
  miscounts a conditional item and breaks outright on a fragment.
- **Reduce motion is left at Reanimated's default `System` policy**, with
  `Switch`, `Checkbox` and `Radio` and against `Spinner`. The state is carried by
  whether the panel is *there*, so completing instantly is the right degradation.
- **An item is expected to hold an `Accordion.Content`.** One without a panel has
  nothing to measure and therefore nothing to travel against, so its indicator
  stays put — which is the right outcome for a row that discloses nothing, and is
  stated here rather than guarded against.
