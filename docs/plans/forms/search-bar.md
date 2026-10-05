# SearchBar

Status: spec, not started · Wave: 1 · Depends on: Input (+ `Input.Group` Prefix/Suffix), Button (cancel action), Icon, Spinner, Field (optional), Chip (optional tokens)

## Purpose on mobile

The query field at the top of a list or screen: search icon, clear button, optional Cancel that dismisses the keyboard, debounced change reporting. It is a field, not a results surface: results are the caller's list. A thin opinionated layer over `Input.Group` so every list in an app searches the same way.

## Behaviour reference (summary of features observed; no product name/URL)

- Text field with built-in clear button and an optional Cancel button (shown never / on focus / always).
- Debounced change callback for expensive queries; Return key flushes a pending debounce immediately.
- Clearing keeps the keyboard open and focus; Cancel clears, blurs and closes the keyboard.
- Loading indicator replaces the clear button while a query runs.
- Optional tokens (selected filters) shown inside the field, scrolling horizontally, capped to a share of the width.
- An optional floating results panel with sections, rows, row actions and empty/loading states; panel opens upward to avoid the keyboard; touches inside the panel keep field focus.
- Visual variants and shapes.

Decision: the results panel is **not** built (would need anchored overlay -> Overlays category, unmerged). The caller renders results in their own list/screen; `onFocusChange`/`isFocused` lets them swap content. Tokens ARE built (Chip-based) since filters-as-chips is a common mobile pattern. A panel/popover result surface is a follow-up.

## API

```ts
export type SearchBarCancelMode = "never" | "focus" | "always";

export type SearchBarProps = Omit<InputProps, "value" | "defaultValue" | "onChangeText" | "variant" | "size" | "multiline" | "ref"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;          // every keystroke
  debounce?: number;                                // ms, default 0 (off)
  onDebouncedChange?: (value: string) => void;      // fires `debounce` ms after last change; also on submit, and on clear (immediately)
  onSubmit?: (value: string) => void;               // keyboard "search" key; flushes debounce
  onClear?: () => void;
  onCancel?: () => void;
  cancel?: SearchBarCancelMode;                     // default "focus"
  cancelLabel?: string;                             // default "Cancel"
  variant?: "primary" | "secondary";                // default "secondary" (filled, no heavy border)
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "pill";                       // default "pill"
  isLoading?: boolean;                              // Spinner replaces clear
  isDisabled?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  tokens?: readonly SearchBarToken[];
  onTokenRemove?: (token: SearchBarToken) => void;
  placeholder?: string;                             // default "Search"
  clearAccessibilityLabel?: string;                 // default "Clear search"
  className?: string; testID?: string;
  ref?: Ref<SearchBarHandle>;
};

export type SearchBarToken = { id: string; label: string; icon?: IconComponent };
export type SearchBarHandle = { focus(): void; blur(): void; clear(): void };
export function useSearchBar(): SearchBarContextValue;  // { value, isFocused, clear, cancel } — for custom parts
```

Pattern B: `function SearchBarRoot` + `Object.assign(SearchBarRoot, { Token: SearchBarToken?, Cancel, displayName: "DelacourUI.SearchBar" })`. Parts: `SearchBar.Cancel` (the cancel action, replaceable via children), `SearchBar.Token` is NOT a part (tokens are data via `tokens`; avoids a second composition model). Root renders by default; parts exist for override:

```tsx
<SearchBar value={q} onValueChange={setQ} debounce={300} onDebouncedChange={runSearch} cancel="focus" />

<SearchBar.Root ...>            // not exported; shown for anatomy
  Input.Group (variant, size, shape-corner)
    Input.Group.Prefix  <Icon IconMagnifyingGlass/>
    [tokens ScrollView horizontal of Chip(size sm) w/ onClose]
    Input (flex-1, returnKeyType="search", clearButtonMode="never")
    Input.Group.Suffix  Spinner | clear Pressable <Icon IconCircleX/>  (only when value non-empty)
  Cancel  <Button variant="ghost">Cancel</Button>   (animated width/opacity in/out)
```

## Variants & sizes

`search-bar.variants.ts` (no RN imports): slotted `tv()` slots `root` (row: field + cancel, `flex-row items-center gap-2`), `field` (adds the shape corner on top of Input's box via `className`), `tokens` (max width share `max-w-[60%]`), `cancel`, `clear`. Axes: `shape` (`pill` -> `rounded-full`, `rounded` -> Input's own corner = no override), `size` (passes through to Input; clear/prefix icon step from `INPUT_DECORATOR_ICON_*` — reuse, do not restate), `variant` passes through. `resolveSearchBarClearVisibility`, `resolveSearchBarCancelVisibility`. Do NOT give the group chrome of its own (Input AGENTS rule).

## States

Default · focused (Input focus ring; Cancel shown per mode) · pressed (clear: `fade`) · disabled (no input, no clear/cancel) · invalid (Field cascade; rare) · loading (Spinner, clear hidden) · filled (clear visible) · with tokens (clear also clears tokens? No: clear clears text only; tokens removed individually; Backspace on empty text removes last token via `onTokenRemove`) · readOnly (`editable=false`).

## Accessibility

