# Select

A closed set of choices behind a field-shaped trigger, picked from a bottom
sheet. Single selection (radio semantics) or multiple (checkbox semantics).
Root plus `Select.Item`, `Select.Group` and `Select.Trigger`.

`import { Select } from "@delacour/react-native-ui/select";`

The subpath statically imports `BottomSheet`, so an app importing it installs
the optional `@delacour/react-native-bottom-sheet` peer and mounts
`BottomSheetProvider` once — the same requirement `chart` places on the charts
engine. An app that imports no picker still never resolves it.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/select` |
| `select.tsx` | Root + the `Object.assign` surface; selection state, the sheet, the list, the Done footer |
| `select-trigger.tsx` | `Select.Trigger` — Input's box with the value and a turning chevron, or `asChild` to donate the press |
| `select-item.tsx` | `Select.Item` — a prop-only marker; renders `null` |
| `select-group.tsx` | `Select.Group` — the same, for a titled run |
| `select-option-row.tsx` | The row leaf: label, description, leading icon, trailing check or box. Reads no context — `Combobox` draws it too |
| `select.collect.ts` | `collectOptions` / `findChildOfType` — reads the markers into the `options` shape |
| `select.context.tsx` | `SelectProvider`, `useSelect()`, `useSelectContext()`, `useSelectPart()` |
| `select.types.ts` | `SelectOption`, `SelectOptionGroup`, `SelectRowOption`, `SelectEntry`, `SelectListRow`, `SelectHighlightRange` |
| `select.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `select.variants.test.ts`, `select.collect.test.ts` | |

## Design

- **Variants**: `primary`, `secondary`. **Sizes**: `sm`, `md`, `lg` — Input's,
  for the trigger, and ListGroup's row floors for the rows.
- **The trigger is Input's box, not a copy of it.** `resolveSelectTriggerClass`
  hands the axes to `resolveInputGroupClass`, the same row a decorated field
  wears, and the `trigger` slot adds nothing to it. The test sweeps every
  variant, size and state and asserts every utility of the field's box is on the
  trigger, so a select under a text field in a form cannot drift a pixel from it.
- **Rows are drawn from data, never from live children.** `Select.Item` and
  `Select.Group` render `null`; the root reads their props with `collectOptions`
  into the shape the `options` prop takes, and both forms meet at
  `normalizeOptions`. A row inside a `FlatList` cannot be an element the caller
  wrote elsewhere in the tree, so this is what makes search and virtualisation
  possible at all. The cost: a marker wrapped in a component of your own is
  invisible to the walk — use `options` for that.
- **Inside, a selection is always a list.** Single mode holds zero or one value;
  `toSelectedValues` converts a controlled value in and the root converts back
  on the way out, so `onValueChange` is `string | null` or `string[]` by mode and
  the types narrow on `selectionMode`. One representation means one
  `toggleSelection`, one row-state resolver and one trigger-text resolver
  instead of two of each.
- **`toggleSelection` says what happened, not just the result.** `blocked` and
  `limit-reached` are what trigger the warning haptic; `unchanged` is a second
  press on the chosen row of a non-clearable single select, which still closes
  the sheet. A duplicate in the incoming list is collapsed, so a bad controlled
  value cannot double a row.
- **A duplicate value is dropped, first wins.** Two rows answering to one value
  would select together and could never be told apart.
- **Headings are derived from what is left.** `buildSelectRows` puts a heading
  before each run sharing a group, so a group emptied by search — or declared
  empty — draws no heading over no rows, with no special case.
- **Search folds case and accents.** `matchesQuery` strips combining marks after
  `NFD`, so "oster" finds "Österreich". It is defined here once; `Combobox`
  imports it. The field is never auto-focused — a keyboard rising with the sheet
  would cover the rows it is meant to filter — and the query clears on every
  close.
- **A disabled option stays in the list**, and stays in search results. It is
  information: that one exists and you cannot have it.
- **The limit disables unchosen rows only.** `resolveSelectRowState` never
  disables a chosen row for `maxSelected`, or the selection could not be undone.
  A row disabled by the limit with no description of its own says "Limit
  reached" (`limitReachedText`).
- **Multiple never closes on a pick.** A sticky `Done` footer closes it; every
  close path — a pick, Done, a swipe, the overlay, the close button — runs
  through one `handleOpenChange`, which is where the query is cleared.
- **The title and search ride at the head of the list.** As
  `ListHeaderComponent` they count towards the content height the sheet sizes
  itself to, and the search field is a `BottomSheet.TextInput`, so the keyboard
  it raises is the sheet's to lift for.
- **A sheet sized to its rows is capped.** `resolveSelectSheetMaxHeight` hands
  the sheet `maxDynamicContentSize` — the lower of 85% of the window and the room
  below the top inset less a 24pt gap — and the list scrolls inside it. Without
  the cap two hundred options measured taller than the screen and the sheet rose
  under the status bar with nothing of the page left above it. An open
  keyboard comes off the cap too — the engine lifts the sheet above it, and a
  full list plus the keyboard reached the top of the screen. The height arrives
  on the JS thread from `keyboardWillShow` while the lift runs on the UI thread,
  so for about a quarter of a second the sheet still overshoots before settling;
  removing that needs the engine to clamp its keyboard lift to
  `maxDynamicContentSize`. `snapPoints` bypasses dynamic sizing, and the cap
  with it.
- **The row floor is ListGroup's**, `min-h-12/14/16`, pinned by the test, so a
  row in the sheet sits level with a `ListGroup` row on the screen behind it. It
  is a floor, never a height, so a description can wrap.
- **Single shows a check, multiple a box.** A trailing check is the native
  idiom for one-of-many; a radio dot would read as a form control. The box is
  drawn with Checkbox's tokens (`border-input bg-card`, filling `bg-primary`)
  rather than by importing `../checkbox`, whose measured, animated box is a
  control of its own and would answer the press the row already answers.
- **The row is a leaf with no context.** `SelectOptionRow` takes the option,
  its state and a press handler, and `highlight` ranges for what a query
  matched (`splitHighlight` cuts the label). `Combobox` draws it from its own
  state, so it must never reach for `useSelect`.
- **The check fades and grows in 120ms; calm motion keeps only the fade.** The
  chevron's half-turn is behaviour — it says which way the control is — so calm
  motion keeps it and swaps the spring for a short timing.
- **The trigger rings while the sheet is open**, through Input's `isFocused`
  axis, so it is clear which field the sheet belongs to. Invalid outranks it,
  as it does on a field.
- **State follows Input's ladder.** `isInvalid` and `isDisabled` are own prop,
  then the enclosing `Field`, as `??` chains so an explicit `false` opts out.
  The select registers its `open` with the `Field`, so tapping the label opens
  the sheet, and reads `Field.Label`'s text as its accessible name and its
  default sheet title.
- **Read-only looks normal and never opens.** The trigger stays enabled for a
  screen reader — it is not disabled, it is fixed — with no press feedback, and
  `open` refuses.
- **The trigger is a button.** React Native has no combobox role that works on
  both platforms, so it is `button` with the choice as its `accessibilityValue`,
  `expanded` in its state, and a hint. Rows are `radio` or `checkbox` with
  `selected` or `checked`; a heading is a `header`.
- **Haptics.** A row press plays `selection` (Pressable's, on press-in). The
  press that reaches `maxSelected`, or is refused at it, also plays `warning`.
- **`presentation` is a union of one.** `"sheet"` today; an anchored member is
  added once the library has a popover. There is no platform-native picker mode
  — it would need a new native peer.
