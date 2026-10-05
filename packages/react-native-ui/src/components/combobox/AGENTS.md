# Combobox

A text field that filters a long or remote list as you type, then commits a
choice — from a bottom sheet. Single selection (radio semantics) or multiple
(checkbox semantics, with chips). Root plus `Combobox.Item`, `Combobox.Group`,
`Combobox.Trigger` and `Combobox.Empty`.

`import { Combobox } from "@delacour/react-native-ui/combobox";`

The subpath statically imports `BottomSheet`, so an app importing it installs
the optional `@delacour/react-native-bottom-sheet` peer and mounts
`BottomSheetProvider` once — the requirement every picker places on the sheet
engine.

**Select or Combobox?** `Select` is a short, known set, searchable at most.
`Combobox` is a long or remote one: the search field is the point, it is
focused on open, the filter can be yours or a server's, matches are bold, and
typed text can become a value.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/combobox` |
| `combobox.tsx` | Root + the `Object.assign` surface; selection and query state, the sheet, the list, the Done footer |
| `combobox-trigger.tsx` | `Combobox.Trigger` — Select's box with the label, or wrapping chips; a clear button; the turning chevron; `asChild` |
| `combobox-item.tsx` / `combobox-group.tsx` | Prop-only markers; render `null` |
| `combobox-empty.tsx` | `Combobox.Empty` — replaces the empty line inside the sheet |
| `combobox-chip-row.tsx` | Internal: the selection as chips, with a `+N` cap and the pending-remove colour |
| `combobox-create-row.tsx` | Internal: the `Use “query”` row |
| `combobox.collect.ts` | `collectComboboxOptions` — reads the markers into the `options` shape |
| `combobox.context.tsx` | `ComboboxProvider`, `useCombobox()`, `useComboboxContext()`, `useComboboxPart()` |
| `combobox.types.ts` | `ComboboxOption`, `ComboboxOptionGroup`, `ComboboxEntry`, `ComboboxFilter`, `ComboboxListRow`, … |
| `combobox.filter.ts` | Pure: normalise, match, filter, create row, highlight ranges, pending remove, query reset, announcement, remembered selection |
| `combobox.variants.ts` | Pure: the added slots, the trigger class, chip size / colour / cap, trigger text, the keyboard-aware sheet cap |
| `*.test.ts` | |

## Design

- **Select's leaves, not a fork of Select.** The trigger box is
  `resolveSelectTriggerClass`, the rows are `SelectOptionRow`, the headings and
  row metrics are `selectVariants`, selection is `toggleSelection` /
  `resolveSelectRowState`, folding is `normalizeSearchText`, and the sheet cap
  is `resolveSelectSheetMaxHeight` — all imported from `../select/*` leaf
  modules, never from `../select`'s index. A combobox under a select under a
  text field is one column of the same control, and a fix to one is a fix to
  all three. The chevron is the one piece copied: Select keeps its own private,
  and consolidating the pickers' triggers is the README's follow-up.
- **Sheet only.** `presentation` is `"sheet"`, a union of one, and grows an
  anchored member once the library has a popover. Nothing here assumes one.
- **The search field is focused once the sheet has settled, never with it.**
  `onIndexChange` with an index of 0 or more is the settle; focusing earlier
  raises a keyboard that fights the sheet's own rise for the same space.
  `openOnFocus={false}` opens without the keyboard.
- **The query belongs to the sheet.** Every way of finishing with the list — a
  pick, the clear button, a close — empties it, and `onInputValueChange`
  reports why (`select`, `clear`, `close`; typing is `type`). A single pick
  does not leave the label in the field: the trigger shows the choice, and a
  reopened sheet filtered to the one row already chosen would hide the rest.
  `resolveQueryReset` reports nothing for a query already empty.
- **Three filters, as a union.** `default` folds case and accents and matches a
  substring of the label, then of `keywords`; `custom` gets the raw option and
  the raw query; `none` shows `options` as given, for a server. Filtering is a
  `useMemo` over a flat list and the list is virtualised, and the result list
  never animates — filtering at typing speed must not.
- **Highlight ranges are over the original label.** `getHighlightRanges` folds
  the label one code point at a time with a map back to the original, so "ecl"
  bolds "Écl" in "Éclair" — the whole accented letter, its combining mark too —
  and a surrogate pair is never split. `highlight={false}` turns it off; a row
  with `content` draws what it was given.
- **A selection survives the list changing under it.** A server-driven list
  drops a picked option on the next keystroke, so each pick is remembered
  (value and label) and `resolveSelectedComboboxOptions` reads the list, then
  that memory, then — with `allowCustomValue` — the value as its own label. A
  value with none of the three is skipped, never shown as a raw id.
- **Custom values are the typed text, trimmed.** The create row leads the list
  and only appears when nothing's label is exactly the query (after folding)
  and the text is not already chosen. Callers that need to tell a custom value
  from an option compare against `options`.
- **Backspace removes a chip in two presses.** In multiple mode, Backspace in an
  empty search field marks the last chip destructive; a second removes it; any
  other key or a blur clears the mark. One press removing a chip would cost a
  choice to someone who held the key a beat too long. Android's soft keyboard
  does not report Backspace on an empty field on every IME; the chips' own
  remove controls are the path that always works.
- **Chips are Chip.** Imported from `../chip` (README decision 4). `sm` at field
  sizes `sm`/`md`, `md` at `lg`, so the box's padding shows around them. Each
  remove control is labelled "Remove {label}". On the trigger the chips sit
  inside the trigger's button, so a screen reader hears "N selected" there and
  removes chips from the sheet's chip row, where each chip is its own element.
- **The chip trigger is Input's multiline box.** With chips the fixed height
  becomes a floor, the vertical padding returns and the row aligns to the first
  line, so wrapped chips grow the field the way a textarea grows. The chip row
  grows from an auto basis, not `flex-1`'s zero one, which collapsed every chip
  to nothing inside a shrink-wrapped parent. Past
  `maxVisibleChips` (3) the last slot becomes a `+N`; a count rather than a
  measured two-line limit, because measuring would lay every chip out once to
  throw most of them away.
- **Touches inside the sheet are claimed for the keyboard's sake.** Every
  `Pressable` is a Gesture Handler tap, invisible to React Native's responder
  system, so the `keyboardShouldPersistTaps="handled"` list took the touch as
  unhandled and blurred the search field: the keyboard dropped under the clear
  button, a chip removal, and every multiple-mode pick. The clear button, the
  sheet's chip row and multiple mode's rows sit in a view whose
  `onStartShouldSetResponder` returns true. A single pick closes the sheet, so
  its rows let the keyboard go.
- **The sheet's cap takes the keyboard out.** The engine lifts the sheet by the
  keyboard's height, and Select's cap assumes an empty screen, so with the
  search field focused a long list rose under the status bar.
  `resolveComboboxSheetMaxHeight` caps the list at the room between the
  keyboard and the top inset (less Select's gap) while one is up. Passing the
  engine a `topInset` instead was tried and rejected: it shrinks the frame, and
  the scrim with it, leaving the status bar uncovered.
- **The cap expects the keyboard before it arrives.** The search field focuses
  as the sheet settles, so the sheet sized itself for an empty screen and the
  keyboard's lift then carried its top under the Dynamic Island for a few
  frames — `useKeyboardState` and even `useKeyboardHandler`'s `onStart` land a
  frame too late to stop it. With `openOnFocus`, `resolveExpectedKeyboardHeight`
  feeds the cap the keyboard it will get: the live height once one is up, else
  the last one seen, else `COMBOBOX_KEYBOARD_ESTIMATE_FRACTION` (0.42) of the
  window.
- **Closing blurs the search field first.** Done, the scrim, the close button
  and a single pick all `blur()` before the sheet leaves, so the keyboard goes
  down with it rather than lingering over the screen for a beat.
- **The chevron carries `${testID}-chevron`.** A tap on the trigger's centre
  can land in a chip's remove hit slop; tests and capture flows open a
  multiple-mode trigger from the chevron instead.
- **Chips enter, leave and close gaps in 150ms; calm motion drops it all.**
- **The result count is announced, not just shown.** Android reads the
  `accessibilityLiveRegion="polite"` line under the field; iOS has no live
  regions, so the root posts the same text with `announceForAccessibility`.
  Nothing is announced before something is typed.
- **Haptics.** A row press plays `selection` (Pressable's); reaching or being
  refused at `maxSelected` plays `warning`; removing a chip plays `light`. None
  on typing.
- **State follows Select's ladder.** `isInvalid` and `isDisabled` are own prop,
  then the enclosing `Field`; the combobox registers its `open` with the field
  and reads `Field.Label` as its name, sheet title and search label. Read-only
  shows the chips without remove controls and never opens.
