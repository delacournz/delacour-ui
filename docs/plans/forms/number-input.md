# NumberInput

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: existing `input` (box, group, context leaves), `field`, `pressable`, `icon`. No new peers.

## Purpose on mobile
A numeric field with decrement/increment steppers, for quantities, counts, prices and any bounded number where typing is slower than tapping (or tapping slower than typing, over a wide range). Thumb-sized stepper targets, hold-to-repeat with acceleration, and a keyboard path that tolerates half-typed input ("", "-", "1.") until commit.

## Behaviour reference (summary)
- Editable field flanked by minus and plus buttons; buttons tap-step, or hold to auto-repeat after a delay and then accelerate.
- Every path (button, hold, typing, controlled prop) funnels through one reconcile: clamp to `[min, max]`, snap to `step`, round to the step's decimal precision.
- Minus disables at `min`, plus disables at `max`.
- Typing accepts incomplete entries (empty, lone minus, trailing separator) while focused; commit on blur/submit either applies the clamped value or reverts to the last valid one.
- Display can be formatted (grouping, currency, units); the focused editor shows the bare number.
- Optional haptic tick per step; outline/filled look, three sizes, invalid/disabled/required states, label/description/error through the form field.

## API

```ts
export type NumberInputValue = number | null; // null = empty

export type NumberInputProps = {
  value?: NumberInputValue;
  defaultValue?: NumberInputValue;           // default null
  onValueChange?: (value: NumberInputValue) => void; // fires on COMMITTED changes only
  min?: number;                              // default -Infinity
  max?: number;                              // default Infinity
  step?: number;                             // default 1; must be > 0
  /** Decimal places kept. Default: decimals of `step` (max of step, min). */
  precision?: number;
  /** Multiplier applied to step while a repeat is "fast" (default 10). Set 1 to disable. */
  largeStepMultiplier?: number;
  locale?: string;                           // Intl locale; default device locale
  /** Display formatting while NOT focused. Default: grouping + precision. */
  formatOptions?: Intl.NumberFormatOptions;
  /** false = steppers only, field is read-only text. Default true. */
  isEditable?: boolean;
  /** Clamp-and-commit on blur (default) vs. leave out-of-range typed text flagged invalid. */
  commitMode?: "clamp" | "validate";
  variant?: InputVariant;                    // "primary" | "secondary" (Input's)
  size?: InputSize;                          // "sm" | "md" | "lg"
  isInvalid?: boolean;                       // ?? Field.isInvalid
  isDisabled?: boolean;                      // ?? Field.isDisabled
  isReadOnly?: boolean;                      // field visible+focusable, steppers disabled
  haptic?: false | HapticFeedback;           // default "selection"; limit hit plays "light"
  placeholder?: string;
  className?: string;
  accessibilityLabel?: string;               // falls back to Field.label
  /** Forwarded to the inner TextInput (onFocus/onBlur/onSubmitEditing/testID/returnKeyType…). */
  inputProps?: Omit<InputProps, "value" | "defaultValue" | "onChangeText" | "variant" | "size" | "isInvalid" | "isDisabled" | "multiline">;
  children?: ReactNode;                      // optional custom anatomy, see below
};

export type NumberInputContextValue = {
  value: NumberInputValue;
  draft: string | null;                      // non-null only while editing
  canDecrement: boolean;
  canIncrement: boolean;
  isFocused: boolean;
  size: InputSize;
  isDisabled: boolean;
  isReadOnly: boolean;
  step: () => void;                          // internal, via parts
  stepBy: (direction: 1 | -1) => void;
  setValue: (next: NumberInputValue) => void;
};
export function useNumberInput(): NumberInputContextValue;
```

Parts (Pattern B): `NumberInput` root, `NumberInput.Field` (the TextInput), `NumberInput.Decrement`, `NumberInput.Increment`. With no children, root renders the default anatomy (Decrement, Field, Increment). Custom children allow e.g. buttons both on the right, or an `Input.Group.Suffix` unit.

```tsx
<Field>
  <Field.Label>Guests</Field.Label>
  <NumberInput defaultValue={2} min={1} max={10} />
  <Field.Description>Up to 10 guests.</Field.Description>
</Field>

<NumberInput defaultValue={19.5} step={0.5} formatOptions={{ style: "currency", currency: "NZD" }} />

<NumberInput size="lg">
  <NumberInput.Decrement />
  <NumberInput.Field />
  <NumberInput.Increment />
</NumberInput>
```

Implementation: the root renders `Input.Group` (imported from leaf files `../input/input-group`, `../input/input-group-prefix`, `../input/input-group-suffix`, `../input/input`, never `../input`). `Decrement` is rendered inside a `Prefix`, `Increment` inside a `Suffix`, `Field` is an `Input` with `textAlign: center`, `inputMode` set from `precision`/`min` (`numeric` when integer and min >= 0 -> `"numeric"`; negative or decimal -> `"decimal"`; iOS decimal pad has no minus, so when `min < 0` fall back to default keyboard with `keyboardType="numbers-and-punctuation"` on iOS). Group owns the box, so the steppers and field share one border/focus ring exactly like Input.Group. Do not restyle the box.

