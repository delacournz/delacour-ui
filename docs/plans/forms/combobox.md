# Combobox

Status: spec, not started · Wave: 2 · Depends on: Select (leaves `select/select.variants`, `select/select-option-row`, `select/select.types`), Input (`input/input.variants`, `BottomSheet.TextInput`), Chip, Field, BottomSheet (+ optional engine peer). Do not start until Select is merged into cat-forms.

## Purpose on mobile

A text field that filters a list while you type, then commits a choice. Where Select is "pick from a short list", Combobox is "find in a long or remote list": type-ahead, server-driven results, optional free-text values, and (multiple) a row of removable chips. Presents in a `BottomSheet` with a `BottomSheet.TextInput` pinned at the top so the keyboard and list coexist.

## Behaviour reference (summary of features observed; no product name/URL)

- Text field filters options as the user types; client-side by default (case-insensitive substring on label), a custom predicate, or disabled for server-driven matching.
- Single or multiple selection; multiple shows selections as chips and keeps the list open after each pick.
- Separate controlled value and controlled query text.
- Option metadata: description, icon, disabled; groups that collapse when the filter empties them.
- Free-text mode: typed text not in the list can be accepted as a value.
- Clearable field, optional open-on-focus, loading and empty states.
- In multiple mode, Backspace on an empty query first marks the last chip as about-to-remove, then removes it.
- Floating vs inline presentation (here: sheet only for now).

## API

```ts
import type { SelectOption, SelectOptionGroup } from "../select/select.types";

export type ComboboxOption = SelectOption & { keywords?: readonly string[]; icon?: IconComponent };

export type ComboboxFilter =
  | { kind: "default" }                                        // substring on label + keywords
  | { kind: "custom"; match: (option: ComboboxOption, query: string) => boolean }
  | { kind: "none" };                                          // server-driven: show options as given

type ComboboxBaseProps = {
  options?: readonly (ComboboxOption | (Omit<SelectOptionGroup, "options"> & { options: readonly ComboboxOption[] }))[];
  inputValue?: string;                       // controlled query
  defaultInputValue?: string;
  onInputValueChange?: (query: string, reason: "type" | "select" | "clear" | "close") => void;
  filter?: ComboboxFilter;                   // default { kind: "default" }
  placeholder?: string;
  title?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  isInvalid?: boolean; isDisabled?: boolean; isReadOnly?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  openOnFocus?: boolean;                     // default true: tapping the trigger opens the sheet and focuses the input
  allowCustomValue?: boolean;                // adds a "Use “query”" row when no exact match
  createLabel?: (query: string) => string;
  emptyText?: string;
  presentation?: "sheet";                    // grows with Overlays' Popover
  snapPoints?: (string | number)[];
  highlight?: boolean;                       // default true: bold matched range in rows
  className?: string; testID?: string; children?: ReactNode;
};

export type ComboboxSingleProps = ComboboxBaseProps & {
  selectionMode?: "single";
  value?: string | null; defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};

export type ComboboxMultipleProps = ComboboxBaseProps & {
  selectionMode: "multiple";
  value?: readonly string[]; defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  maxSelected?: number;
  chipVariant?: "soft" | "outline";           // Chip variant; default soft
};
export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;
```

Custom values: when `allowCustomValue`, the value is the typed string itself (value === label); callers that need to tell options from customs compare against `options`. Parts: `Combobox.Item`, `Combobox.Group` (declarative markers, same contract as Select), `Combobox.Trigger`, `Combobox.Empty` (replace empty content), `useCombobox()`. displayName `DelacourUI.Combobox*`.

```tsx
<Field>
  <Field.Label>Assignee</Field.Label>
  <Combobox
    options={people}
    value={assignee}
    onValueChange={setAssignee}
    inputValue={query}
    onInputValueChange={setQuery}
    isLoading={isFetching}
    filter={{ kind: "none" }}
    isClearable
  />
</Field>
```

Flow: trigger (field-shaped; single shows label, multiple shows chips wrapping, max 2 lines then "+N") -> `BottomSheet` with `BottomSheet.TextInput` (search icon prefix via `Input.Group`, clear suffix) -> `BottomSheet.FlatList` of `SelectOptionRow` -> multiple: sticky `Footer` with "Done". Single: pick closes the sheet and sets the trigger text; query resets to the selected label (`reason: "select"`).

## Variants & sizes

No new `tv()`. `combobox.variants.ts` is a small leaf with: trigger composition resolvers delegating to `selectVariants`/`inputVariants`, chip-row slots (`chips`, `chipOverflow`), `createRow` slot, and the pure filter/highlight logic below (it has no RN imports). Sizes `sm|md|lg` map to Input tokens; Chip size = `sm` at `sm|md`, `md` at `lg` (pure `resolveComboboxChipSize`, tested). Variants `primary|secondary` as Input.

## States

Default (placeholder) · focused (trigger ring while sheet open; input autofocus once sheet settled, not before, to avoid keyboard fighting sheet animation) · pressed (Input fade) · disabled · readOnly (chips visible, no remove buttons, no open) · invalid (Field cascade) · loading (spinner suffix in search input; rows remain; if no rows, centred Spinner) · empty (`emptyText`, or the create row if `allowCustomValue`) · max reached (unselected rows disabled) · pending-remove chip (destructive tone for the last chip after one Backspace; clears on next keystroke or blur).

## Accessibility

