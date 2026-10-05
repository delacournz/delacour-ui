# ACT-01-P9 — ContextMenu (hold content for its actions)

Read [README.md](README.md) first. **This component depends on Menu (ACT-01-P7)**, so start it
only from a category-branch commit where `packages/react-native-ui/src/components/menu/` exists.
Read `menu/AGENTS.md` (especially its "reuse contract") before anything else, then `pressable/`.

## Purpose on mobile

The actions that belong to a piece of content (a message bubble, a card, a row), reached by
**holding the content itself**. A Menu hangs off a control that exists to be opened. A context
menu has no such control, because the target is the content.

**The rows are Menu's rows**, not a restyled copy. The separator, label, checkbox, radio, sub and
background are re-exported outright, so the two entry points cannot drift.

## Anatomy

```tsx
<ContextMenu>
  <ContextMenu.Trigger haptic="medium" onPress={openThread}>
    <Card>…</Card>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Preview />
    <ContextMenu.Item icon={IconShare} onSelect={share}>Share</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item variant="destructive" icon={IconTrashCan} onSelect={remove}>Delete</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>
```

## API

```ts
type ContextMenuAnchor = "point" | "target";

type ContextMenuProps = MenuProps;   // same open-state + haptic
type ContextMenuTriggerProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;              // wrapper lays out like a View; does not shrink to child
	anchor?: ContextMenuAnchor;      // default "point"
	delay?: number;                  // hold ms, default 350
	slop?: number;                   // drift pt allowed during hold, default 12
	onPress?: () => void;            // short press — arbitrated against the hold
	haptic?: false | HapticFeedback; // ticks when the hold is accepted
	isDisabled?: boolean;            // neither the hold nor onPress fires
};
type ContextMenuContentProps = Omit<MenuContentProps, "hasScrim" | "anchor"> & {
	hasScrim?: boolean;              // default TRUE
	// defaults differ from Menu: placement "bottom", align "start", offset 8, minWidth 280
};
type ContextMenuItemProps = MenuItemProps; // iconPlacement defaults to "trailing", rows taller (min-h-12)
type ContextMenuPreviewProps = ViewProps & { children?: ReactNode; className?: string };
```

Re-export as compound slots: `Label`, `Separator`, `CheckboxItem`, `RadioGroup`, `RadioItem`,
`Sub`, `SubTrigger`, `SubContent`, `Background` from Menu's leaf modules.

## Behaviour

- **Gesture arbitration.** `Gesture.Exclusive(longPress, tap)`, with
  `Gesture.LongPress().minDuration(delay).maxDistance(slop)` and `Gesture.Tap()`. The recogniser
  decides up front, so a hold that opens the menu never also counts as a tap. This is why
  `onPress` belongs on the trigger and not on the content inside it. Document that.
- The content is **not cloned or altered** and does not need to be pressable.
- `anchor="point"`: the anchor is a zero-size rect at the press's `absoluteX/absoluteY` from the
  LongPress event. `anchor="target"`: the anchor is the wrapper's `measureInWindow`. Pass it to
  Menu's content through the reuse contract (`MenuRootProvider` + `anchor`).
- **Preview** (`ContextMenu.Preview` among the rows): lifted out of children by type. It renders
  the trigger's own children again (or its own children), absolutely positioned at the
  wrapper's measured window rect, over the scrim, with `pointerEvents="none"`, a slight scale-up
  (1→1.03) and a shadow. When a Preview is present, the anchor is forced to the **target**
  rect, so the panel opens outside the lifted copy, never across it.
- Scrim: `bg-overlay` full-screen behind the panel (and the preview). Tap dismisses.
- Haptic: `playHaptic(haptic)` in the LongPress `onStart` (UI thread), the moment the hold is
  accepted.

## A11y

- The trigger is one accessible element with `accessibilityRole="button"` (when `onPress`) or
  `"none"`, and
  `accessibilityActions=[{ name: "activate" }, { name: "longpress", label: "Show menu" }]`.
  `activate` → `onPress` if given, else open. `longpress` / "Show menu" → open against the
  target rect, since there is no pointer coordinate.
- Disabled: announces disabled, and neither action does anything.
- The panel inherits Menu's `menu` / `menuitem` roles and modal containment.

## Pure logic (`context-menu.variants.ts` + test first)

- `resolveContextAnchor({ mode, point, targetRect, hasPreview, invokedBy: "pointer" | "accessibility" })`
  → `MenuAnchorRect`. Preview or accessibility forces the target. Point mode gives a zero-size
  rect.
- `resolveHoldConfig({ delay, slop })` → defaults 350/12, with floors (delay ≥ 150, slop ≥ 0).
- `contextMenuVariants`, a slotted `tv`: `trigger`, `preview`, `item` (taller-row override). Add
  the token test.
- Reuse Menu's `resolveMenuPlacement` and do not fork it. Add tests here only for the context
  defaults (offset 8, minWidth 280).

## Files

`context-menu/`: `index.ts`, `context-menu.tsx`, `context-menu-trigger.tsx`,
`context-menu-content.tsx`, `context-menu-item.tsx`, `context-menu-preview.tsx`,
`context-menu.context.tsx`, `context-menu.variants.ts`, `context-menu.variants.test.ts`,
`AGENTS.md`. Import Menu parts from `../menu/<leaf>` only (rule 3), never from `../menu`.

If Menu's reuse contract turns out insufficient (for example, Content cannot take an external
anchor), make the **minimal** change in `menu/` in a separate commit
(`♻️ refactor(react-native-ui): let Menu.Content take an external anchor`), update
`menu/AGENTS.md`, and keep Menu's tests green.

## Out of scope

`presentation="bottom-sheet"` (same reason as Menu) and hardware-keyboard Shift+F10 / Context
Menu key.

## Playground demos

`message-actions` (hero, capture), `with-own-press` (navigates on tap, menu on hold, capture),
`anchored-to-row` (capture), `stateful-rows`, `lifted-preview` (in a list of cards, capture),
`hold-timing`.

## Docs

`context-menu.mdx` under `---Actions---`, linking to Menu for the row API.

## Acceptance checklist

- [ ] A hold opens at the finger (point) or against the target. A tap fires `onPress`. Never both.
- [ ] A scroll starting on the trigger still scrolls (slop 12, delay 350).
- [ ] Rows are Menu's components (no duplicated row implementation). Trailing icon and taller rows.
- [ ] The scrim dims and dismisses. Android back closes.
- [ ] The preview lifts the content in place, and the panel never overlaps it.
- [ ] The screen-reader "Show menu" action opens it, and activate runs `onPress`. Disabled does
      nothing.
- [ ] The haptic fires at hold acceptance.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
