# ACT-01-P8 — SelectionMode (pick several things at once)

Read [README.md](README.md) first. The closest relatives are `toggle-button/` (a multi-value
selection held as `string[]` through `useControllableState`; copy its `resolveToggleSelection`
shape), `checkbox/` (indicator drawing), `list-group/` and `item/` (rows), and `screen/` (footer
insets). Read their `AGENTS.md` files.

## Purpose on mobile

Pick several things at once (messages to archive, people to share with, swatches to apply), then
act on them from a bar. On a screen it is a **mode**: the list is for reading, and a long press
enters selection with the pressed row picked. A header says the mode is on and offers the way
out. A bar of actions appears over the bottom edge.

`SelectionMode.Item` **wraps** whatever it holds (a row, an avatar, a swatch) rather than
replacing it.

## Anatomy

```tsx
<SelectionMode values={ids} selected={selected} onSelectedChange={setSelected}>
  <SelectionMode.Header title="Choose" />
  <FlatList
    data={messages}
    renderItem={({ item }) => (
      <SelectionMode.Item value={item.id} onPress={() => open(item)}>
        <Item>…</Item>
      </SelectionMode.Item>
    )}
    contentContainerClassName="pb-24"
  />
  <SelectionMode.Bar>
    <SelectionMode.Action icon={IconTrashCan} isDestructive isExitOnPress onPress={remove}>Delete</SelectionMode.Action>
  </SelectionMode.Bar>
</SelectionMode>
```

`SelectionMode.Group` lays items out as a card list, a grid (`columns`) or a horizontal strip.

## API

```ts
type SelectionIndicator = "leading" | "ring" | "none";
type SelectionBarPlacement = "edge" | "floating";

type SelectionModeProps = ViewProps & {
	children: ReactNode;
	className?: string;
	values?: readonly string[];            // every pickable id, in list order — needed for select-all and "n of m"
	isActive?: boolean; defaultActive?: boolean; onActiveChange?: (active: boolean) => void;
	selected?: readonly string[]; defaultSelected?: readonly string[]; onSelectedChange?: (selected: string[]) => void;
	max?: number;                          // cap; select-all stops at the cap
	haptic?: false | HapticFeedback;       // on enter and on each toggle
};
type SelectionModeItemProps = Omit<ViewProps, "children"> & {
	value: string;
	children: ReactNode;
	onPress?: () => void;                  // row's own press when selection does not own it
	isDisabled?: boolean;                  // cannot start the mode or be picked; own onPress still runs
	indicator?: SelectionIndicator;        // default "leading"
	isIndicatorAlwaysShown?: boolean;
	className?: string;
};
type SelectionModeIndicatorProps = ViewProps & { value?: string; className?: string };
type SelectionModeHeaderProps = ViewProps & { title?: string /* default "Select" */; isSelectAllHidden?: boolean; className?: string };
type SelectionModeBarProps = ViewProps & {
	placement?: SelectionBarPlacement;     // default "edge"
	isShownWhenEmpty?: boolean;            // default false
	isSafeAreaAware?: boolean;             // default true: pads bottom with the safe-area inset
	className?: string;
};
type SelectionModeActionProps = {
	children: ReactNode;                   // label
	icon?: IconComponent;
	onPress: (selected: string[]) => void;
	isExitOnPress?: boolean;
	isDestructive?: boolean;
	isDisabled?: boolean;
	className?: string; labelClassName?: string;
};
type SelectionModeGroupProps = ViewProps & {
	columns?: number;                      // grid
	isHorizontal?: boolean;                // single scrolling row; wins over columns
	itemWidth?: number;                    // strip item width, default 44
	gap?: number;                          // default 12
	label?: string;                        // caption + group accessibilityLabel
	hasSeparators?: boolean;               // default true for stacked, false for grid/strip
	className?: string; labelClassName?: string;
};
```

`useSelectionMode()` returns
`{ isActive, selected, isSelected(v), toggle(v), selectAll(), clear(), enter(v?), exit(), count, total, max }`.
Every part except the root **throws** outside a `SelectionMode`.

## Behaviour

- Selection is a **set of ids** (a `string[]` that keeps insertion order). It never holds indices.
- **Inactive**: an Item press runs its `onPress`. An Item long press (`Pressable` `onLongPress`)
  enters the mode and picks that item (unless `isDisabled`).
- **Active**: an Item press toggles it (respecting `max`: an item that would exceed the cap does
  not toggle on). `onPress` is not called.
- `isDisabled` items: never toggle and never enter, but their own `onPress` still runs, even
  while active (headers, "load more").
- Exiting (the header close or `exit()`) **clears the selection** when uncontrolled. A controlled
  `selected` is left to the caller.
- Select all: picks `values` (minus disabled ones the caller excluded from `values`) up to `max`.
  When everything selectable is selected, the control becomes "Deselect all".
- **Header**: replaces nothing by itself. It renders only while active: a close (×) button, a
  `"{title} · n of m"` label (or `"n selected"` without `values`), and select-all. Animate it in
  from the top (fade and translate 8pt).
