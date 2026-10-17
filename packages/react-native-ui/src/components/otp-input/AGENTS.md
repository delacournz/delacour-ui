# OtpInput

A one-time code or a PIN: a row of cells that reads as N boxes and is driven by one hidden
`TextInput`. Compound root plus `OtpInput.Group`, `OtpInput.Slot` and `OtpInput.Separator`.

`import { OtpInput } from "@delacour/react-native-ui/otp-input";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/otp-input` |
| `otp-input.tsx` | Root + the `Object.assign` compound surface — owns the value, the hidden field, the ref, the haptic |
| `otp-input-group.tsx` | `OtpInput.Group` — a row of cells at the field's gap |
| `otp-input-slot.tsx` | `OtpInput.Slot`, plus the internal blinking caret (`DelacourUI.OtpInput.Slot.Caret`) |
| `otp-input-separator.tsx` | `OtpInput.Separator` — a short rule between groups |
| `otp-input.context.tsx` | `OtpInputProvider`, `useOtpInput()`, `useOtpInputContext()`, `useOtpInputPart()` |
| `otp-input.logic.ts` | Pure: sanitising, the active cell, completion, the group layout, the mask, the keyboard and autofill hints, the accessibility strings, the `Field` axes |
| `otp-input.logic.test.ts` | |
| `otp-input.variants.ts` | Pure `tv()` slots on `Input`'s tokens, the caret's timing, the font-scale cap |
| `otp-input.variants.test.ts` | |

There is no `otp-input.types.ts`: no prop type is shared by two modules here, and the package rule
keeps a type with one consumer in that consumer's file.

## Design

- **Variants**: `primary`, `secondary`, `etched` (Input's fill and border, without its shadow). **Sizes**: `sm`, `md`, `lg` — `Input`'s own axes, typed from
  `../input/input.variants`, so a code field sits level with a text field beside it.
- **One `TextInput`, drawn as cells — never an input per cell.** Per-cell inputs have to hand focus
  along on every keystroke and back on every backspace, and they split a paste or an autofill
  across N fields that each see one character. One field takes the system keyboard, the paste
  menu, iOS's QuickType code from Messages and Android's SMS autofill as one value. The cells are
  a picture of that value.
- **The field is laid over the row and is transparent, not invisible.** `absolute inset-0`, so a
  tap anywhere on the row lands on it, with transparent text, a hidden caret and a transparent
  selection — at full opacity. Some iOS versions treat an `opacity: 0` field as hidden and stop
  offering the code from Messages, which is the one feature this component exists for. The row
  under it is `pointerEvents="none"`.
- **Masking is visual, never `secureTextEntry`.** A secure field turns off one-time-code autofill
  and pulls in the platform's password heuristics (the save-password prompt, the strong-password
  suggestion). The value is the same with `isMasked` on or off; only the cell draws `•`. There is
  no reveal-flash of the last typed character — the simplest mask is also the one that cannot leak.
- **Every change goes through `sanitizeOtp`, and it has no heuristics.** NFKC normalisation first,
  which folds full-width digits from an East Asian IME (`１２３`) to ASCII; then whitespace and the
  zero-width characters a copied SMS carries; then each character is uppercased (when asked) and
  tested against `pattern`; then the result is cut to `length`. `G-123456` pasted into an
  alphanumeric field is `G12345`. Picking "the code" out of a message is the caller's call, and a
  guess here would be wrong in a way nobody could override.
- **`maxLength` is not set.** Autofill and paste can deliver more than `length` characters — a
  prefixed code, or a code with spaces — and a native `maxLength` would cut the raw text before the
  filter ran, dropping digits that would have survived it. The sanitiser truncates instead.
- **A rejected keystroke reverts itself.** When the sanitised text equals the current code — a
  letter typed into a digits field — no state changes, and React Native's controlled `TextInput`
  restores its native text to `value` on its own.
- **The selection is pinned to the end.** `selection={{ start: n, end: n }}`, so the native caret
  can never land mid-code: backspace always removes the last character, and the cells behave as a
  stack.
- **A controlled value is drawn sanitised.** A parent passing seven characters to a six-cell field
  sees six cells, and the native field is pinned to the same six — what is drawn and what is
  stored never disagree.
