# TagInput

Status: spec, not started · Wave: 1 · Depends on: Chip (tokens), Input (variants leaf, selection/placeholder accents), Field (`field.context`)

## Purpose on mobile

Free-form multi-value entry: type text, confirm with Return/comma/space, get a removable chip; Backspace on empty text removes the last. For emails, labels, keywords, recipients. Distinct from Combobox: no option list, the user supplies the values. (Combobox `allowCustomValue` is picking-with-escape-hatch; TagInput is entry-first.)

## Behaviour reference (summary of features observed; no product name/URL)

- Tokens plus a text field living in one box; tokens wrap onto multiple lines.
- Commit delimiters: Return and configurable characters (comma, space, semicolon…); pasted text containing delimiters is split into several tags.
- Empty/whitespace text never commits; tags trimmed.
- Validation hook, duplicate prevention, a maximum count; three rejection reasons (duplicate, over max, failed validation) reported through a callback.
- Backspace on empty text marks the last tag as about-to-remove (destructive tone), a second Backspace removes it.
- Blur behaviour configurable: commit the draft, discard it, or keep the text.
- Optional clear-all and a tag counter; label/description/error text.
- Controlled or uncontrolled; read-only and disabled; variants and sizes; invalid state with message; overflow mode that allows exceeding max but marks the field invalid.

## API

```ts
export type TagInputRejectReason = "duplicate" | "max" | "invalid" | "empty";
export type TagInputBlurBehavior = "add" | "clear" | "keep";

export type TagInputProps = Omit<InputProps, "value" | "defaultValue" | "onChangeText" | "onChange" | "variant" | "size" | "multiline" | "ref" | "onSubmitEditing"> & {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (tags: string[]) => void;
  inputValue?: string;                              // draft text, controllable
  defaultInputValue?: string;
  onInputValueChange?: (text: string) => void;
  delimiters?: readonly string[];                   // chars that commit; default [","]; Return always commits
  max?: number;
  allowOverflow?: boolean;                          // over max allowed but field becomes invalid; default false
  allowDuplicates?: boolean;                        // default false
  caseSensitiveDuplicates?: boolean;                // default false
  validate?: (tag: string, current: readonly string[]) => boolean;
  onReject?: (info: { tag: string; reason: TagInputRejectReason }) => void;
  transform?: (raw: string) => string;              // after trim, e.g. lowercase
  blurBehavior?: TagInputBlurBehavior;              // default "add"
  isClearable?: boolean;                            // clear-all suffix when tags exist
  showCount?: boolean;                              // "3/10" caption inside suffix when max set
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  chipVariant?: "soft" | "outline";                 // default "soft"
  isInvalid?: boolean; isDisabled?: boolean; isReadOnly?: boolean;
  placeholder?: string;
  removeAccessibilityLabel?: (tag: string) => string;  // default `Remove ${tag}`
  className?: string; testID?: string;
  ref?: Ref<TagInputHandle>;
};
export type TagInputHandle = { focus(): void; blur(): void; clear(): void; add(raw: string): TagInputRejectReason | null };
export function useTagInput(): TagInputContextValue; // { tags, draft, isFocused, pendingRemoveIndex, add, remove }
```

Pattern B: `function TagInputRoot` + `Object.assign(TagInputRoot, { Tag, Field-less; displayName: "DelacourUI.TagInput" })`. Optional part `TagInput.Tag` (render override for one chip: `renderTag?: (tag, state) => ReactNode` on the root is simpler and chosen instead — keep surface small; export only the root + hook). Anatomy:

```tsx
<Field isInvalid={tooMany}>
  <Field.Label>Recipients</Field.Label>
  <TagInput
    value={emails}
    onValueChange={setEmails}
    delimiters={[",", " ", ";"]}
    validate={isEmail}
    onReject={({ reason }) => setHint(reason)}
    max={10}
    isClearable
    keyboardType="email-address"
  />
  <Field.Description>Separate with comma or space.</Field.Description>
</Field>
```