- Trigger: `accessibilityRole="button"`, label from Field, `accessibilityValue.text` from the shared `resolveSelectTriggerText`; `expanded` state.
- Search input: label = Field label + "search"; `accessibilityLiveRegion="polite"` result-count text "N results" / `emptyText` (pure `resolveResultsAnnouncement`).
- Rows: radio/checkbox roles as Select; highlight is visual only (a11y label is the plain label).
- Chips (multiple): each Chip exposes a `remove` accessibility action (Chip's built-in behaviour) labelled "Remove {label}"; trigger announces "{n} selected".
- Sheet is a modal view; close restores focus to trigger.
- Create row: `accessibilityRole="button"`, label "Add {query}".

## Motion & haptics

- Chips enter/exit with layout transition (`LinearTransition`, 150ms) unless calm motion (then no layout animation; instant).
- Haptics (Pulsar worklets): `selection` on pick/toggle, `impactLight` on chip removal, `notificationWarning` when `maxSelected` blocks a pick, none on typing.
- Result list updates without animation (filtering at typing speed must not animate).

## Reuses / new internal pieces / peer deps (none new)

Reuses: `select/select-option-row` + `select/select.variants` + `select/select.types` (internal parts are not on Select's index, so these are file imports; `Select` itself would come from `../select`), `input/input.variants`, `Input.Group` + `BottomSheet.TextInput`, `Chip` (from `../chip`, the house norm — see README decision 4), `useFieldContext`, `BottomSheet` (root file only), `Spinner`, `Icon`, `useControllableState` (x3: value, inputValue), `useCalmMotion`.
New: `combobox.filter.ts` (pure filter + highlight + diacritics normaliser, no RN imports), `combobox.variants.ts`, `combobox.context.tsx`.
Peer deps: none new.

## Files

`packages/react-native-ui/src/components/combobox/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/combobox` |
| `combobox.tsx` | Root + `Object.assign` surface + sheet wiring |
| `combobox-trigger.tsx` | `Combobox.Trigger` (field box; single text or chips) |
| `combobox-item.tsx` / `combobox-group.tsx` | declarative markers |
| `combobox-empty.tsx` | `Combobox.Empty` |
| `combobox-chip-row.tsx` | internal: chips with pending-remove state |
| `combobox-create-row.tsx` | internal: "Use “query”" row |
| `combobox.context.tsx` | `ComboboxProvider`, `useCombobox()`, `useComboboxContext()`, `useComboboxPart()` |
| `combobox.types.ts` | shared prop types |
| `combobox.filter.ts` | pure filter/highlight |
| `combobox.filter.test.ts` | |
| `combobox.variants.ts` / `.test.ts` | |
| `AGENTS.md` | notes; row in package table |

Plus brief checklist: gen-exports, demos, route, docs, registry (PACKAGE_INSTALL for bottom-sheet engine), changeset.

## Pure logic to unit-test

`combobox.filter.test.ts`:
- `normalizeText(s)`: lowercases, NFD-strips diacritics, trims ("Café " -> "cafe"); unicode-safe.
- `matchOption(option, query, filter)`: default matches label, then `keywords`; empty query matches all; whitespace-only = empty; custom predicate called with raw option and query; `none` returns true always.
- `filterItems(items, query, filter)`: preserves order and group membership; drops empty groups; keeps disabled options; selected options remain visible in multiple mode (not hidden).
- `getHighlightRanges(label, query)`: returns `[{start,end}]` over the ORIGINAL string (index mapping survives diacritic stripping — test "Éclair"/"ecl"); case-insensitive; first occurrence only by default (`all: true` option for every); empty query -> []; query longer than label -> [].
- `splitByRanges(label, ranges)`: `{text, isMatch}[]` covering the whole string with no gaps/overlaps.
- `shouldOfferCreate(query, options, selected)`: false for empty/whitespace, true when no exact (normalised) label match, false when already selected (multiple), respects `allowCustomValue`.
- `resolvePendingRemove(state, event)`: Backspace on empty query: idle -> pending(lastIndex); pending + Backspace -> remove; pending + keystroke/blur -> idle; no chips -> no-op.
- `resolveInputValueAfterSelect(mode, option)`: single -> label; multiple -> "" ; `reason` mapping.
- `resolveResultsAnnouncement(count, query, emptyText)`.
`combobox.variants.test.ts`: chip size mapping; trigger chrome equals Select's at every cell; token existence; no `dark:`.

## Playground demos

`apps/playground/src/demos/combobox/`: `single` (hero, capture), `multiple-chips` (capture), `async-server-filter` (simulated fetch, `filter none`, loading; capture), `custom-value` (capture), `grouped-with-descriptions`, `in-field-invalid`. Route `(components)/combobox.tsx`; index row; gen-demos.

## Docs page outline

Install (BottomSheetProvider) · Single · Multiple with chips · Client filtering and custom predicate · Server-driven (`filter none` + `onInputValueChange`) · Custom values · Highlight · In a Field · API · Accessibility · How it differs from Select (long/remote lists vs short sets).

## Out of scope / follow-ups

Anchored popover presentation (after Overlays) · virtualised async pagination/infinite scroll · fuzzy ranking (default stays substring; callers can pass `custom`) · creatable async persistence · tag free-entry with delimiters (that is TagInput).

## Acceptance checklist

- [ ] Imports Select only through leaves; no `../select` or `../chip` root imports; `bun test` import-rule tests pass.
- [ ] `selectionMode` union narrows `onValueChange`.
- [ ] Filtering, highlight and pending-remove tests green.
- [ ] Typing never janks at 1000 rows (FlatList virtualised, memoised rows, filter in `useMemo`).
- [ ] Controlled `inputValue` + `filter none` drives a simulated server list.
- [ ] Keyboard + sheet coexist on iOS and Android (BottomSheet.TextInput registered).
- [ ] Single pick closes, multiple stays + chips update; maxSelected enforced with haptic.
- [ ] Screen reader: result count announced, chip remove action works.
- [ ] Docs, AGENTS.md, exports, demos, registry, changeset done; typecheck + check pass.