## Variants & sizes
- Variants and sizes are Input's (`primary|secondary`, `sm|md|lg`) via the group; no new box tokens. (The reference names its looks outline/filled; mapping: primary = outline, secondary = filled.)
- Stepper button: a `Pressable` (feedback `"highlight"`, not scale, so it does not fight the box) containing `Icon` minus/plus (Central Icons `IconMinusSmall`, `IconPlusSmall` — verified in the installed set). Hit target: the decorator is full box height (`h-input-*`) and width = height (square), meeting 44pt at `md`/`lg`; at `sm` extend with `hitSlop`.
- `numberInputVariants` slots: `stepper` (square, centered, separator hairline on the field side), `stepperDisabled`. Only these two are new; everything else is `inputVariants`.

## States
- default; focused (draft shown, box ring from group); pressed (stepper highlight); disabled (group fade, steppers and field inert); readOnly (steppers disabled, field focusable, selectable); invalid (group destructive; also set when `commitMode="validate"` and the draft is out of range); at-min / at-max (that stepper `disabled`, `accessibilityState.disabled`, icon muted); empty (`value === null`, placeholder visible; first Increment goes to `max(min, 0)` clamped, first Decrement likewise, never to NaN); loading — not applicable.

## Accessibility
- Field: `accessibilityRole="adjustable"`, `accessibilityValue={{ min, max, now, text }}` (omit min/max when infinite), `accessibilityActions` increment/decrement + `onAccessibilityAction` calling `stepBy`. This gives VoiceOver/TalkBack swipe-up/down stepping.
- Steppers: `accessibilityRole="button"`, labels `"Decrease"`/`"Increase"` (overridable), `accessibilityHint` none. They are `importantForAccessibility="no-hide-descendants"`? No: keep them reachable (users who cannot swipe-adjust need them), but order: field first.
- Label from `Field.label` (`useFieldContext().label`), `registerPress(focus)` so tapping the label focuses the field.
- Disabled-at-limit buttons announce "dimmed".

## Motion & haptics
- Haptic `selection` on each applied step (tap or repeat tick) via `playHaptic`; `light` once when a step is blocked by a limit (not on every repeat tick: only the first blocked tick per hold). `haptic={false}` disables. Repeat ticks above ~12/s skip the haptic (every other tick) to avoid buzz.
- No decorative motion. Behavioural: none (value text swaps instantly; no count animation).
- Long-press repeat: starts on `onPressIn` (fires step 1 immediately), after `REPEAT_DELAY_MS = 400` repeats; interval schedule from pure `resolveRepeatInterval(tick)`: ticks 0-4 → 160ms, 5-14 → 90ms, 15+ → 45ms, and from tick 25 step multiplies by `largeStepMultiplier`. Cancel on `onPressOut`, blur, disable, hitting a limit, and unmount. `onPress` is ignored (press-in already stepped) to prevent a double step on release.

## Reuses / new internal pieces / peer deps
- Reuses: `Input` + `Input.Group` (+Prefix/Suffix), `Field` context, `Pressable`, `Icon`, `useControllableState` (`value/defaultValue/onValueChange`, typed `number | null`), `playHaptic`.
- New: `number-input.format.ts` (pure parse/format/step math, no RN), `use-step-repeat.ts` hook (timers; the schedule itself is pure).
- Peer deps: none. `Intl.NumberFormat` + `formatToParts` are in Hermes.

Cross-folder rule: imports only leaf modules of `input`/`field`/`pressable`; the dependency on the group means this component must be built against the current `input` folder (no pending changes from the input-group spec are required, but see `isDecorative` there: decrement/increment are NOT decorative).

### Draft / commit model
- Unfocused: `Field` shows `formatNumber(value)`.
- On focus: draft = bare number string using the locale decimal separator, no grouping (`toEditableString`). Selection placed at end.
- On change: sanitise to `[-0-9<decimalSep>]`, keep as draft; if `parseNumberInput` returns a number and `commitMode="clamp"` NO commit yet (avoids fighting the user mid-typing); commit on blur and `onSubmitEditing`. A stepper press while editing first commits the draft, then steps.
- Commit: `null`/partial ("", "-", ".") → empty if text empty, else revert to last value; number → `reconcile`. Draft cleared; `onValueChange` only when the reconciled value differs.
- Controlled value that changes while focused replaces the draft only if the draft is not dirty.

## Files
```
number-input/
  AGENTS.md
  index.ts
  number-input.tsx            root + Object.assign (displayName DelacourUI.NumberInput)
  number-input-field.tsx      DelacourUI.NumberInput.Field
  number-input-decrement.tsx  DelacourUI.NumberInput.Decrement
  number-input-increment.tsx  DelacourUI.NumberInput.Increment
  number-input-stepper.tsx    shared stepper body (not a part)
  number-input.context.tsx    provider + useNumberInput/useNumberInputContext/useNumberInputPart
  number-input.types.ts
  number-input.format.ts      pure math (leaf, no RN)
  number-input.format.test.ts
  number-input.variants.ts    tv slots + resolvers (no RN)
  number-input.variants.test.ts
  use-step-repeat.ts          hook; imports react only
```

