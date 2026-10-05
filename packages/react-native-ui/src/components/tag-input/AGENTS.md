# TagInput

Free-form entry of several values — recipients, labels, keywords — as removable
chips inside one field box. The user supplies the values; there is no option
list.

`import { TagInput } from "@delacour/react-native-ui/tag-input";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/tag-input` |
| `tag-input.tsx` | Root: state wiring, key handling, the box, the `Object.assign` surface |
| `tag-input-chip.tsx` | Internal: one tag — a static `Chip`, or `renderTag`'s node — in its animated wrapper |
| `tag-input-suffix.tsx` | Internal: the counter and the clear-all control |
| `tag-input.context.tsx` | `TagInputProvider`, `useTagInput()`, `useTagInputContext()`, `useTagInputPart()` |
| `tag-input.types.ts` | Reject reason, blur behaviour, rejection, handle, `renderTag` state |
| `tag-input.logic.ts` | Pure parsing, commit rules, Backspace, blur, counter, haptic throttle, announcements |
| `tag-input.logic.test.ts` | |
| `tag-input.variants.ts` | Pure `tv()` slots + resolvers — box, field, chip, suffix — no RN imports |
| `tag-input.variants.test.ts` | |

## Design

- **Every decision is in `tag-input.logic.ts`, and the root only wires it to
  events.** Splitting, trimming, the four rejection reasons, what Backspace and
  blur do, the counter and the haptic throttle are pure functions, so the whole
  behaviour is reachable from `bun test` where no renderer is. A rule added
  inline in `tag-input.tsx` is a rule nothing checks.
- **The box is `Input.Group`'s, at its multiline floor.** `resolveTagInputBoxClass`
  calls `resolveInputGroupClass` with `isMultiline: true` — a minimum height and
  top-aligned content, the rule `Input` applies to a field that grows — so the
  border, fill, corner, focus ring, invalid and disabled states are the same
  box by construction. The test sweeps variant × size × focus × invalid ×
  disabled and asserts every chrome utility is present. **Do not restate any of
  it here.**
- **The vertical padding is the one thing that differs, and it is arithmetic.**
  `Input`'s multiline padding plus a chip would make the box four points taller
  than a field the moment the first tag landed. `TAG_INPUT_PADDING_Y` is chosen
  so padding, a chip and the border sum to `--spacing-input-*` exactly, and a
  test adds them up — a retune of either `Chip` or the input tokens fails here
  rather than making the box jump.
- **Chips step down a size from the field** — `sm`→`sm`, `md`→`sm`, `lg`→`md` —
  for the same reason: a chip the field's own size would not fit its floor.
- **A soft chip on a `secondary` box lifts to `bg-elevated`.** A soft default
  chip is `bg-muted` and a secondary box is `bg-secondary` — the same step in
  both themes — so the pills vanished into the box and only their text and
  glyphs showed. `elevated` is the surface the theme defines to sit above
  `muted`; `resolveTagInputChip` adds it, and only there. Outline chips and an
  armed chip keep their own edge and take nothing.
- **The text field and the suffix are a chip's height tall.** A wrapped line
  holding only the text field would otherwise be shorter than a line of chips,
  and the rows would read as uneven. `h-6.5` / `h-8.5` are the chip heights; a
  test pins the match.
- **The field keeps `min-w-24`, so it drops to a line of its own** instead of
  being squeezed to a sliver beside a long tag. `flex-1` then lets it fill
  whatever the last row has left.
- **Return commits and keeps the keyboard up.** `submitBehavior="submit"`, so
  entering ten recipients is ten Returns rather than ten taps back into the box.
  Delimiters are single characters, a newline always splits (a one-line field
  can only receive one by paste), and a multi-character delimiter is ignored
  rather than half-matched.
- **Rejection precedence is empty, duplicate, invalid, max, and a test pins it.**
  The most specific reason wins: a duplicate typed into a full list says
  "already there", which the user can act on, rather than "full".