- Input `accessibilityRole="search"` (iOS supported; Android falls back harmlessly), label from Field `field.label` else `placeholder`.
- Clear: role `button`, label `clearAccessibilityLabel`, `accessibilityHint` none, hit slop 8. Cancel: role `button`.
- Loading announces via `accessibilityState={{ busy: true }}` on the field.
- Tokens: Chip's own `remove` accessibility action.
- `returnKeyType="search"`, `autoCapitalize="none"`, `autoCorrect={false}`, `enterKeyHint="search"`, `inputMode="search"` defaults overridable.
- Hide Cancel from the a11y tree when invisible (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`).

## Motion & haptics

- Cancel slides/fades in (width via Reanimated `useAnimatedStyle`, 200ms ease-out) on focus; layout of the field shrinks smoothly. Calm motion: opacity-only fade, no width animation (width snaps).
- Clear button fades 100ms. Spinner swap is instant.
- Haptics: `selection` on Cancel press; none on clear (frequent) or typing.

## Reuses / new internal pieces / peer deps (none new)

Reuses: `Input` + `Input.Group` + decorators (`../input`), `Button` from `../button` for Cancel (`variant="ghost"`; index imports are the house norm — README decision 4), `Chip` from `../chip`, `Spinner` from `../spinner`, `Icon`, `useControllableState`, `useFieldContext`, `useCalmMotion`, Reanimated.
New: `use-debounced-callback.ts` hook in `hooks/` only if no equivalent exists (check; else colocate `search-bar.debounce.ts` pure timing helper), `search-bar.variants.ts`.
Peer deps: none new.

## Files

`packages/react-native-ui/src/components/search-bar/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/search-bar` |
| `search-bar.tsx` | Root + `Object.assign` surface; wiring of debounce/focus/cancel |
| `search-bar-cancel.tsx` | `SearchBar.Cancel` |
| `search-bar-clear.tsx` | internal clear button (may be exported as `SearchBar.Clear`) |
| `search-bar-tokens.tsx` | internal horizontal token row |
| `search-bar.context.tsx` | `SearchBarProvider`, `useSearchBar()`, `useSearchBarContext()`, `useSearchBarPart()` |
| `search-bar.types.ts` | token/handle/cancel types |
| `search-bar.variants.ts` / `.test.ts` | slots + pure resolvers |
| `search-bar.debounce.ts` / `.test.ts` | pure debounce state machine (timer injected) |
| `AGENTS.md` | notes; package table row |

Plus: gen-exports, demos, route, index row, gen-demos, docs mdx + meta.json, registry (ITEM_META; no new PACKAGE_INSTALL), changeset.

## Pure logic to unit-test

- `resolveSearchBarClearVisibility({value, isFocused, isLoading, isDisabled, isReadOnly})`: true only when value non-empty, not loading/disabled/readOnly.
- `resolveSearchBarCancelVisibility(mode, {isFocused, hasValue})`: `never` false; `always` true; `focus` = isFocused.
- `createDebouncer(delay, schedule, cancelSchedule)`: calls last value once after delay; resets on each change; `flush()` fires immediately and cancels; `cancel()` drops; delay 0 fires synchronously; clear flushes `""` immediately (test with fake timers injected, no real clock).
- `resolveTokenBackspace(value, tokens)`: empty text + tokens -> remove last; non-empty -> none; no tokens -> none.
- `resolveSearchBarCorner(shape)` returns expected class (`rounded-full` / none).
- Slot hygiene: field chrome not duplicated (no border/bg/h-* in `field` slot), no text-* on `root`, tokens exist in both themes, no `dark:`.

## Playground demos

`apps/playground/src/demos/search-bar/`: `basic` (hero, capture), `debounced-filter-list` (live filtered list; capture), `with-cancel` (capture), `loading-and-tokens` (capture), `sizes-and-shapes` (capture), `in-sheet` (inside `BottomSheet` via `BottomSheet.TextInput`? — note: SearchBar uses `Input`; for sheets expose `inputComponent?` OR document using `useBottomSheetInput()` spread through `inputProps`; add `inputProps?: Partial<InputProps>` so a caller can spread sheet handlers; verify). Route `(components)/search-bar.tsx`.

## Docs page outline

Install · Basic · Debounce and submit · Cancel modes · Loading · Tokens · Inside a list header (sticky) · Inside a BottomSheet · Shapes/sizes/variants · API · Accessibility.

## Out of scope / follow-ups

Results panel / suggestions popover (needs Overlays Popover) · recent searches storage · voice input · scoped search segments (compose `Tabs`/`ToggleButton` beneath) · native iOS large-title search integration (navigation-library specific).

## Acceptance checklist

- [ ] Visually derived from Input (same box, no duplicate chrome) at 3 sizes x 2 variants x 2 shapes.
- [ ] Debounce, flush on submit, immediate on clear verified in playground and by pure tests.
- [ ] Clear keeps focus + keyboard; Cancel blurs + dismisses keyboard + clears.
- [ ] Cancel animation smooth; calm-motion path verified.
- [ ] Tokens scroll, Backspace removes last, capped width.
- [ ] Works in `BottomSheet` with keyboard lift (inputProps).
- [ ] VoiceOver/TalkBack: search role, clear/cancel labelled, hidden cancel unreachable.
- [ ] No `any`; no JSX comments; displayNames; docs/AGENTS/exports/demos/registry/changeset done; typecheck + check + test green.