Layout: one box (same box as `Input`, from `inputVariants`), `min-h` = input height, content wraps: `flex-row flex-wrap gap-1.5 p-…`; chips (`Chip`, `size` sm/md/lg mapped) with `onClose`; a trailing `TextInput` with `flex-1 min-w-[96px]` so it drops to a new line when too narrow. Whole box is a Pressable (`feedback="none"`) focusing the input, as `Input.Group` does. Suffix area (clear-all, counter) absolute/aligned at the end of the last row.

Implementation note: the box is not `Input.Group` (a single-line row) — it reuses the *same* slot via `resolveInputGroupClass` from `../input/input.variants` so chrome stays identical, with `flex-wrap` and top alignment (multiline rule in Input AGENTS). Inner field: import `TextInput` from `react-native` and apply `resolvePlaceholderAccentClass` / `resolveSelectionAccentClass` leaf resolvers.

## Variants & sizes

`tag-input.variants.ts` (no RN imports): slots `root` (calls Input's box state), `tags` (wrap container, gaps), `input`, `suffix`, `counter`. `size` -> Chip size map `resolveTagInputChipSize` (sm->sm, md->sm, lg->md so the chip never makes the row taller than needed), input text size from `--text-input-*`. Pending-remove tone: the chip rendered with `color="destructive"` `variant="soft"` (Chip's existing colours). Overflow: invalid chrome plus counter in `text-destructive`.

## States

