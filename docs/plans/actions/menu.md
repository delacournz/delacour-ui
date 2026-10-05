# ACT-01-P7 — Menu (dropdown of actions)

Read [README.md](README.md) first. The closest relatives are `list-group/` and `item/` (row
anatomy), `checkbox/` and `radio/` (state rows), `collapsible/` (in-place expansion for
submenus), `bottom-sheet/` (overlay, scrim and back-button conventions) and `pressable/`. Read
their `AGENTS.md` files.

## Purpose on mobile

The list of **verbs** you can apply to something (rename, duplicate, share, delete), dropped from
a control that exists to open it (a ⋯ button or a toolbar item). A menu is not a select: its rows
do not become the trigger's value. **ContextMenu (P9) is built on this component's rows and
panel**, so keep parts reusable and exported from leaf modules.

## Cross-category dependency: the floating panel

There is no Popover yet (Overlays, unmerged). **Build a minimal anchored panel inside `menu/`**,
and do not import another category's branch:

- `menu-content.tsx` renders inside RN `<Modal transparent visible animationType="none"
  statusBarTranslucent onRequestClose={close}>`. `Modal` gives the top-most layer, Android back
  via `onRequestClose`, and screen-reader containment, all with no new peer.
- The anchor is the trigger's `measureInWindow` rect, taken on open. ContextMenu will pass a
  **zero-size point rect** through the same API, so design the placement to take
  `anchor: { x, y, width, height }` rather than a ref.
- **`resolveMenuPlacement`** is the pure function that places it (see Pure logic). Export it from
  `menu.variants.ts` so Popover can adopt it later. Note that in AGENTS.md as the planned
  migration: "When Popover lands, Menu.Content moves onto it and this resolver moves with it."

## Anatomy

```tsx
<Menu>
  <Menu.Trigger asChild><Button variant="outline">Options</Button></Menu.Trigger>
  <Menu.Content align="start" width={224}>
    <Menu.Label>File</Menu.Label>
    <Menu.Item icon={IconPencil} shortcut="⌘R" onSelect={rename}>Rename</Menu.Item>
    <Menu.CheckboxItem isChecked={showDone} onCheckedChange={setShowDone}>Completed</Menu.CheckboxItem>
    <Menu.RadioGroup value={density} onValueChange={setDensity}>
      <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
      <Menu.RadioItem value="compact" indicator="dot">Compact</Menu.RadioItem>
    </Menu.RadioGroup>
    <Menu.Sub>
      <Menu.SubTrigger icon={IconFolder}>Move to</Menu.SubTrigger>
      <Menu.SubContent>…Menu.Item…</Menu.SubContent>
    </Menu.Sub>
    <Menu.Separator />
    <Menu.Item variant="destructive" icon={IconTrashCan} description="This cannot be undone">Delete</Menu.Item>
  </Menu.Content>
</Menu>
```

## API

```ts
type MenuPlacement = "top" | "bottom";
type MenuAlign = "start" | "center" | "end";
type MenuItemVariant = "default" | "destructive";
type MenuRadioIndicator = "check" | "dot";
type MenuAnchorRect = { x: number; y: number; width: number; height: number };

type MenuProps = {
	children: ReactNode;
	isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
	haptic?: false | HapticFeedback;      // played when a row is chosen
};
type MenuTriggerProps = PressableProps & { asChild?: boolean };
type MenuContentProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;
	placement?: MenuPlacement;            // default "bottom"; flips when no room
	align?: MenuAlign;                    // default "start"
	offset?: number;                      // default 6
	width?: number;                       // default: max(trigger width, 200)
	minWidth?: number;
	maxHeight?: number;                   // default: room inside safe area
	isScrollable?: boolean;               // default true
	hasScrim?: boolean;                   // default false (ContextMenu sets true)
	anchor?: MenuAnchorRect;              // escape hatch; ContextMenu uses it
};
type MenuItemProps = Omit<PressableProps, "children" | "onPress"> & {
	children: ReactNode;                  // label (string wrapped in Text)
	icon?: IconComponent;
	iconPlacement?: "leading" | "trailing"; // default "leading" (ContextMenu uses "trailing")
	description?: string;
	shortcut?: string;
	trailing?: ReactNode;
	variant?: MenuItemVariant;
	isInset?: boolean;
	isDisabled?: boolean;
	isClosedOnSelect?: boolean;           // default true
	onSelect?: () => void;
};
type MenuCheckboxItemProps = Omit<MenuItemProps, "onSelect" | "isClosedOnSelect"> & {
	isChecked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void;
	isClosedOnSelect?: boolean;           // default FALSE
};
type MenuRadioGroupProps = ViewProps & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
type MenuRadioItemProps = Omit<MenuItemProps, "onSelect"> & { value: string; indicator?: MenuRadioIndicator }; // closes by default
type MenuSubProps = { children: ReactNode; isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };
type MenuLabelProps = TextProps & { isInset?: boolean };
type MenuBackgroundProps = ViewProps & { className?: string };
```

`useMenu()` returns `{ isOpen, open(anchor?), close() }`. Expose `MenuRootProvider` (the context
provider) so ContextMenu can drive the open state with its own anchor.

## Visual design

- Panel: `rounded-lg border border-border`, with a native shadow. Its surface is
  `Menu.Background`, an absolute-fill layer in **`bg-popover`** drawn behind the scroller. The
  theme's `overlay` token is the translucent **scrim** colour (`oklch(0 0 0 / 45%)`), not a
  surface, so never use it for the panel. A caller may pass their own `Menu.Background`; the root
  lifts it out of children by type and renders it outside the scroller, where it stays put while
  the rows scroll.
