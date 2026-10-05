# OtpInput

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: `field`, `pressable`, `text`. Visual tokens shared with `input` (`--spacing-input-*`, `--text-input-*`). No new peers.

## Purpose on mobile
One-time-code and PIN entry: a row of cells that reads as N boxes but is driven by a single hidden `TextInput`, so SMS autofill (iOS QuickType suggestion, Android SMS retriever/autofill), paste, and the system keyboard all work with no per-cell focus juggling.

## Behaviour reference (summary)
- Row of separate cells over a transparent input; the active cell shows a focus border and a blinking caret.
- `length` cells (default 6); text longer than `length` is trimmed; in numeric mode non-digits are dropped and the number pad is shown.
- Hidden input carries one-time-code autofill hints.
- Controlled/uncontrolled value; `onChangeText` on every keystroke; `onComplete` once when the last cell fills.
- Optional mask (dots), single-character placeholder in empty cells, separators between groups (`groupEvery`), three sizes.
- States: default, focused, filled, masked, invalid (with error line), disabled.

## API

```ts
export type OtpPattern = "digits" | "alphanumeric" | "alphabetic" | RegExp; // RegExp tests ONE character

export type OtpInputProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;     // every change, sanitised
  onComplete?: (value: string) => void;        // once per transition to full length
  length?: number;                             // default 6, 1..12
  pattern?: OtpPattern;                        // default "digits"
  /** Cells per group; renders a separator between groups. 0/undefined = one group. */
  groupSize?: number;
  /** Uppercase letters as typed (alphanumeric/alphabetic). Default true when pattern is not "digits". */
  autoCapitalize?: boolean;
  isMasked?: boolean;                          // show "•" in filled cells
  /** One char shown dimmed in empty cells, e.g. "○" or "0". */
  placeholder?: string;
  autoFocus?: boolean;
  size?: InputSize;                            // "sm" | "md" | "lg"
  variant?: InputVariant;                      // "primary" | "secondary"
  isInvalid?: boolean;                         // ?? Field.isInvalid
  isDisabled?: boolean;                        // ?? Field.isDisabled
  isReadOnly?: boolean;
  /** Blur the keyboard when complete. Default true. */
  blurOnComplete?: boolean;
  /** Fire "success" haptic on complete. false to disable. Default "success". */
  haptic?: false | HapticFeedback;
  className?: string;
  accessibilityLabel?: string;                 // falls back to Field.label, then "Verification code"
  testID?: string;
  children?: ReactNode;                        // custom anatomy; omit for the default
};

export type OtpInputRef = { focus(): void; blur(): void; clear(): void };

export type OtpSlotState = {
  index: number; char: string; isFilled: boolean; isActive: boolean; isCaret: boolean;
};
export type OtpInputContextValue = {
  value: string; length: number; isFocused: boolean; isMasked: boolean;
  isInvalid: boolean; isDisabled: boolean; size: InputSize; variant: InputVariant;
  placeholder?: string; activeIndex: number | null;
  slot: (index: number) => OtpSlotState;
};
export function useOtpInput(): OtpInputContextValue;
```

Parts (Pattern B): `OtpInput` root, `OtpInput.Group` (a row of slots), `OtpInput.Slot` (`index: number`), `OtpInput.Separator`. With no children the root auto-lays out `Group`s of `groupSize` slots with `Separator` between. Custom anatomy exists for odd layouts (e.g. 3-2-3).

```tsx
<Field isInvalid={bad}>
  <Field.Label>Verification code</Field.Label>
  <OtpInput length={6} groupSize={3} onComplete={verify} />
  <Field.Error>Code incorrect</Field.Error>
</Field>

<OtpInput length={4} isMasked size="lg" />   // PIN

<OtpInput length={6}>
  <OtpInput.Group><OtpInput.Slot index={0} /><OtpInput.Slot index={1} /><OtpInput.Slot index={2} /></OtpInput.Group>
  <OtpInput.Separator />
  <OtpInput.Group><OtpInput.Slot index={3} /><OtpInput.Slot index={4} /><OtpInput.Slot index={5} /></OtpInput.Group>
</OtpInput>
```