## Pure logic to unit-test
`number-input.format.ts`:
- `countDecimals(n)`: 1→0, 0.5→1, 0.25→2, 1e-7→7, 1.10→1.
- `resolvePrecision({ step, min, precision })`: explicit wins; else max decimals of step and finite min.
- `roundToPrecision(v, p)`: 0.1+0.2 @1 → 0.3; 1.005 @2 stays stable (use scaled-integer rounding, tested against a `toFixed` regression); negative zero normalised to 0.
- `snapToStep(v, { step, min })`: base = finite min else 0; 7 @ step 5 min 0 → 5; 8 → 10; midpoint rounds up; min 1, step 2: 4 → 3 or 5 (tie up → 5).
- `clampNumber(v, min, max)`: both bounds, infinities, `min > max` → throws in dev / returns min.
- `reconcile(v, config)`: clamp(snap(round)) order; snapping near max never exceeds max (max 10, step 3 → 9).
- `stepValue(current, direction, config, multiplier = 1)`: null start → clamp(0); at limit returns `{ value, blocked: true }`; fractional steps accumulate without drift (0.1 × 10 = 1).
- `getNumberSeparators(locale)`: en-NZ `{ decimal: ".", group: "," }`; de-DE `{ decimal: ",", group: "." }`; fr-FR group is narrow no-break space; falls back to en on invalid locale.
- `parseNumberInput(text, locale)`: "12.5" → 12.5; "12,5" in de → 12.5; "1,234.5" in en → 1234.5; "" → `{ kind: "empty" }`; "-" / "." / "-." / "1." → `{ kind: "partial" }`; "abc" → `{ kind: "invalid" }`; "--1" invalid; leading plus accepted; Arabic-Indic digits normalised.
- `sanitizeDraft(text, locale, { allowNegative, allowDecimal })`: strips illegal characters, one separator, minus only at index 0, and only when `min < 0`.
- `formatNumber(v, { locale, precision, formatOptions })`: 1234.5 en → "1,234.5"; precision 2 → "1,234.50"; currency NZD; null → "".
- `toEditableString(v, locale, precision)`: no grouping; 1234.5 de → "1234,5".
- `resolveRepeatInterval(tick)` and `resolveRepeatMultiplier(tick, large)`: boundaries at 4/5, 14/15, 24/25.
- `resolveStepperState({ value, min, max, isDisabled, isReadOnly })` → `{ canDecrement, canIncrement }`: null value both enabled; at min/max; readOnly both off.
`number-input.variants.test.ts`: every size resolves a stepper class with `size-input-*`-matched width token; stepper slot has no raw palette colours; disabled variant differs from enabled.

## Playground demos
`apps/playground/src/demos/number-input/`: `basic` (hero, capture), `bounds` (min/max, buttons disable; capture), `decimal-step` (step 0.25, precision), `currency` (formatOptions NZD; capture), `sizes-variants` (capture), `in-field` (Field label/description/error with validate; capture), `hold-to-repeat` (long range 0-1000; not captured, needs interaction), `custom-anatomy`. Route `(components)/number-input.tsx`, row on `index.tsx`, `bun run gen-demos`. Hold-to-repeat verified manually on simulator with agent-device longpress.

## Docs page outline
Overview and hero; Installation; Usage (basic, Field); Bounds and step; Precision and formatting; Typing and commit behaviour; Hold to repeat (timings); Custom anatomy; Accessibility (adjustable actions); API tables (root, Field, Decrement, Increment, `useNumberInput`); Pure helpers exported.

## Out of scope / follow-ups
- Scroll-wheel/drag-to-scrub on the label; mouse-wheel (web); unit-suffix parsing ("12 kg"); BigInt/decimal.js precision beyond doubles; percent entry (`style: "percent"` display works, editing is raw number); slider pairing.
- Registry: `ITEM_META` entry `number-input` (registryDependencies: `input`, `field`, `pressable`, `icon`); no `PACKAGE_INSTALL` additions. Changeset: minor on `@delacour/react-native-ui` and `delacour`.

## Acceptance checklist
- [ ] Tap steps by `step`; hold repeats after 400ms and accelerates; no double step on release
- [ ] Min/max disable the right stepper; blocked-step haptic fires once per hold
- [ ] Typing "", "-", "1." never throws or snaps mid-typing; blur commits/reverts
- [ ] Controlled and uncontrolled both work (`number | null`); `onValueChange` only on committed change
- [ ] Display formatting via Intl; locale decimal separator parsed correctly
- [ ] Box identical to `Input` (shares group); invalid/disabled cascade from Field
- [ ] VoiceOver/TalkBack increment/decrement actions work
- [ ] Pure tests pass (`bun test packages/react-native-ui/src/components/number-input`)
- [ ] AGENTS.md, package AGENTS.md row, `gen-exports`, demos + route + index row + `gen-demos`, docs mdx + meta.json, registry config + `registry:build`, changeset
- [ ] No comments in JSX, no `any`, all displayNames `DelacourUI.NumberInput*`
