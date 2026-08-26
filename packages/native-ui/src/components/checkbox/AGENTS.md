# Checkbox

A box that is ticked or not — alone, or as one of a group sharing a value list.
Root plus `Checkbox.Label` and `Checkbox.Group`.

`import { Checkbox } from "@delacour/native-ui/checkbox";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/native-ui/checkbox` |
| `checkbox.tsx` | Root + the `Object.assign` compound surface |
| `checkbox-label.tsx` | `Checkbox.Label`, the `Text.Label` inside the tap target |
| `checkbox-group.tsx` | `Checkbox.Group`, which owns the checked list |
| `checkbox-box.tsx` | The square, its animated border, fill and tick — internal |
| `checkbox.context.tsx` | `CheckboxContext` and `CheckboxGroupContext`, with their hooks |
| `checkbox.types.ts` | Prop types shared by two or more parts |
| `checkbox.variants.ts` | Pure `tv()` slots + six resolvers, no RN imports |
| `checkbox.variants.test.ts` | |

## Design

- **Colours**: `default`, `primary`, `success`, `warning`, `danger`, `info` —
  [Badge](../badge/AGENTS.md)'s set, reusing tokens the theme already has. **Sizes**: `sm`, `md`, `lg`.
  **Alignment**: `start`, `end`. There is no `variant` axis: a checkbox has one
  shape, and a second way to paint it would be a second thing to keep in step
  with the [radio](../radio/AGENTS.md) that will sit beside it.
- **The root draws the box itself**, which is what makes `<Checkbox />` a
  complete control with no children. Anything composed inside lands *beside* the
  box and shares its tap target — which is the entire reason `Checkbox.Label`
  exists next to [`Field.Label`](../field/AGENTS.md). `Field.Label` names a control from a row away;
  this one is inside the pressable, so tapping the words toggles the box. Use the
  field's in a horizontal `Field` and this one everywhere else.
- **`Checkbox.Label` *is* [`Text.Label`](../text/AGENTS.md).** It renders the preset and passes a
  step and a colour, never a class for either — `resolveCheckboxLabelSize` maps
  the checkbox's own step names onto `TEXT_SIZES`', and
  `resolveCheckboxLabelColor` returns `undefined` to mean "leave the preset's own
  alone". The `label` slot carries layout and nothing else, and a test asserts it
  holds no `text-*` or `font-*` at any size. Same rule as [`Field`](../field/AGENTS.md), same reason
  [`Input`](../input/AGENTS.md) ships no label part at all.
- **`color` paints the indicator, not the box.** The indicator is an
  absolute-fill layer that is invisible until the box is ticked, so an unticked
  box is `border-input bg-card` at every colour — the same chrome a field wears,
  because it is the same kind of thing. Only the border has to know both states,
  which is why the six `color × isFilled` cells are the whole of
  `compoundVariants` instead of a thirty-six cell matrix. The border always
  matches its own fill, and a test pins the pair rather than trusting two maps.
- **`isFilled`, not `isChecked`, is the tv axis.** Checked and indeterminate both
  paint the surface and only the glyph tells them apart, so the axis is named for
  what it does and `resolveCheckboxFilled` is the translation. Indeterminate also
  reports `checked="mixed"`, so a "select all" row says what it means rather than
  claiming a half-truth.
- **Invalid outranks the colour**, on the border and the fill, ticked or not.
  A checkbox that stayed green while its value was rejected would drop the only
  signal it has, exactly while the value is being corrected — the precedence
  [`Input`](../input/AGENTS.md) sets between invalid and focus.
- **The axis ladder is `own ?? group ?? field ?? default`, and it is deliberately
  not [`Input`](../input/AGENTS.md)'s.** `Input.Group` puts itself *first* because it owns the one box
  a grouped field renders into: two answers to one question is not a state worth
  expressing. `Checkbox.Group` owns no box. It is a state controller that also
  carries shared defaults, which makes it the same kind of thing as [`Field`](../field/AGENTS.md) — a
  wrapper a control overrides — so "make the group `lg`" and "make this one
  danger" are different questions and both get an answer. `??` throughout and
  never `||`, so `isDisabled={false}` opts a child out of a disabled group.
- **`Checkbox.Group`'s state is one array of the children's `value`s.**
  `toggleCheckedValue` is the whole transition and it is pure, so `bun test`
  reaches it — including that it always returns a *new* array, since React bails
  out of a re-render on an unchanged reference and a mutation would flip the
  state while leaving the screen alone. A grouped checkbox with no `value`
  throws by name: group membership is invisible in the child's props at compile
  time, so it cannot be a type error.
- **The group is a plain `View` with no role.** A group of checkboxes is a
  container, and announcing it as a control would put an actionless element in
  front of every child. Lay them out any other way with a `className` —
  `flex-row flex-wrap` for a row.
- **Inside a `Field` the box hands its toggle back up**, so the row is the
  target and a form checkbox can be a bare `<Checkbox />` with the field naming
  it, rather than a `Checkbox.Label` repeating the name. It registers a
  ref-backed trampoline rather than the toggle itself: the toggle is a new
  function whenever `checked` changes, and re-registering on every tick would
  re-render the field for nothing. See [Field](../field/AGENTS.md).