### How the hidden input works
- One `TextInput` absolutely fills the cell row, `opacity: 0` is NOT used (iOS drops autofill suggestion for fully invisible inputs in some versions); use transparent text/caret (`color: "transparent"`, `caretHidden`, `selectionColor="transparent"`) with real opacity 1, and `pointerEvents` left on so a tap anywhere on the row focuses it. Slots are `pointerEvents="none"`.
- Props set: `value`, `onChangeText`, `textContentType="oneTimeCode"`, `autoComplete={Platform.select({ ios: "one-time-code", android: "sms-otp", default: "off" })}`, `importantForAutofill="yes"`, `inputMode`/`keyboardType` (`"number-pad"` for `digits`, else `"default"`), `autoCapitalize={uppercase ? "characters" : "none"}`, `autoCorrect={false}`, `spellCheck={false}`, `contextMenuHidden={false}` (keep paste), `maxLength` NOT set (autofill or paste may arrive longer; we truncate), `selection={{ start: value.length, end: value.length }}` pinned to the end so the native caret cannot land mid-code, `secureTextEntry` NOT used for masking (it disables autofill and iOS password heuristics) — masking is visual only.
- `onChangeText(raw)` → `sanitizeOtp(raw, { pattern, length, uppercase })` → set; if the sanitised text differs from `raw` force the native field back (controlled prop re-render already does).
- Backspace deletes the last char (selection pinned to end, so it behaves as a stack).
- `onComplete` fires when length goes from `< length` to `=== length`, once; re-arms after any deletion. Paste of a full code fires it.
- Focus/blur drive `isFocused`; blur/focus callbacks pass through. `onSubmitEditing` too.

## Variants & sizes
- Sizes `sm|md|lg` reuse `--spacing-input-*` for cell height and a square-ish cell `w-input-*` (same token, new utility `w-input-*` only if tokens.css already generates `--spacing-input-*` for width utilities; otherwise slot uses `aspect-square` with `h-input-*`). `--text-input-*` for the character.
- Variants `primary|secondary` mirror Input (border vs. filled, same semantic tokens `border-input`, `bg-secondary`, ring on focus, `destructive` when invalid).
- `otpInputVariants` slots: `root` (row), `group` (row with gap-2), `slot`, `char`, `placeholder`, `separator` (a short `bg-border` bar, `w-3 h-px`; accessibility-hidden), `caret`.
- Cell shape: `rounded-lg` stepping to `rounded-md` at sm, matching Input's generic corner ramp.

## States
default; focused (active cell: `border-ring` + caret; when full, the last cell stays active-styled, caret hidden); filled (char shown); masked (`•` always, no reveal-flash on the last typed char: simplest and safest); placeholder (dimmed char in empty cells); invalid (all cells `destructive` border; invalid outranks focus, as in Input); disabled (row faded, input `editable={false}`); readOnly (focusable, selectable, no edit); loading — host controls via `isDisabled` while verifying.

## Accessibility
- The hidden `TextInput` is THE accessible element: `accessibilityLabel` (prop, else `Field.label`, else "Verification code"), `accessibilityValue={{ text: isMasked ? "N of L digits entered" : value.split("").join(" ") }}`, `accessibilityHint` "Enter the {length} character code". Slots are `accessible={false}` and `importantForAccessibility="no-hide-descendants"` so a screen reader does not walk N boxes.
- `registerPress(focus)` with Field so a tap on the label focuses.
- On complete + invalid flip, rely on `Field.Error` live region.
- Large text: slots scale with `size` tokens (font scale respected; row wraps? No — row must not wrap; `groupSize` + `sm` keeps 8 cells on a 320pt screen; document).

## Motion & haptics
- Caret blink: Reanimated `withRepeat(withSequence(timing 0→1, delay, timing 1→0))` on the active slot only. This is a decorative loop: under `useCalmMotion()` show a static solid caret.
- Focus border change is instant (state-driven class), no animation.
- Haptics via Pulsar `playHaptic`: `selection` on each accepted character is skipped (too noisy for fast autofill); `success` on complete; `error` is the host's call (expose nothing; the demo shows invalid + `playHaptic("error")`). Paste/autofill filling many cells = one `success` only.

## Reuses / new internal pieces / peer deps
- Reuses: `Text`, `Pressable` (not needed for slots; a plain `View` row), `useFieldContext`, `useControllableState`, `playHaptic`, `useCalmMotion`, `inputVariants` token constants only (`../input/input.variants` leaf: for size/variant types and the `INPUT_*` colour constants).
- New: `otp-input.logic.ts` (pure), caret component, root.
- Peer deps: none new.

## Files
```
otp-input/
  AGENTS.md
  index.ts
  otp-input.tsx             root + Object.assign (DelacourUI.OtpInput), forwardRef-free: `ref` as prop (React 19) typed OtpInputRef
  otp-input-group.tsx       DelacourUI.OtpInput.Group
  otp-input-slot.tsx        DelacourUI.OtpInput.Slot (+ caret)
  otp-input-separator.tsx   DelacourUI.OtpInput.Separator
  otp-input.context.tsx
  otp-input.types.ts
  otp-input.logic.ts        pure sanitise/layout (no RN)
  otp-input.logic.test.ts
  otp-input.variants.ts
  otp-input.variants.test.ts
```

