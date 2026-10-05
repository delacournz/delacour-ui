# NumberInput

A number with a minus and a plus either side of it — for quantities, counts,
prices, any bounded number where tapping beats typing or typing beats tapping.
Root plus `NumberInput.Field`, `.Decrement` and `.Increment`, and
`useNumberInput()`.

`import { NumberInput } from "@delacour/react-native-ui/number-input";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/number-input` |
| `number-input.tsx` | Root, the draft model + the `Object.assign` compound surface |
| `number-input-field.tsx` | `NumberInput.Field` — the `Input` between the steppers |
| `number-input-decrement.tsx` | `NumberInput.Decrement` |
| `number-input-increment.tsx` | `NumberInput.Increment` |
| `number-input-stepper.tsx` | The shared body behind both steppers — the hold gesture, the haptic, the fade. Not a part |
| `number-input.context.tsx` | `NumberInputProvider`, `useNumberInput()`, `useNumberInputContext()`, `useNumberInputPart()` |
| `number-input.types.ts` | Prop types shared by two or more modules |
| `number-input.format.ts` | Pure parse, format, step and repeat-schedule maths, no RN imports |
| `number-input.format.test.ts` | |
| `number-input.variants.ts` | Pure `tv()` slots for the steppers + resolvers, no RN imports |
| `number-input.variants.test.ts` | |
| `use-step-repeat.ts` | The hold-to-repeat timer. Imports React only; its schedule is in `.format.ts` |

## Design

- **One reconcile, every path.** A stepper tap, a held repeat, a committed
  draft, an accessibility action and a controlled value all go through
  `reconcile`: rounded to the precision, snapped to the step grid, held inside
  `[min, max]`. The value can therefore only ever be on the grid, and a test can
  prove it, because the whole decision is in `number-input.format.ts`.
- **The grid is measured from a finite `min`, or from zero.** `min: 1, step: 2`
  steps 1, 3, 5. A max that is off the grid is never reached — `max: 10, step: 3`
  tops out at 9 — because clamping straight to 10 would hand back a value no
  stepper could have produced, and the next decrement would land on 7 rather
  than 6. `resolveStepperState` asks `stepValue` rather than comparing against
  the bounds for the same reason: increment disables at 9, not at 10.
- **Rounding shifts the exponent in the string, not the number.**
  `1.005 * 100` is `100.49999999999999` in a double, so `Math.round(v * 100) / 100`
  — and `toFixed` — round it down. `roundToPrecision` reads `1.005e2` as exactly
  `100.5`. The step count is rounded before it is floored for the same reason:
  `0.25 / 0.1` is `2.4999999999999996`. Ten steps of `0.1` land on exactly `1`;
  a test holds it.
- **`null` is empty, and empty steps to zero held in range.** Never to `NaN`.
  With `min: 1` the first tap of either stepper lands on 1; with a range wholly
  below zero it lands on the max.