- **The whole [`Pressable`](../pressable/AGENTS.md) surface passes through**, because the root *is* one.
  Two defaults differ from a bare `Pressable` and only two: `feedback="fade"`,
  since a spring on a 20pt square reads as a jitter rather than a press, and
  `haptic="selection"`, since a checkbox is a state toggle and the tick landing
  is the confirmation — [`Button`](../button/AGENTS.md) and [`Badge`](../badge/AGENTS.md) leave it off because their press is
  an action, not a state change. Both are ordinary props, so `haptic={false}`
  silences it. `onPress` is the one prop `Omit`ed rather than forwarded: the
  press *is* the toggle, and `onCheckedChange` is where a side effect goes.
- **The fill, the tick and the border are three gestures off one shared value.**
  The fill fades and scales **from the centre**: a box is filled, not slid into,
  and there is no edge a checkbox is filled *from* — a `translateX` here reads as
  a panel arriving rather than a surface appearing, so there is none. The tick is
  not faded up with it; it sits behind a container whose width opens from the
  box's left edge, so the stroke is drawn on when ticking and taken back when
  unticking. `tickDelay` holds it until the surface it is drawn on is most of the
  way there — starting both at once reads as one blurred event. The border comes
  last, held by `borderDelay` until the surface is near the edge, so it reads as
  the fill *arriving* at the border rather than as an outline changing on its
  own. All three interpolate off a single `withTiming`, so they cannot drift, and
  the values live in `CHECKBOX_INDICATOR_ANIMATION` where a test pins that every
  track travels and that the filled end is a finished box rather than something
  stopped mid-way.
- **The fill's corner radius is the box's minus its border width, and it does
  not animate.** That subtraction is the rule for two rounded rectangles to sit
  concentric, and the fill sits inside the border, so it is the only value that
  looks right — in both directions. Rounder, and `overflow-hidden` cuts the
  fill's corners back past the border's, leaving a sliver of the box's own
  background at each one: that is what a `rounded-*` on the `indicator` slot
  does, since a class can only name the box's *outer* radius. Squarer, and the
  fill reads as a sharp square inside a rounded box for the whole of the
  animation. Animating it only makes it correct at one end. `scale` shrinks the
  rendered corner along with the square, which is what keeps a half-grown fill
  looking like a smaller version of the finished one.
- **It is a number, and there is no token for it.** 5pt and 7pt are not a scale;
  they are `--radius-xs` and `--radius-sm` with a border subtracted, so minting
  tokens would only give the pair a second place to disagree.
  `checkbox.variants.test.ts` reads `tokens.css` and asserts
  `CHECKBOX_FILL_RADIUS` *is* that subtraction, that `CHECKBOX_RADIUS_STEP`
  names the `rounded-*` the `box` slot actually wears, and that the box's border
  really is the bare 1pt `border` the arithmetic assumes. Retuning a radius, or
  reaching for `border-2`, fails the build rather than quietly reopening the
  gap.
- **The border is the one part of the box no `tv()` describes.** A colour that
  fades cannot be a class, so it interpolates between two token *values* —
  `resolveCheckboxBorderTokens` names them, and `CHECKBOX_SURFACE_TOKEN` is the
  same colour the `indicator` slot paints as a `bg-*`, pinned against it by a
  test. The base keeps `border-input` as the resting appearance the animated
  style starts from, and nothing else in the slot set mentions a border colour;
  two sources for one border is how a class and a style end up disagreeing for a
  frame on every toggle. An **invalid** box returns danger at *both* ends, so
  there is nothing to fade — the border is the signal the value is wrong, and it
  has to be there before the box is ticked as much as after.
- **The clip is measured, not tabulated.** It needs the box's width in points and
  `size-checkbox-md` cannot be read from JavaScript, so it comes from the fill
  layer's own `onLayout` — that layer is already exactly the width the clip has
  to span. A table of numbers here would be `tokens.css` restated in TypeScript,
  which is the drift `tokens.test.ts` exists to catch everywhere else.
- **Reduce-motion takes Reanimated's default `System` policy here**, unlike
  [`Spinner`](../spinner/AGENTS.md). Under it `withTiming` completes instantly, which for a checkbox is
  right: the state change is the point and the travel is decoration. A spinner
  had to opt out because its animation *is* the status signal.
- **`hitSlop` is new to this package, and only a bare box gets any.** A bare `md`
  checkbox is a 20pt square against a 44pt minimum, with no padded capsule to
  absorb the difference the way [`Badge.CloseButton`](../badge/AGENTS.md) has. Once there is a label
  the row is the target and is already wide, so `resolveCheckboxHitSlop` returns
  nothing — slop on top of that would overlap the row below and make a tap
  between two checkboxes ambiguous, which is worse than a merely adequate target.
- **There is no `Checkbox.Description` and no `Checkbox.Indicator`.**
  `Field.Description` already is the first, and a label defined twice is a type
  scale that can drift. The second has nothing to configure that
  `isIndeterminate` does not already decide — the glyph swap is the only choice
  it would offer.
- **The box mints no scale of its own — it reads `--spacing-icon-*`, two steps
  above its own glyph.** A checkbox *is* a glyph in a box, and both measurements
  already sit on that scale: 18/14, 20/16, 24/18. A private
  `--spacing-checkbox-*` would be three numbers that have to be retuned in step
  with three others forever, and nothing would notice when they stopped
  agreeing. The two-step offset is what leaves the tick breathing room, and a
  test pins the *offset* rather than the points, so the icon scale can be
  retuned without the test becoming a transcript of it.
