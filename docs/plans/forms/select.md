# Select

Status: spec, not started · Wave: 1 · Depends on: Input (leaf `input.variants`), Field (`field.context`), BottomSheet (+ optional peer `@delacour/react-native-bottom-sheet`), ListGroup/Item (visual parity only), Checkbox/Radio (indicator parity only). Depended on by: Combobox (Wave 2) — which imports Select's option-row leaf and variants.

## Purpose on mobile

A closed-set picker: a field-shaped trigger showing the current choice, which opens a bottom sheet of options. Single selection (radio semantics) or multiple (checkbox semantics). On a phone a sheet beats an anchored dropdown: full-width touch targets, thumb reach, no keyboard overlap. Select owns the **option row** and `select.variants.ts`, the shared leaf Combobox later reuses.

## Behaviour reference (summary of features observed; no product name/URL)

- Trigger field that opens a picker; presentation modes: bottom sheet (default), inline expansion, floating anchored overlay.
- Options with value + label, optional description/icon, disabled options that stay visible.
- Groups with a heading; heading announced as a header to screen readers.
- Optional search field inside the picker to filter long lists; matches case-insensitively; groups emptied by the filter disappear; query clears when the picker closes; search is not auto-focused (keyboard would cover options).
- Selected label is derived from the selected option, or supplied explicitly.
- Disabled trigger; empty-search state; virtualised long lists.
- Single and multiple selection; multiple keeps the picker open.

Decisions for this library: only `sheet` today (category rule 1: no Popover yet); `presentation` is a discriminated prop so `"popover"` can be added once Overlays merges. No "native picker" mode (would need a new peer dep — see open questions).

## API

```ts
export type SelectOption = {
  value: string;                 // unique within the list
  label: string;                 // plain string: used for trigger text, a11y, filtering
  description?: string;
  isDisabled?: boolean;
};

export type SelectPresentation = "sheet"; // grows: | "popover" once Overlays ships

type SelectBaseProps = {
  options?: readonly (SelectOption | SelectOptionGroup)[]; // data-driven shortcut; OR compose <Select.Item>
  placeholder?: string;
  title?: string;                // sheet title; defaults to Field label when present
  variant?: "primary" | "secondary";   // = InputVariant
  size?: "sm" | "md" | "lg";           // = InputSize
  isInvalid?: boolean;           // nearest wins: own -> Field
  isDisabled?: boolean;
  isReadOnly?: boolean;          // trigger shows value, never opens
  isLoading?: boolean;           // spinner in trigger suffix, sheet shows Spinner row
  isSearchable?: boolean;        // default false; true when options.length > 15 is a caller decision, not magic
  searchPlaceholder?: string;
  emptyText?: string;            // "No results"
  presentation?: SelectPresentation;
  snapPoints?: (string | number)[]; // forwarded to BottomSheet; default dynamic sizing
  renderValue?: (selected: SelectOption[]) => ReactNode; // custom trigger content
  className?: string;
  testID?: string;
  children?: ReactNode;          // Select.Item / Select.Group
};

export type SelectSingleProps = SelectBaseProps & {
  selectionMode?: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  isClearable?: boolean;          // tapping the selected row again clears (default false)
};

export type SelectMultipleProps = SelectBaseProps & {
  selectionMode: "multiple";
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  maxSelected?: number;           // further rows disabled once reached
  closeOnSelect?: false;          // multiple never auto-closes; footer "Done" closes
};

export type SelectProps = SelectSingleProps | SelectMultipleProps;

export type SelectItemProps = SelectOption & { icon?: IconComponent; className?: string; children?: ReactNode };
export type SelectGroupProps = { label: string; children: ReactNode };
export type SelectOptionGroup = { label: string; options: readonly SelectOption[] };

export function useSelect(): SelectContextValue; // throws outside Select
```

Pattern B: `function SelectRoot(...)` + `Object.assign(SelectRoot, { Item: SelectItem, Group: SelectGroup, Trigger: SelectTrigger, displayName: "DelacourUI.Select" })`. Every part and provider carries a `DelacourUI.Select*` displayName.

Anatomy:

```tsx
<Field isInvalid={!!error}>
  <Field.Label>Country</Field.Label>
  <Select value={country} onValueChange={setCountry} placeholder="Choose" isSearchable>
    <Select.Group label="Oceania">
      <Select.Item value="nz" label="New Zealand" />
      <Select.Item value="au" label="Australia" description="Includes territories" />
    </Select.Group>
  </Select>
  <Field.Error>{error}</Field.Error>
</Field>

<Select selectionMode="multiple" options={flatOptions} value={tags} onValueChange={setTags} />
```