- **Typing is a draft, and nothing commits mid-typing.** Focus swaps the
  formatted value for the bare number (`toEditableString` — no grouping,
  currency or unit, the locale's separator). Every keystroke is sanitised to
  digits, one separator and a leading minus, and kept as text. `""`, `"-"`,
  `"1."` are valid drafts. Blur or submit commits: empty commits `null`, text
  that spells no number reverts, a number reconciles. Committing per keystroke
  would snap `1` to the min while the person was typing `15`.
- **`onValueChange` fires on committed change only.** Never per keystroke, and
  never when a commit reconciles to the value already held.
- **A stepper press while editing commits the draft first**, then steps from
  it, so `15` typed and `+` tapped is 16 rather than whatever was there before.
- **A controlled value that moves mid-edit replaces the draft only if nothing
  was typed.** Overwriting a half-typed entry would throw away what the person
  is in the middle of. The `isDirty` ref is that distinction.
- **`commitMode="validate"` keeps an out-of-range number and flags it.** It is
  snapped and rounded but not clamped, and the group goes invalid while the
  value — or the draft being typed — is outside the bounds. An explicit
  `isInvalid` wins either way, and validation only ever turns the box invalid:
  it never calms a `Field` that already is.
- **The steppers are not built on `Pressable`, and that is forced.**
  `Pressable` is a Gesture Handler tap, and a tap reports no press-in and fails
  after half a second — a hold would end at its fifth repeat. A `LongPress` with
  `minDuration(0)` activates on touch-down and finalises on release, which is
  exactly the press-in and press-out a repeat needs. The fade follows
  `Pressable`'s idea on an inner target only, so the separator never flickers.
  `Slider` and `Rating` own their gestures for the same kind of reason.
- **The press is the first step, so there is no `onPress`.** Stepping again on
  release would step twice per tap.
- **The hold schedule is pure; the timer is not.** `resolveRepeatInterval`
  (160ms to tick 4, 90ms to tick 14, 45ms from 15) and `resolveRepeatMultiplier`
  (×`largeStepMultiplier` from tick 25) are in `.format.ts` with their boundaries
  tested. `use-step-repeat.ts` owns only the `setTimeout`. A hold stops on
  release, on a limit, when the stepper disables, and on unmount.
- **A step reads the last committed value, not the last render.** A hold can
  outrun a controlled parent's re-render, so `latest` is a ref that each commit
  writes and each render resets — a parent that rejects a change still wins.
- **Haptics: one per step, a different one at a limit.** `selection` per applied
  step, `light` when a step reaches or bumps a bound — once, since the hold stops
  there. From tick 15 a repeat lands every 45ms, which reads as a buzz, so every
  other one is skipped; a limit always plays. `resolveStepHaptic` is the
  decision. `playHaptic` is a worklet, so it runs through `scheduleOnUI`.
- **The box is `Input.Group`'s, unchanged.** Border, fill, height, corner,
  focus ring, invalid and disabled are the group's, so a number input beside an
  `Input` is the same box by construction. The only class the root adds is
  `NUMBER_INPUT_GROUP_CLASS` — `px-0 gap-0`, layout only — so the steppers reach
  the border instead of floating in a gutter. Do not give the root a border.
- **A stepper is a square, the box's height wide.** `w-input-*` against the
  box's `h-input-*`, stretched to the row. That is 44pt at `md` and 52 at `lg`;
  `sm` is 36 and adds 4pt of `hitSlop` each side. Its separator is a hairline
  on the field side, `border-border`, which is why `position` exists: a custom
  anatomy that puts both steppers at the end says so, and each draws its line
  on the correct side.
- **A disabled stepper is a muted glyph, not an opacity.** The press fade is an
  animated style and owns `opacity` on the view, so an `opacity-*` class would
  be overwritten. `resolveStepperIconToken` swaps `foreground` for
  `muted-foreground`. When the whole group is disabled, its own fade does the
  rest.
- **Decrement and Increment sit inside `Input.Group.Prefix` / `.Suffix`.** That
  is what makes them decorators the group knows about — and they are *not*
  decorative: each is a reachable button with `Decrease` / `Increase` labels
  and `accessibilityState.disabled` at its limit.
- **The field is `adjustable`.** `accessibilityValue` carries `now`, the
  formatted `text`, and `min`/`max` when finite; `increment` and `decrement`
  actions step it. That is a VoiceOver or TalkBack swipe up or down, without
  finding the buttons. The buttons stay reachable for anyone who cannot swipe.
- **A stepper declares `activate`.** VoiceOver's double-tap then runs the
  stepper's handler rather than synthesising a touch the hold gesture would read
  as a press-in with no press-out.
- **The keyboard follows what the value can hold.** Whole non-negative numbers
  get the digit pad, decimals the decimal pad. Neither iOS pad has a minus, so
  a field that can go negative falls back to numbers-and-punctuation there;
  Android's `numeric` keyboard is already signed. `resolveNumberInputKeyboard`.
- **Formatting is `Intl`, and a currency keeps its cents.** At rest the value is
  grouped at exactly `precision` decimals, but a style with more decimals of its
  own is not overruled downwards — `step: 0.5` in NZD shows `$19.50`, not
  `$19.5`. A percentage shows two fewer, because the raw value is a fraction.
  Explicit fraction digits in `formatOptions` win outright.
- **Parsing is locale-aware and forgiving.** The locale's decimal separator is
  the point, its group separator is dropped (a space-like group accepts any
  space), a leading `+` is fine, and Arabic-Indic digits are read as digits.
  Typing `"12,5"` in an English locale reads 125 — a deliberate trade for
  accepting a typed thousands separator.
- **Joins a `Field`.** `isInvalid` and `isDisabled` cascade through the group,
  `Field.Label`'s text is the field's accessibility label, and the label's press
  focuses the field through `registerPress` — unless the field cannot be typed
  into, when it offers nothing.
- **`isEditable={false}` and `isReadOnly` are different.** The first makes the
  steppers the only way in; the second leaves the number readable and the
  steppers off.
- **`min` above `max`, or a `step` of zero or less, throws outside production.**
  Both are caller bugs with no sensible value to fall back to.

## Not done here

Scrubbing by dragging the label, a mouse wheel, parsing a typed unit
(`"12 kg"`), precision beyond a double, editing a percentage as a percentage
(display works; the editor is the raw number), and pairing with a `Slider`.