- **`onComplete` fires on the transition, not the state.** `shouldFireComplete` is true only when
  the code goes from short of `length` to exactly `length`, so a full code that re-renders never
  fires twice, a paste of a whole code fires once, and any deletion re-arms it. The `success`
  haptic plays at the same moment and only then — a haptic per accepted character would buzz six
  times in a frame during autofill. `error` is the host's to play, because only the host knows the
  code was wrong.
- **`blurOnComplete` defaults on.** A complete code is the end of the task on almost every screen
  that has one; the keyboard going away is the cue that the app has it.
- **Invalid outranks focus.** The active cell takes `border-ring`, except while invalid, where every
  cell stays `border-destructive` — `Input`'s rule, for `Input`'s reason: a field that lost its error
  colour the moment it was tapped would drop the signal exactly while the code is being retyped. The
  caret goes destructive too.
- **A cell is `Input`'s box cut square.** Same `border-input bg-card` / `bg-secondary` / etched's card fill per variant,
  same `--spacing-input-*` edge, same `--text-input-*` character, same corner ramp (`rounded-md` at
  `sm`, `rounded-lg` above). The variants test compares the fill and border against `inputVariants`
  itself, so retuning the field drags the cells with it.
- **Cells shrink; the row never wraps.** A cell is `w-input-*` with `shrink`, so twelve cells — or
  eight at `md` on a 320-point phone — narrow to fit the space they are given. A code broken over
  two lines reads as two codes. On the narrowest screens prefer `size="sm"` with a `groupSize`.
- **The character follows the system text size, to a cap.** `OTP_MAX_FONT_SCALE` is 1.5, which the
  test proves keeps the glyph inside three quarters of the cell at every size; uncapped, the largest
  accessibility sizes would spill the character out of a fixed square.
- **The caret is a decorative loop, so it asks `useCalmMotion`** and holds still — solid, not
  hidden — under reduce motion or an E2E build's `isMotionCalm`. It is mounted per cell, so it
  restarts visible each time it moves; a caret caught mid-fade as a digit landed would look like a
  dropped keystroke. The timings and the repeat both set `ReduceMotion.Never`, because reduce motion
  is honoured one level up and a `System` timing completes instantly, which `withRepeat(-1)` would
  spin forever. Focus borders change instantly, from state.
- **The anatomy is optional.** With no children the root draws `buildLayout(length, groupSize)` — a
  group per run of cells and a separator between groups. Children replace it outright, for a 3-2-3
  layout or anything else; a custom cell reads `useOtpInput()`.
- **`isInvalid` and `isDisabled` cascade from `Field`; `isReadOnly` is the component's own.**
  `resolveOtpAxes` is a pair of `??` chains, so an explicit `false` opts one control out of an
  invalid field. Read-only keeps the field focusable and its value readable, and takes no edit;
  disabled fades the root once — separators included — and sets `editable={false}`. A host
  verifying a code disables the field for the round trip.

## Accessibility

- **The hidden `TextInput` is the one accessible element.** The cell row is
  `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so a screen
  reader never walks six boxes.
- **Its name falls back through the field.** `accessibilityLabel`, else the enclosing `Field.Label`'s
  text, else "Verification code". A tap on the label focuses the field through `registerPress`.
- **The value is spelled out, or counted.** Unmasked, "1 2 3" — spaced so it is never read as "one
  hundred and twenty-three". Masked, "2 of 4 digits entered", because reading a PIN aloud defeats the
  mask. Empty is counted in both modes so the reader hears the length. The hint is "Enter the 6
  digit code" (or "character", for letter patterns).
- **An error is announced by `Field.Error`'s live region**, not by this component.

## Autofill

- **iOS** reads `textContentType="oneTimeCode"` and `autoComplete="one-time-code"` and offers the
  code from Messages on the QuickType bar. Nothing to configure in the app; the SMS only has to
  contain a code. A domain-bound message (`@example.com #123456` on its last line) restricts the
  suggestion to that app's associated domain.
- **Android** reads `autoComplete="sms-otp"` with `importantForAutofill="yes"`, and the user's
  autofill service offers the code. The SMS Retriever and User Consent APIs need a native module and
  are out of scope here — they would be a new peer dependency.
- **Neither can be exercised on a simulator.** A paste can: the iOS Simulator's pasteboard follows
  the Mac's.