`Select.Trigger` is rendered automatically; compose it explicitly only to replace the trigger (`asChild`-style children). Root renders `BottomSheet` + `BottomSheet.Trigger asChild` around the trigger, `BottomSheet.Portal` with `Overlay`, `Container`, a header (`Title`, `Close`), optional `BottomSheet.TextInput` (search) and `BottomSheet.FlatList` (virtualised) of rows.

Item registry: when children (`Select.Item`) are used, the root walks them (`Children` traversal in a pure `collectOptions` helper accepting resolved props) to build the option list; data-driven `options` is the same list shape. Rows are rendered from the normalised list, never from live children inside the FlatList, so filtering and virtualisation work.

## Variants & sizes

`select.variants.ts` (NO react-native imports), slotted `tv()`:

- Slots: `trigger` (reuses Input's box via `inputVariants` root slot through `resolveInputFieldClass`-equivalent — import `../input/input.variants`, do not restate chrome), `value`, `placeholder`, `chevron`, `row`, `rowContent`, `rowLabel`, `rowDescription`, `rowIndicator`, `groupHeading`, `empty`, `sheetBody`.
- Axes: `variant` (`primary|secondary`), `size` (`sm|md|lg` — trigger height/text from `--spacing-input-*`/`--text-input-*`; row min-height from ListGroup's row metrics so a Select row sits level with a ListGroup row), booleans `isSelected`, `isDisabled`, `isInvalid`, `isFocused` (trigger focus ring while sheet is open), `isPressed` handled by Pressable feedback (`fade` on rows).
- Row indicator: single = trailing `IconCheckmark` for the selected row (no radio dot; check is the native idiom); multiple = trailing Checkbox-styled box (draw with the same tokens as Checkbox, do not import `../checkbox` — only leaf `../checkbox/checkbox.variants` if needed).
- Semantic tokens only: `bg-popover`, `text-popover-foreground`, `text-muted-foreground`, `border-input`, `bg-accent` for selected row tint, `text-destructive` for invalid. No `dark:`.
- Pure resolvers exported: `resolveSelectTriggerText`, `resolveSelectRowState`, `toggleSelection`, `normalizeOptions`, `filterOptionsByQuery` is NOT here (Combobox owns highlight/filter; Select's simple search reuses a tiny `matchesQuery` in `select.variants.ts`—see Combobox spec; Combobox imports it, so define it once here).

## States

- Default: placeholder in `text-muted-foreground`.
- Pressed (trigger): Input-style `fade`; focused ring (`border-ring`) while sheet open.
- Disabled: trigger faded, never opens, `accessibilityState.disabled`. Row disabled: faded, press ignored, not announced as selectable.
- Invalid: border/chevron destructive (Field cascade; `isInvalid={false}` opts out).
- ReadOnly: normal look, no chevron press response, does not open.
- Loading: trigger suffix `Spinner` replaces chevron; sheet body shows centred Spinner when `options` is empty and `isLoading`.
- Empty: `emptyText` row when filter yields nothing (or no options).
- Selected row: tint + check; multiple at `maxSelected`: unselected rows disabled with description fallback "Limit reached".

## Accessibility

- Trigger: `accessibilityRole="button"` (RN has no combobox role that works on both platforms), `accessibilityLabel` = `Field` label (`field.label`), `accessibilityValue={{ text: resolveSelectTriggerText(...) }}`, `accessibilityHint="Opens a list of options"`, `accessibilityState={{ expanded: isOpen, disabled }}`. Registers `registerPress` with Field so tapping label opens.
- Rows: single = `accessibilityRole="radio"`, multiple = `"checkbox"`, both with `accessibilityState={{ selected|checked, disabled }}`. Group heading `accessibilityRole="header"`.
- Sheet is a modal view labelled by `BottomSheet.Title`; focus moves into sheet; closing restores trigger focus (engine does this).
- Multiple trigger text: "3 selected" when more than `maxLabels` (default 2 labels, then count) — string via pure resolver, localisable through `formatSelectedCount?: (n) => string`.
- Search input labelled `searchPlaceholder`; result count announced via `accessibilityLiveRegion="polite"` on the empty/count text.

## Motion & haptics

- Sheet motion is the engine's. Row selection: `selection` Pulsar preset (worklet, passed as-is) on change; multiple toggles likewise. Max reached: `notificationWarning` preset once.
- Chevron rotates 180deg while open (Reanimated shared value; behavioural, so not suppressed by `useCalmMotion`; only the spring becomes a timing under calm motion).
- Check indicator fades/scales in 120ms; calm motion: opacity only.

## Reuses / new internal pieces / peer deps (none new)

Reuses: `Input` variants (leaf `../input/input.variants`), `useFieldContext` (`../field/field.context`), `BottomSheet` (`../bottom-sheet`, only from `select.tsx` root), `Pressable`, `Text`, `Icon` (`IconChevronDownSmall`, `IconCheckmark`, `IconMagnifyingGlass` from `icons/central`), `Spinner`, `Separator`, `useControllableState`, `useCalmMotion`.
New internals: `select-option-row.tsx` (leaf, reused by Combobox: pure presentational row taking `option`, `isSelected`, `mode`, `isDisabled`, `onPress`, `size`, `highlight?: HighlightRange[]`), `select.variants.ts`, `select.context.tsx`.
Peer deps: none new. Needs the already-optional `@delacour/react-native-bottom-sheet`; consumers mount `BottomSheetProvider` (docs call this out).

## Files

`packages/react-native-ui/src/components/select/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/select` |
| `select.tsx` | Root, `Object.assign` surface, sheet wiring |
| `select-trigger.tsx` | `Select.Trigger` |
| `select-item.tsx` | `Select.Item` (declarative option marker; renders null, read by `collectOptions`) |
| `select-group.tsx` | `Select.Group` marker |
| `select-option-row.tsx` | Leaf row, imported by Combobox |
| `select.context.tsx` | `SelectProvider`, `useSelect()`, `useSelectContext()`, `useSelectPart()` |
| `select.types.ts` | Option/Group/union prop types shared by 2+ parts |
| `select.variants.ts` | `tv()` + resolvers |
| `select.variants.test.ts` | |
| `AGENTS.md` | Design notes; add row to package AGENTS.md Components table |

Plus the checklist items from the brief: `bun run gen-exports`, demos, route, docs mdx + meta.json, registry (`ITEM_META`, `PACKAGE_INSTALL` includes bottom-sheet engine) + `bun --filter delacour run registry:build`, changeset (minor: `@delacour/react-native-ui`, `delacour`).

## Pure logic to unit-test (`select.variants.test.ts`)

- `toggleSelection(current, value, {mode, max, isClearable})`: single selects; single re-press keeps unless clearable (then null); multiple adds/removes, preserves insertion order, ignores add at `max`, never duplicates.
- `normalizeOptions(optionsOrGroups)`: flattens groups into `{ groupLabel?, option }[]`; rejects/dedupes duplicate values (first wins); empty groups dropped.
- `resolveSelectTriggerText`: null -> undefined (placeholder); single -> label; multiple 0/1/2 -> joined labels; >maxLabels -> `formatSelectedCount(n)`; unknown value -> skipped.
- `matchesQuery(label, query)`: case-insensitive, trims, diacritics-insensitive (`normalize("NFD")` strip marks), empty query matches all.
- `filterGroups(items, query)`: removes groups with zero matches; keeps disabled options.
- `resolveSelectRowState`: disabled by option, by `maxSelected` reached (only unselected rows), selected row never disabled by max.
- Slot hygiene (mirror Input/Field tests): `trigger` chrome equals Input's `root` chrome cell for cell at every variant x size; no `text-*`/`font-*` on `row` slot; no `h-*` on rows; every token named exists in both themes; no `dark:`.

## Playground demos

`apps/playground/src/demos/select/` (4–6, `capture` marked): `single` (hero, capture), `multiple` (capture), `grouped-searchable` (capture), `in-field` (Field label, error state; capture), `disabled-and-loading`, `data-driven` (options prop, 200 items virtualised). Route `(components)/select.tsx`; index row; `bun run gen-demos`.

## Docs page outline

`apps/web/content/docs/native/components/select.mdx`: Install (+ BottomSheetProvider note) · Usage · Single vs multiple · Groups · Searchable · Data-driven `options` · In a Field · Custom trigger · Controlled/uncontrolled · API (Select, Item, Group, hook) · Accessibility · Presentation roadmap.

## Out of scope / follow-ups

- Anchored popover / inline presentation (after Overlays Popover merges); `presentation` union grows.
- Platform native picker (`@react-native-picker`-style): needs new peer, breaks catalog rule — not planned.
- Async option loading/pagination (Combobox covers query-driven).
- Creatable options (Combobox `allowCustomValue`).

## Acceptance checklist

- [ ] Types: `selectionMode` discriminated union; `onValueChange` type narrows per mode; no `any`.
- [ ] `select.variants.test.ts` green; `bun test` full suite green (incl. display-name and docs tests).
- [ ] Trigger visually identical to `Input` at all variants/sizes on simulator; opens sheet; row select closes (single) / stays (multiple).
- [ ] Field cascade (invalid/disabled), label tap opens, a11y label from Field.
- [ ] Search filters, hides empty groups, clears on close, not auto-focused; keyboard does not cover rows (BottomSheet.TextInput).
- [ ] 200-row list scrolls virtualised inside the sheet.
- [ ] VoiceOver + TalkBack roles/states verified.
- [ ] Calm motion verified; haptics fire.
- [ ] AGENTS.md, package table row, gen-exports, demos, route, docs, registry, changeset done; typecheck + check pass.
