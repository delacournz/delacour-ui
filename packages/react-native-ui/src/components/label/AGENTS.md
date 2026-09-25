# Label

The name of a form control, with required, invalid and disabled states. One
component, no parts.

`import { Label } from "@delacour/react-native-ui/label";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/label` |
| `label.tsx` | `Label` |
| `label.variants.ts` | Pure `tv()` slots + resolvers, no RN imports |
| `label.variants.test.ts` | |

## Design

- **States**: `isRequired`, `isInvalid`, `isDisabled`. All default `false`, all
  independent — a required field that is also wrong shows both.
- **It *is* `Text.Label`, and passes a colour, never a scale.** The same move
  [`Field`](../field/AGENTS.md)'s text parts make: a `text-sm font-medium` in a
  slot here would be a second definition of [`Text.Label`](../text/AGENTS.md)
  that could drift from it. `resolveLabelColor` returns `destructive` when
  invalid and `undefined` otherwise, and `undefined` means "leave the preset's
  own colour alone". A caller's `color` beats it; `size` and `weight` are
  `Text`'s own axes and work unchanged. A test asserts neither slot carries a
  size, weight or colour.
- **The required mark is a nested `Text`, not a sibling.** A row of two `Text`s
  would put the asterisk beside the label's **box**: a label long enough to wrap
  would carry it in a column of its own at the right edge of the first line. As a
  nested run it flows with the text and lands after the last word — and a
  no-break space in front of it (` *`) keeps it from wrapping onto a line by
  itself. It inherits the label's size and weight through `Text`'s own nesting,
  so there is nothing to keep in step.
- **The mark is destructive in every state.** Required is a warning about what
  the form will refuse, so it wears the colour of that refusal whether or not the
  value is wrong yet. `LABEL_REQUIRED_MARK_COLOR` is the constant;
  `requiredMarkClassName` restyles it.
- **Only the root fades when disabled.** The mark is a run inside the root's own
  text, so the root's `opacity-50` already reaches it. Fading it again would
  square the fade. A disabled label also reports `accessibilityState.disabled`,
  so a screen reader says "dimmed" rather than leaving the fade visual-only.
- **A required label is announced as "Email, required", not "Email, star".**
  React Native reads a `Text` and its nested runs as one string, so without an
  `accessibilityLabel` VoiceOver speaks the punctuation. `resolveLabelAccessibilityLabel`
  builds one when the children are plain text — `labelText` reads strings,
  numbers and arrays of them, and gives up on anything else rather than guessing
  at an element's words. A caller's own `accessibilityLabel` always wins, and is
  the answer when the children are not text.
- **`children` and `accessibilityLabel` are narrowed from `Text`'s.** `Text`
  renders `Animated.Text`, whose props also accept Reanimated `SharedValue`s. A
  label has to append its mark to its children and read them as text, and a
  shared value supports neither, so the narrower type is the honest one — the
  reason [`Field.Error`](../field/AGENTS.md) narrows its own children.
- **It reads no context.** A standalone primitive is whatever it is told, which
  is what makes it usable outside a `Field` — above a `Slider`, beside a
  `Switch`, in a settings row — without a layout it does not need.
  `Field.Label` stays the field-aware counterpart: it reads the enclosing
  field's state, and it is **not** built on `Label`, because doing so would
  change its public surface — `Label` narrows `children`, and a disabled `Label`
  reports `accessibilityState.disabled`, which `Field.Label` does not. The two
  must still read as one component, so `label.variants.test.ts` pins
  `resolveLabelColor` and the disabled fade to `fieldVariants`' label slot and
  `resolveFieldTextColor("label", …)`. Change one and the test names the other.
- **Inside a `Field`, `Label` is the way to say "required".** `Field.Label` has
  no `isRequired`. Pass the field's state yourself —
  `<Label isInvalid={isInvalid} isRequired>Email</Label>` — or read it in a
  custom part with `useField()`.
- **There is no `htmlFor`.** React Native has no `<label>` element and no
  label-for-control association. On Android, give the label a `nativeID` and the
  control `accessibilityLabelledBy` with the same string; iOS has no equivalent,
  which is why a control's own `accessibilityLabel` matters more than the label
  beside it.
- **There is no `Label.Text` part.** The label is already text; a `View` root
  holding a text part would be the row of two boxes the nested mark exists to
  avoid, and would take `ViewProps` where every caller wants `Text`'s `size`,
  `weight` and `numberOfLines`.
- **No `onPress` wiring.** `Text` already takes `onPress`, so a label that should
  focus its control passes one — the same thing `Field`'s whole-row press does
  for a checkbox. Mounting a gesture detector under every label in a form would
  announce static text as something to activate, which
  [`Badge`](../badge/AGENTS.md) refuses for the same reason. A `Text` with `onPress` is exposed to VoiceOver as a **link**, and
  `accessible={false}` does not change that on iOS — checked on a simulator,
  where it still read as `AXLink`. A caller wiring one should pass
  `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`,
  and let the control, which carries its own `accessibilityLabel`, be the element
  a screen reader lands on — the move `Field`'s row makes. The playground's
  `/label` "Beside a switch" demo shows it.
