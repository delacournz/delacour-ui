# Radio

One option in a set where exactly one can be chosen — alone, or inside a group
that owns the selection. Compound root plus `Radio.Label`, `Radio.Indicator` and
`Radio.Group`.

`import { Radio } from "@registry/ui/radio";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@registry/ui/radio` |
| `radio.tsx` | Root + the `Object.assign` compound surface, and `withIndicator` |
| `radio-group.tsx` | `Radio.Group`, which owns the selection |
| `radio-indicator.tsx` | `Radio.Indicator`, the ring and its animated dot |
| `radio-label.tsx` | `Radio.Label`, the `Text.Label` inside the tap target |
| `radio.context.tsx` | `RadioContext` and `RadioGroupContext`, with their hooks |
| `radio.variants.ts` | Pure `tv()` slots + three resolvers, no RN imports |
| `radio.variants.test.ts` | |

There is no `radio.types.ts`, unlike most compound folders here.
`{name}.types.ts` holds only prop types shared by two or more modules and a type
with exactly one consumer stays in that consumer's file — `RadioProps`,
`RadioGroupProps`, `RadioIndicatorProps` and `RadioLabelProps` each have exactly
one, so each lives beside the component it types. The state types the ladder
needs — `RadioGroupState`, `RadioOwnState`, `RadioFieldState`, `RadioState` —
sit in `radio.variants.ts` beside the pure resolver that reads them. See
[Compound component layout](../../../AGENTS.md#compound-component-layout).

## Design

- **Variants**: `primary`, `secondary` — `secondary` fills the ring, `primary`
  leaves it hollow. **Sizes**: `sm`, `md`, `lg`. **Orientations**, on the group
  only: `vertical` stacks the radios, `horizontal` lays them out in a wrapping
  row.
- **The whole row is the control.** The ring, the label beside it and the space
  between them are one tap target, so a press anywhere on the row selects. A
  `Radio.Indicator` is composed in automatically and plain string children are
  wrapped in a `Radio.Label`, so the shortest thing that works is
  `<Radio value="pro">Pro</Radio>`.
- **A radio works with or without a group.** Inside a `Radio.Group` its `value`
  identifies it and the group owns the selection, the size and the variant.
  Outside one it is driven by its own `isSelected` and `onSelected`.
- **`onSelected` is only ever called with `true`.** A radio does not deselect
  itself, which is [Switch](../switch/AGENTS.md) and
  [Checkbox](../checkbox/AGENTS.md) semantics rather than radio ones. The
  group's own `onSelected` takes the newly selected value and is never called
  for a re-press of the current one: re-picking the option already selected is
  not a change and a radio group has no deselect gesture, so without
  `shouldEmitSelection` a tap on the current selection would re-notify the caller
  with a value it already holds. HTML's own radio does not fire `change` there
  either. The decision is pure, so `bun test` reaches it.
- **The axis ladder is `group ?? own ?? field ?? default`, and it deliberately
  puts the group *first*** — the inverse of `Checkbox`'s
  `own ?? group ?? field ?? default`. A radio group puts itself first because
  escaping a disabled form group is a bug. `size` and `variant` the group owns
  outright and publishes resolved, so a grouped radio's own copies are ignored: a
  group whose options were different sizes is not a design. The two *state* axes
  are published raw, which is the one place this differs from `Input.Group`, and
  deliberately: a group holds many radios, so disabling one option out of five
  has to be possible. A group that names the axis still wins outright, so
  `isDisabled={false}` opts a radio out of a disabled `Field` and not out of a
  disabled group. `resolveRadioState` is pure, so the whole matrix is reachable
  from `bun test` — [Input](../input/AGENTS.md) runs this same ladder inline in
  its own render, where no unit test can see it.
- **`Radio` takes no `asChild`.** `Pressable`'s root `Animated.View` already owns
  `opacity` and `transform` through a `useAnimatedStyle` of its own, and two
  animated styles on one node fight for the same props — the same rule that keeps
  the dot's animated style off the ring, and that
  [Slider](../slider/AGENTS.md)'s root and thumb are built around. `asChild`,
  `busy`, `children` and `disabled` are the four props `Omit`ed from the
  `Pressable` surface the root otherwise passes through; `isDisabled` is the
  public spelling of the last, because the settled value is what reaches
  `Pressable`.
- **The animated style lives on the dot, never on the ring.** The dot is a
  descendant two levels down from that `Animated.View`, so the two never contend.
  A test asserts the `dot` slot claims neither `opacity-*` nor `scale-*` in any
  cell: a class fighting a `useAnimatedStyle` for the same property is a dot that
  never appears, with no error anywhere.
- **The disabled fade lands on the ring and the label, never on the root.** The
  `root` slot is worn by `Pressable`'s own `Animated.View`, whose
  `useAnimatedStyle` writes `opacity` on every frame — at rest, 1. An
  `opacity-50` class on that node is overwritten before it is ever drawn,
  silently, so the row would stay at full contrast while behaving as disabled.
  The ring and the label are ordinary descendants, so their opacity multiplies
  with the root's instead of fighting it. The group must not fade either, or a
  disabled group would compound `opacity-50` with each of its rows and land at a
  quarter opacity. Tests pin both halves. This is the failure `Switch`, `Tabs`
  and `Accordion` all cite back here.
- **The ring is drawn from `View`s rather than a Central Icon.** Rule 5 governs
  icons and [Spinner](../spinner/AGENTS.md)'s arc is the precedent for
  primitives; here the set has no ring-with-a-centred-dot glyph at all. Two
  things follow from drawing it: the dot can scale from the ring's centre
  entirely on the UI thread, and the ring's four themed colours stay classes in
  `radio.variants.ts` where `bun test` reaches them. An `Icon` would take its
  colour as a resolved value, splitting one decision across two mechanisms.
- **The dot springs on `RADIO_DOT_SPRING`, deliberately near `Pressable`'s
  `PRESS_SPRING` but a touch looser**, so it settles just after the row it sits
  in has rebounded. It is read on the JS thread inside an effect rather than
  captured by a worklet, so it stays a plain object. `progress` is seeded from the
  current state rather than from zero, so a group that mounts with a selection
  does not animate every dot in on its first paint. Both branches animate: the
  outgoing dot shrinks rather than vanishing, which is what makes a group read as
  one selection moving between rows — and the `dot` slot's fill is unconditional
  rather than gated on `isSelected`, or the dot would vanish on the frame the
  state flips instead of shrinking. A test asserts the spring actually springs:
  non-zero mass and stiffness, and damping below critical.
- **Reduce motion is left at Reanimated's default `System`, deliberately the
  opposite call to `Spinner`'s `ReduceMotion.Never`** — and with `Checkbox`,
  `Switch` and `Accordion`. The spinner needs `Never` because a zero-length
  animation inside `withRepeat(-1)` would spin forever. Here the state is carried
  by the dot's *presence*, not by its motion, so `System` snapping straight to the
  target is exactly the right degradation.
- **`Radio.Indicator` takes children, and a render function is one of them.** A
  function is handed the settled `isSelected`, `isInvalid`, `size` and `variant`;
  either form replaces the dot outright — the animated `Animated.View` is not
  rendered at all — while the ring, its size and its colours stay the radio's.
  `dotProps` is the other door: props for the dot's own `Animated.View`, for a
  caller restyling it in place rather than replacing it, with the animated style
  applied before the caller's own so `style` composes rather than clobbers.
- **Where the indicator sits decides the row's layout, and the root works it
  out.** `none` means the caller wrote no indicator, so one is composed in at the
  front. `end` means one placed last with something before it — a settings row,
  `[label and description] [ring]` — and the row spreads to push the ring to the
  far edge. A lone indicator with nothing beside it is `start`: there is nothing
  to spread it away from. That is what makes the trailing ring work without a
  `flex-1` spacer wedged between the two, which is the shape a caller would
  otherwise have to reach for. `isIndicatorTrailing` is a variant rather than a
  caller's `justify-between` because the root already knows where the indicator
  landed, and a test asserts a trailing row differs from a leading one by exactly
  that one class. `resolveIndicatorPlacement` takes an array of "is this child an
  indicator" rather than the children themselves, so it stays free of React and
  reachable from `bun test` — the trade `resolveSpinnerSwapIndex` already makes.
- **Bare text is wrapped in a `Radio.Label`, consecutive strings collapsing into
  one.** React Native cannot render a string outside a `<Text>`, so
  `<Radio>Yes</Radio>` would otherwise crash. They collapse rather than wrapping
  one each because `Plan {n}` is a single piece of text, and wrapping the parts
  separately would space them apart by the row's own gap — the same rule, and the
  same reason, as [Button](../button/AGENTS.md). `withIndicator` lives in
  `radio.tsx` rather than with the parts: it is the root that wraps its own
  children, and importing it from a part would close a cycle. Rule 3.
- **The indicator is detected by reference, and that is a known wart.**
  `withIndicator` asks `child.type === RadioIndicator`, where `Switch` asks its
  child's `displayName` through `isSwitchThumbElement` and keeps reference
  equality only as a fast path. Reference is not a safe question here: this
  package ships raw `.tsx` for the consuming app to compile, so React Compiler
  rewrites the binding on the way through, and Metro can serve two instances of
  one module through a workspace symlink — either leaves an element whose `type`
  is a different object standing for the same component. Detection then returns
  false and a second ring is composed in at the front of the row. Nobody has
  reported it because the duplicate overlaps invisibly rather than hiding
  content — a second ring exactly behind the first — where the same bug in
  `Switch` swallowed anything inside the caller's knob. `displayName` survives
  all of it, rule 12 requires one, and `display-name.test.ts` already enforces
  that they are present and unique. Worth fixing the next time this file is
  touched.
- **`Radio.Label` *is* `Text.Label`.** It renders the preset and names a size
  step from `RADIO_LABEL_TEXT_SIZE`, never a scale, a weight or a colour of its
  own — restating them would be a second definition of `Text.Label` that could
  drift from it, the rule [Field](../field/AGENTS.md) is built on. Naming the
  size is what lets the label still track the radio's own axis, since
  [Text](../text/AGENTS.md)'s size axis is built to beat its preset. The `label`
  slot carries layout and nothing else, and a test asserts it holds no `text-*`
  or `font-*` in any cell, plus that every step it names is a size `Text`
  actually has.
- **The label does not redden while invalid.** The ring already carries that, and
  a `Field.Error` under the group says what is actually wrong; five labels turning
  red would read as five wrong answers. Disabled needs nothing from the part
  either — the `isDisabled` variant fades the ring and the label together, as one
  control.
- **The label is `shrink`, never `flex-1`.** `flex-1` sets `flex-basis: 0%`, and
  in a content-sized `horizontal` row Yoga resolves that to zero and collapses
  the text to nothing. `shrink` lets a long label wrap without claiming a basis.
- **The root takes no `self-start` and no `w-full`, and both absences are
  load-bearing.** A radio row *is* its own tap target, so unlike a `Badge` it
  wants the stretch it gets inside the group's `flex-col` — `self-start` would
  shrink the target to the width of the word "Yes". But unlike a `ListGroup.Item`
  it cannot take `w-full` either, because a `horizontal` group would then give
  every radio the full width of the group and blow the row apart. Vertical
  stretch already supplies the width; horizontal wants content width.
- **The row's height is a floor, never fixed.** `Text` respects OS font scaling,
  so `h-*` would clip a label at a large accessibility step; `min-h-*` exists for
  the hit target, which scaling may exceed but must never undercut.
- **The ring indexes the shared `--spacing-icon-*` scale rather than minting one
  of its own.** A radio's ring is a small round mark in a row beside a label, the
  same kind of thing as a row's chevron, and it should stay level with an `Icon`
  at the same step by construction. The dot takes plain spacing steps — numbers
  read in one component — and its fit inside the ring is pinned by a test rather
  than by a token, the way `Field` pins its gap ladder: the test reads
  `tokens.css` and asserts the dot clears the ring's inner diameter, border
  included, at every size. See [Sizing](../../../AGENTS.md#sizing).
- **`border-2` sits in the base rather than on a variant.** A border declared
  only where it is coloured would make the ring four points smaller the moment a
  caller switched variant. A test asserts every cell reserves it and every cell
  names a border colour.
- **All four `variant × isSelected` cells live in `compoundVariants`**, because
  neither axis paints the ring alone — the reason a badge's twenty-four do.
  Invalid outranks selected on both the ring and the dot, and it is a compound
  rather than a plain variant purely for emission order: `tv` emits the variants
  first and the compounds after, so a plain `isInvalid` branch would lose to the
  four cells above. `Input` leans on the same mechanism for focused-and-invalid.
- **The group renders no legend, description or error.** `Field` already owns all
  three, and a second definition of a label is a type scale that can drift — the
  trade `Input` made. That does leave the group without an accessible name, since
  React Native has no `aria-labelledby` to tie it to the `Field.Label` above it,
  so pass `accessibilityLabel`. The group is a `View` carrying
  `accessibilityRole="radiogroup"`, where `Checkbox.Group` carries no role at
  all.
- **`selected` takes `value ?? null`.** `null` means "controlled, nothing
  selected". Omitting the prop entirely is what makes the group uncontrolled, so a
  `useState<string>()` seeded with `undefined` would silently hand the group its
  own state and then switch it to controlled on the first press. This is the
  first exercise `useControllableState` has had in the package, and the change
  handler is memoised: without that, the setter rebuilds every render, which
  rebuilds the context value, which re-renders every radio in the group on every
  render of whatever holds it.
- **`isInvalid` and `isDisabled` are not defaulted in the group's destructure.**
  A `false` there would swallow the `Field` before it was ever consulted. See
  `input-group.tsx`.
- **A grouped radio with no `value` warns in development rather than throwing.**
  It can never be selected, and group membership is invisible in the child's
  props at compile time, so it cannot be a type error either. The warning lives
  in `radio.tsx`, where the component name is available to name in the message.
- **A radio whose row holds no text needs an `accessibilityLabel`**, the same
  rule an icon-only `Button` follows.
- **There is no `Radio.Description`.** A `Text.Caption` composed inside the row
  stays within the one tap target and inside the accessible name, which is what a
  description part would have to do anyway. The root publishes the label's
  treatment through `TextClassProvider` because one treatment covers the whole
  subtree — a radio row has a label and no description part — which is the
  condition for publishing into the cascade.
- **Two `Pressable` defaults differ and only two**: `feedback="fade"` and
  `hitSlop={8}`, both ordinary props a caller can override. `haptic` is left at
  `Pressable`'s own `false`, unlike `Checkbox`'s `haptic="selection"`.
- **The parts read only the settled state.** `RadioProvider` publishes it, so
  `Radio.Indicator` never has to know whether it is inside a group, never reads a
  `Field`, and never imports the root. `useRadioGroupContext` is nullable because
  a radio has to work perfectly well on its own, the same way `useFieldContext`
  is for every control that can stand outside a `Field`; `useRadio` and
  `useRadioGroup` throw, and `useRadioPart` is internal and deliberately not
  re-exported from `index.ts` — a caller outside the library wants `useRadio`,
  whose error message names the hook rather than a part.