- **A piece refused as `invalid` goes back into the field.** It is the one
  refusal the user can fix by editing. A duplicate, an empty or an over-limit
  piece has nothing to fix and is dropped. One refusal in a paste never drops
  the pieces around it.
- **The draft is written before a commit is reported.** A refused piece going
  back into the field fires `onInputValueChange`; were that to run after
  `onReject`, a caller clearing its hint on input change would wipe the hint
  `onReject` had just set — which the email demo did on device. `onReject` is
  the last thing a caller hears.
- **Backspace arms, then removes.** On an empty field the first press turns the
  last chip soft destructive — `Chip`'s own tone, so no colour is invented — and
  a second removes it. One stray press never deletes a tag. Any other key, a
  text change, a blur or a removal disarms.
- **Backspace is read from `onKeyPress`, which is reliable only on an empty
  field — the only case this needs.** On Android some soft keyboards send no key
  event for Backspace on an empty field at all; on those the chip's remove
  control and its `remove` action are the way to delete. A sentinel character
  kept in the field to catch the deletion was rejected: it fights a controlled
  `inputValue` and hides the placeholder.
- **Overflow is invalid, not refused, when `allowOverflow` is on.** The list can
  then be over `max`, and the box takes the invalid chrome and the counter turns
  destructive until it is not. A controlled list that arrives already over `max`
  is marked the same way.
- **The field is hidden when there is nothing it could do.** Read-only always;
  full without overflow; disabled once there are tags. A disabled empty field
  keeps its faded placeholder so the box does not read as a blank bar.
- **The placeholder shows only while there are no tags.** Beside a chip it
  would read as a value.
- **A tag is one accessibility element with a `remove` action.** The chip is
  `accessible`, named by its text, and offers `remove` labelled
  `removeAccessibilityLabel(tag)` — VoiceOver's Actions rotor, TalkBack's
  actions menu. The visible close glyph still takes a tap. Adds, removals and
  refusals are announced through `announce`, an injectable seam defaulting to
  `AccessibilityInfo.announceForAccessibility`; `rejectMessages` overrides the
  wording per reason.
- **The tag count rides on the field's `accessibilityValue`.** A container
  `View` cannot carry a label without folding the chips into it on iOS, so the
  count is read with the field instead: "Recipients, 3 tags".
- **Haptics are one per commit, and the warning is throttled.** `selection` on
  add, `light` on remove and on arming, `warning` on refusal — at most once per
  `REJECT_HAPTIC_INTERVAL_MS`, so a paste refused ten times buzzes once. An
  `empty` Return is reported and announced but does not buzz: nothing is wrong
  with the list.
- **Motion is a 150ms layout transition and a 120ms zoom in.** Each chip sits in
  an `Animated.View` so the row reflows as tags come and go. Calm motion
  (`useCalmMotion`) drops all of it.
- **Keys are text plus occurrence, never the index.** An index key would give
  every chip after a removed one a new identity, and the layout transition
  would remount them rather than slide them.
- **`renderTag` replaces the chip; there is no `TagInput.Tag` part.** One
  function is the smaller surface, and it is handed the index, armed state,
  removability and a `remove` — `useTagInput()` covers anything else.
- **The three state axes follow `Input`'s ladder.** Own prop, then the
  enclosing [`Field`](../field/AGENTS.md); `Field.Label`'s text names the field,
  and the field registers its focus as the `Field`'s press, so tapping the label
  focuses it. The box is a `Pressable` with `feedback="none"` for the same
  reason as `Input.Group`: a tap between chips must reach the field.
- **Every part derives its `testID` from the root's** — `-input`,
  `-tag-${index}`, `-tag-${index}-remove`, `-clear`, `-count` — so a flow can
  type, remove and clear with one id passed.
- **Not `Combobox`.** There is no suggestion list. Picking from options with an
  escape hatch for a custom value is `Combobox` with `allowCustomValue`; this is
  entry first.