Default · focused (box ring; Input's `isFocused` axis) · pressed (box tap focuses input; chip close `fade`) · disabled (faded, chips non-removable) · readOnly (chips shown, no input, no close) · invalid (own/Field, or overflow) · pending-remove (last chip destructive) · max reached (input hidden if `!allowOverflow`, placeholder replaced by nothing; hint via `onReject`) · empty (placeholder visible only when no tags) · loading n/a.

## Accessibility

- Input labelled from Field `field.label`; placeholder not relied on. `registerPress` focuses the input.
- Group of chips: container `accessibilityRole="list"`? RN lacks reliable list roles on a plain View; instead each chip is a static Chip (not a button) exposing a `remove` accessibility action labelled `removeAccessibilityLabel(tag)`; container `accessibilityLabel` = "{n} tags".
- Announce add/remove/reject via `AccessibilityInfo.announceForAccessibility` (e.g. "Added alice@x.com", "Duplicate, not added") — through a small injectable `announce` seam so it is optional/testable; reason strings customisable via `rejectMessages?: Partial<Record<TagInputRejectReason, string>>`.
- `returnKeyType="done"` (or `next` when `blurBehavior` is `add` and the form needs it — leave to caller), `blurOnSubmit={false}` so Return keeps the keyboard for the next tag; `autoCapitalize="none"` default; Android: `onKeyPress` Backspace handled (RN reports Backspace only reliably when text is empty — see unit tests for the resolver + document the Android IME caveat; fall back to detecting `onChangeText` shrink with empty-before state).

## Motion & haptics

- Chip add/remove: `Animated` layout transition (`LinearTransition` 150ms), enter `FadeIn`/`ZoomIn` 120ms. Calm motion: no layout/enter animations.
- Haptics (Pulsar): `selection` on add, `impactLight` on remove, `notificationWarning` on reject (rate-limited: one per 400ms via pure helper). Backspace "armed" state: `impactLight`.

## Reuses / new internal pieces / peer deps (none new)

Reuses: `Chip` (imported from `../chip`, the house norm — see README decision 4), `input/input.variants` + `input/input.context` leaves, `useFieldContext`, `Icon` (`IconCircleX` for clear-all), `Pressable`, `Text`, `useControllableState` (tags and draft), `useCalmMotion`, Pulsar.
New: `tag-input.logic.ts` (pure parsing/commit/backspace), `tag-input.variants.ts`, `tag-input.context.tsx`.
Peer deps: none new.

## Files

`packages/react-native-ui/src/components/tag-input/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/tag-input` |
| `tag-input.tsx` | Root, state wiring, key handling |
| `tag-input-chip.tsx` | internal chip with pending state |
| `tag-input-suffix.tsx` | internal clear-all + counter |
| `tag-input.context.tsx` | `TagInputProvider`, `useTagInput()`, `useTagInputContext()`, `useTagInputPart()` |
| `tag-input.types.ts` | reject reason, handle, blur behaviour |
| `tag-input.logic.ts` / `.test.ts` | pure functions |
| `tag-input.variants.ts` / `.test.ts` | slots + resolvers |
| `AGENTS.md` | notes; package table row |

Plus: gen-exports, demos, route, index row, gen-demos, docs mdx + meta.json, registry (ITEM_META; no new PACKAGE_INSTALL), changeset.

## Pure logic to unit-test (`tag-input.logic.test.ts`)

- `splitByDelimiters(text, delimiters)`: `"a,b, c"` with `[","]` -> commits `["a","b"]`, remainder `" c"`; trailing delimiter commits last, remainder `""`; multi-char delimiters unsupported (documented: single chars; throws/ignores in dev); space delimiter collapses runs; paste `"a,b,c"` -> three; leading delimiter -> empty ignored.
- `normalizeTag(raw, transform)`: trims, applies transform, collapses internal whitespace? (no: only trim; test confirms inner spaces preserved).
- `evaluateAdd(tag, current, opts)` -> `{ ok: true, tags } | { ok: false, reason }`: empty -> `empty`; duplicate (case-insensitive default) -> `duplicate`; `caseSensitiveDuplicates` distinguishes; `allowDuplicates` accepts; at `max` -> `max`; `allowOverflow` accepts over max; `validate` false -> `invalid`; precedence order: empty, duplicate, invalid, max (pinned by a test).
- `commitDraft(draft, current, opts)`: applies split + evaluate per piece, accumulates accepted and returns rejected list with reasons, atomic per piece (one reject does not drop others).
- `resolveBackspace(state)`: draft non-empty -> none; empty + no tags -> none; empty + tags + not armed -> arm(last); armed -> remove(last), disarm; any text change/blur/focus loss -> disarm.
- `resolveBlur(behavior, draft)`: `add` commits non-empty draft; `clear` empties; `keep` leaves.
- `isOverflowing(tags, max, allowOverflow)`; `resolveCounterText(n, max)` ("3/10", "3").
- `shouldHideInput({ tags, max, allowOverflow, isReadOnly, isDisabled })`.
- Haptic throttle `shouldFireRejectHaptic(lastAt, now)`.
- Variants: chip size map for all sizes; box chrome identical to Input's group chrome at every variant x size x invalid; `flex-wrap` present; no `h-*` on tags slot; tokens exist both themes; no `dark:`.

## Playground demos

`apps/playground/src/demos/tag-input/`: `basic` (hero, capture), `email-validation` (capture, reject hints), `max-and-counter` (capture), `overflow-invalid` , `in-field-with-clear` (capture), `sizes-and-variants` (capture). Route `(components)/tag-input.tsx`; index row; gen-demos.

## Docs page outline

Install · Basic · Delimiters and paste · Validation and `onReject` · Duplicates and max · Blur behaviour · Controlled · In a Field · Sizes/variants · API · Accessibility · Android Backspace note · vs Combobox.

## Out of scope / follow-ups

Drag-to-reorder tags · suggestions dropdown while typing (use Combobox multiple with `allowCustomValue`) · inline tag editing (tap to edit) · @-mention tokens · multi-character delimiters.

## Acceptance checklist

- [ ] Box identical to `Input` chrome in all states, wraps to multiple lines, input stays usable (min width).
- [ ] Return, each delimiter and multi-value paste commit correctly; whitespace never commits.
- [ ] Duplicate/max/invalid rejected with `onReject` reason and haptic; overflow mode marks invalid.
- [ ] Backspace arm-then-remove works on iOS and Android (device-verified, including Android empty-field Backspace).
- [ ] Blur behaviours `add|clear|keep` correct; keyboard stays on Return.
- [ ] Controlled and uncontrolled for both tags and draft.
- [ ] Chip remove action reachable by screen reader; announcements fire; calm motion honoured.
- [ ] No `any`, no JSX comments, displayNames, docs/AGENTS/exports/demos/registry/changeset done; typecheck + check + test green.