- **Bar**: absolute at the bottom of the root, over the list. It is hidden while nothing is
  picked unless `isShownWhenEmpty`. It slides up and fades in. Actions are vertical icon-over-label
  buttons spread evenly. `floating` places it in an inset rounded card (`mx-4 rounded-2xl
  bg-elevated shadow`). `edge` is full-width `bg-background border-t border-border`. The bottom
  padding is the safe-area inset.
- Action `onPress` receives the current selection, then exits if `isExitOnPress`.
- The root fills a height it is offered (`flex-1`). Document "give it a height" and "pad the
  bottom of your list".

## Visual design

- **The indicator is round on purpose.** A square box is a form control being filled in, and a
  round one is a thing picked out of a set. `Checkbox` stays square. Use 22pt, `border-2
  border-border` → selected `bg-primary` with a white Central check (`text-primary-foreground`).
  Animate it with a scale pop (0.8→1, spring). It is shown only while active (or
  `isIndicatorAlwaysShown`) and slides in from the leading edge, pushing the content 34pt.
- `ring`: a 2pt `border-primary` ring with a 2pt gap around the item (absolute, `-inset-1`), and
  a small check badge at the top-end.
- `none`: draws nothing. The caller reads `isSelected`.
- A selected row in `leading` mode also gets a subtle `bg-primary/5` fill.

## Reduced motion

Indicator, header and bar transitions become opacity-only 150ms.

## A11y

- Item while active: `accessibilityRole="checkbox"`, `accessibilityState={{ checked, disabled }}`,
  and a hint "Double-tap to select". While inactive, it keeps the child's semantics and adds
  `accessibilityActions=[{ name: "longpress", label: "Start selecting" }]`.
- The header announces the count through `accessibilityLiveRegion="polite"` (Android) and
  `AccessibilityInfo.announceForAccessibility` on change (iOS).
- Group `label` → `accessibilityLabel`. A strip or grid has the role `"list"`.

## Pure logic (`selection-mode.variants.ts` + test first)

- `resolveToggle({ selected, value, max, isDisabled })` → `string[]`.
- `resolveSelectAll({ selected, values, max })` → `string[]` (fills up to the cap and keeps
  existing picks first).
- `resolveIsAllSelected({ selected, values, max })` → `boolean` (true at the cap when the cap is
  below the total).
- `resolveItemPress({ isActive, isDisabled })` →
  `{ kind: "toggle" } | { kind: "press" } | { kind: "none" }`.
- `resolveHeaderCount({ count, total })` → display string.
- `resolveGroupLayout({ columns, isHorizontal })` →
  `{ kind: "stack" } | { kind: "grid"; columns } | { kind: "strip" }`.
- `selectionModeVariants`, a slotted `tv`: `root`, `item`, `indicator`, `indicatorCheck`, `ring`,
  `header`, `headerTitle`, `bar`, `action`, `actionLabel`, `group`, `groupLabel`, with axes
  `indicator × placement × isSelected × isDestructive`. Add the token test.

## Files

`selection-mode/`: `index.ts`, `selection-mode.tsx`, `selection-mode-item.tsx`,
`selection-mode-indicator.tsx`, `selection-mode-header.tsx`, `selection-mode-bar.tsx`,
`selection-mode-action.tsx`, `selection-mode-group.tsx`, `selection-mode.context.tsx`,
`selection-mode.types.ts`, `selection-mode.variants.ts`, `selection-mode.variants.test.ts`,
`AGENTS.md`.

## Out of scope (record in AGENTS.md)

- **`SelectionMode.Sheet`**. Importing `../bottom-sheet` would force the optional sheet engine on
  every consumer. The demo `in-a-sheet` shows the composition instead:
  `<BottomSheet>…<SelectionMode isActive>…</SelectionMode>…</BottomSheet>`, with the bar in
  `BottomSheet.Footer`. A first-class `Sheet` part is a follow-up, possibly as its own subpath.

## Playground demos

`inbox-mode` (hero, capture: long press to enter, header, edge bar), `share-picker` (an
always-active stacked group, capture), `swatch-grid` (`columns={5}` + `ring`, capture),
`swatch-strip` (horizontal plus a Slider below), `max-limit` (capture), `disabled-rows`,
`floating-bar`, `in-a-sheet` (composition with BottomSheet; the playground already mounts its
provider).

## Docs

`selection-mode.mdx` under `---Actions---`, with notes on padding the list, giving it a height,
why the indicator is round, and selection being ids.

## Acceptance checklist

- [ ] A long press enters with the row picked. Taps then toggle. The header close exits and
      clears (uncontrolled).
- [ ] `max` caps both toggling and select-all. Select-all flips to deselect.
- [ ] Disabled items never select but keep their own press.
- [ ] The bar hides when empty, receives the selection, and `isExitOnPress` exits.
- [ ] Grid, strip and stack layouts. Ring and none indicators.
- [ ] Controlled and uncontrolled for both `isActive` and `selected`.
- [ ] Checkbox semantics while active. The count is announced.
- [ ] Works inside a BottomSheet (demo).
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