- Row: `min-h-11 px-3 gap-3 flex-row items-center rounded-md` inside a `p-1` panel. Label
  `text-sm text-popover-foreground`. Description `text-xs text-muted-foreground`. Shortcut
  `text-xs text-muted-foreground ms-auto`. The icon column is 18pt (`size-icon-sm`), so
  `isInset` reserves it.
- Destructive: label and icon `text-destructive`, row pressed fill `bg-destructive-soft`.
- Press feedback: fill `bg-accent` fades in over 90ms and out over 160ms, with scale 0.98. Both
  run off one shared value, and both are skipped under reduced motion. Use `Pressable` with
  `feedback="none"` and drive the fill yourself, or extend through the shared vocabulary. Do
  **not** add a wash or ripple overlay; the fill *is* the row's background.
- Indicators: Central check, a 6pt dot for radio `dot`, and a chevron for sub-trigger that rotates
  90° open (mirrored under RTL on a wrapper view).
- Separator: reuse `Separator` (`my-1`).
- Submenus **expand in place** (height animation like `Collapsible`), never fly out.

## Behaviour

- Open: the trigger press → `measureInWindow` → set the anchor → open. Close on: row select (per
  rules), outside tap (a transparent full-screen pressable behind the panel), Android back, and
  trigger press again.
- Enter: opacity 0→1 and scale 0.96→1 from the anchor side (transform origin approximated with a
  translate), 160ms. Exit: the reverse, 120ms, then unmount the Modal. Reduced motion: opacity
  only.
- When the content height is larger than the room, cap and scroll (`ScrollView`). After layout,
  re-run placement with the measured height (first frame at opacity 0 until measured, so there is
  no jump).
- Haptic on select.

## A11y

- Content: `accessibilityRole="menu"`, `accessibilityViewIsModal`.
- Items: `accessibilityRole="menuitem"`. Checkbox → `accessibilityState={{ checked }}`. Radio →
  `{ selected }`. SubTrigger → `{ expanded }`. Disabled → `{ disabled }`.
- Trigger: `accessibilityState={{ expanded: isOpen }}`, with the hint "Opens a menu".

## Pure logic (`menu.variants.ts` + test first)

- `resolveMenuPlacement({ anchor, content: {width,height}, window: {width,height}, insets, placement, align, offset, isRTL })`
  → `{ top, left, placement /* actual after flip */, maxHeight }`. Cases: no room below → flips
  top; no room either side → picks the larger side and caps `maxHeight`; clamps horizontally
  inside insets plus an 8pt margin; `align` start/end swap under RTL; a zero-size anchor (point)
  works with no special case.
- `resolveMenuWidth({ width, minWidth, triggerWidth })`.
- `resolveRadioNext(current, value)` (trivial, but pins the closes-by-default rule) and
  `resolveCloseOnSelect(kind, explicit?)` → item: true, checkbox: false, radio: true.
- `menuVariants`, a slotted `tv`: `content`, `background`, `item`, `itemLabel`, `itemDescription`,
  `itemShortcut`, `itemIcon`, `label`, `indicator`, `subContent`, with axes `variant × isInset ×
  isDisabled`. Add the token test.

## Files

`menu/`: `index.ts`, `menu.tsx`, `menu-trigger.tsx`, `menu-content.tsx`, `menu-background.tsx`,
`menu-label.tsx`, `menu-item.tsx`, `menu-checkbox-item.tsx`, `menu-radio-group.tsx`,
`menu-radio-item.tsx`, `menu-separator.tsx`, `menu-sub.tsx`, `menu-sub-trigger.tsx`,
`menu-sub-content.tsx`, `menu.context.tsx`, `menu.types.ts`, `menu.variants.ts`,
`menu.variants.test.ts`, `AGENTS.md`.

**Reuse contract for ContextMenu.** Keep `menu.context.tsx` and `menu-content.tsx` usable with an
externally supplied anchor and `hasScrim`. Keep row parts importable as leaves, so ContextMenu can
import `../menu/menu-item` without pulling `../menu` (rule 3). Write this contract into
`menu/AGENTS.md`.

## Out of scope (record in AGENTS.md)

- `presentation="bottom-sheet"`: it would force the optional sheet engine on every Menu consumer.
  It is a follow-up.
- Keyboard navigation and focus return on web.

## Playground demos

`actions` (hero, capture), `checkbox-and-radio` (capture), `submenu` (capture), `inset-rows`,
`near-bottom-edge` (trigger at the screen bottom, opens upward, capture), `long-list` (scrolls),
`custom-background`.

## Docs

`menu.mdx` under `---Actions---`.

## Acceptance checklist

- [ ] Opens anchored to the trigger. Flips near the bottom and clamps at the sides and in the
      safe area.
- [ ] Rows close on select. Checkbox rows stay open. Radio rows close.
- [ ] A submenu expands in place, and its chevron rotates (mirrored in RTL).
- [ ] Long menus scroll within the safe area.
- [ ] Outside tap and Android back close.
- [ ] Roles and states are announced (menu, menuitem, checked, selected, expanded).
- [ ] `resolveMenuPlacement` is exported and fully unit-tested, including the zero-size anchor.
- [ ] Parts are reusable by ContextMenu without a cycle (leaf imports documented).
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