## Pure logic to unit-test
`otp-input.logic.ts`:
- `charMatches(char, pattern)`: digits "7" yes "a" no; alphanumeric "a" "7" yes "-" no; alphabetic; RegExp custom; multi-char input to regex rejected.
- `sanitizeOtp(raw, { pattern, length, uppercase })`: "12 34-56" digits → "123456"; ".." → ""; "1234567890" length 6 → "123456"; "ab12" alphanumeric uppercase → "AB12"; strips whitespace/newlines/zero-width chars; "G-123456" with alphanumeric and length 6 keeps "G123456".slice(0,6) = "G12345" (documented: no heuristics); full-width digits "１２３" normalised to ASCII digits.
- `resolveActiveIndex(valueLength, length, isFocused)`: unfocused → null; focused empty → 0; 3/6 → 3; full → length-1.
- `resolveSlotState(value, index, { isFocused, length })`: char, isFilled, isActive, isCaret (caret only on the first empty cell when focused and not full).
- `shouldFireComplete(prev, next, length)`: 5→6 true; 6→6 false; paste ""→6 true; 6→5→6 true again; length-1 pattern.
- `buildLayout(length, groupSize)`: (6,3) → [[0,1,2],[3,4,5]]; (6,0/undefined) → [[0..5]]; (6,4) → [[0..3],[4,5]]; (4,4); (1,1); invalid groupSize negative → single group; length clamped 1..12.
- `maskChar(char, isMasked)`: "•" or char; empty stays "".
- `resolveKeyboard(pattern)`: digits → number-pad; others → default; custom RegExp → default.
- `resolveAccessibilityValue({ value, length, isMasked })` strings.
`otp-input.variants.test.ts`: all size×variant×state cells emit slot classes; invalid slot has `border-destructive` and focused+invalid does not use `border-ring`; no raw palette classes or `dark:`; separator slot is not size-keyed to text.

## Playground demos
`apps/playground/src/demos/otp-input/`: `basic` (hero, capture, 6 digits grouped 3-3), `pin-masked` (4, capture), `alphanumeric` (capture), `states` (invalid, disabled, filled; capture), `in-field` (Field + verify-on-complete flow with success/error haptic; capture), `sizes` (sm/md/lg). Autofill cannot be exercised on a simulator; paste can (Simulator pasteboard) — note in the demo caption.

## Docs page outline
Overview + hero; Usage; Autofill (iOS QuickType + Android SMS) and the required app config note (iOS needs an associated "one-time-code" SMS format `@host #code`; Android: user consent API is the app's concern); Pattern and keyboard; Groups and separators; Masking; Field integration; Imperative ref; Accessibility; API tables.

## Out of scope / follow-ups
- Android SMS Retriever / User Consent API wiring (needs a native module; would be a peer-dependency decision, listed as an open question, not part of this component).
- Paste-from-clipboard button; resend-timer (compose with `Button`); per-slot custom render beyond `Slot` children; RTL cell order (digits stay LTR — verify).
- Registry: `ITEM_META` `otp-input` (registryDependencies `field`, `text`, `input` for tokens); no `PACKAGE_INSTALL` additions. Changeset minor for `@delacour/react-native-ui` and `delacour`.

## Acceptance checklist
- [ ] One hidden TextInput; tap anywhere on row focuses; no per-cell inputs
- [ ] `textContentType="oneTimeCode"` + Android autofill hint set; iOS QuickType suggestion fills all cells
- [ ] Paste of full code fills and fires `onComplete` once; overlong paste truncated; junk characters dropped
- [ ] Digits mode shows number pad and rejects letters; alphanumeric mode works with uppercase
- [ ] Groups/separator render from `length` + `groupSize`; custom anatomy works
- [ ] Mask is visual only (autofill still works)
- [ ] Caret loop honours `useCalmMotion`; invalid outranks focus
- [ ] Single accessible element, label from Field, value announced
- [ ] `ref` exposes focus/blur/clear
- [ ] Pure tests pass; AGENTS.md, package row, `gen-exports`, demos/route/index/`gen-demos`, docs mdx + meta.json, registry + `registry:build`, changeset
- [ ] No JSX comments, no `any`, displayNames `DelacourUI.OtpInput*`
