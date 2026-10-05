# ACT-01-P6 — Fab (floating action button and speed dial)

Read [README.md](README.md) first. The closest relatives are `button/` (sizes, variants, icon
defaults, `IconDefaultsProvider`), `pressable/` (haptics) and `screen/` (insets, footer). Read
their `AGENTS.md` files.

## Purpose on mobile

One primary action floating over the screen it belongs to, such as "New note" over a list. It
can optionally carry a **dial** of related actions that unfold out of it. Three corner buttons
make a toolbar in the wrong place, so for several peer actions use `Button.Group` in a bar.

## Anatomy

```tsx
<Fab placement="bottom-end" accessibilityLabel="New note" onPress={compose}>
  <Icon icon={IconPlusLarge} />
</Fab>

<Fab isExtended placement="bottom-end" onPress={write}>
  <Icon icon={IconPencil} />
  <Fab.Label>Write</Fab.Label>
</Fab>

<Fab.Group accessibilityLabel="Add something" icon={IconPlusLarge}>
  <Fab.Action icon={IconImages} label="Photo" onPress={addPhoto} />
  <Fab.Action icon={IconPaperclip} label="Attachment" onPress={attach} />
  <Fab.Action icon={IconTrashCan} label="Empty drafts" isDestructive onPress={empty} />
</Fab.Group>
```

Icons are **composed** as children on `Fab`, which matches `Button`. Fab wraps its subtree in
`IconDefaultsProvider` with the size and foreground. `Fab.Group` and `Fab.Action` take an `icon`
component prop, because the group renders and rotates its trigger glyph and each action draws a
round button and a label chip. Record that reason in AGENTS.md.

## API

```ts
type FabSize = "sm" | "md" | "lg";                     // 44 / 56 / 64 pt
type FabVariant = "primary" | "secondary" | "surface" | "destructive";
type FabPlacement = "bottom-start" | "bottom-center" | "bottom-end";

type FabProps = PressableProps & {
	size?: FabSize;                 // default "md"
	variant?: FabVariant;           // default "primary"
	isExtended?: boolean;           // stadium with a label
	placement?: FabPlacement;       // omitted → in flow; set → absolute in nearest positioned ancestor
	offset?: number;                // default 16 (add safe-area inset yourself, or see isSafeAreaAware)
	isSafeAreaAware?: boolean;      // default true when placement is set: adds bottom inset from safe-area-context
	isDisabled?: boolean;
	haptic?: false | HapticFeedback;
	accessibilityLabel?: string;    // required in practice for icon-only; dev warning when missing and not extended
};
type FabLabelProps = Omit<TextProps, "children"> & { children: ReactNode; className?: string };

type FabGroupProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	icon: IconComponent;
	label?: string;                 // extended trigger while closed
	isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
	placement?: FabPlacement;       // default "bottom-end"
	offset?: number;
	size?: FabSize; variant?: FabVariant;
	isDisabled?: boolean;
	haptic?: false | HapticFeedback;
	isRotatedOnOpen?: boolean;      // default true: glyph turns 45° (plus → cross)
	accessibilityLabel: string;     // required
	className?: string;
};
type FabActionProps = {
	icon: IconComponent; label: string; onPress: () => void;
	isDisabled?: boolean; isDestructive?: boolean;
	className?: string; labelClassName?: string;
};
```

## Visual design

- Size tokens: add `--spacing-fab-sm/md/lg` (44/56/64) in **both** `tokens.css` and the
  `@variant native` block in `theme.css`, and the names in `styles/tokens.ts`. Follow the package
  AGENTS.md "Adding a token means editing two files" rule. `geometry.test.ts` and `tokens.test.ts`
  must pass. The corner is `rounded-full`. Icon size: sm → `icon-md`, md → `icon-lg`, lg → `icon-lg`.
- Variants: primary → `bg-primary` / `primary-foreground`; secondary → `bg-secondary`;
  surface → `bg-elevated border border-border` / `elevated-foreground`;
  destructive → `bg-destructive`.
- Elevation: a native shadow (`shadow-lg`, if Uniwind maps it; otherwise the RN `boxShadow`
  style string on the root). This is the one floating thing in the kit, so it casts one.
- Extended: `px-5 gap-2`, the height of the size, and label `text-button-md font-medium`.
- **Dial**: actions stack upward above the trigger, each a `sm` round button (variant `surface`,
  or a `destructive` foreground when `isDestructive`). Each has a label chip
  (`bg-popover text-popover-foreground rounded-md px-2 py-1 text-sm`) on the inner side (left of
  the button for bottom-end, right for bottom-start, above for center). Spacing is 12pt.
- **Scrim** while open: `absolute inset-0 bg-overlay` (fades to the theme's overlay opacity).
  Tapping it closes. It is a sibling of the dial inside the group's parent, so the group must be
  written in the screen's root container. Document that.

## Behaviour

- `placement` set → `position: absolute`, with `bottom = offset + insets.bottom` and start, end or
  centre (`self-center` via `start-0 end-0 items-center` wrapper) by `offset`.
- Group: **one spring drives the dial** (`open` shared value 0→1, `withSpring` with slight
  overshoot). Each action derives its own stagger window from its index on the UI thread:
  `local = clamp((open - i*0.08) / (1 - (n-1)*0.08), 0, 1)`. There are no per-action timeouts,
  so closing halfway through opening is coherent.
- The trigger glyph rotates `45° * open` (plus → cross) when `isRotatedOnOpen`.
- **Actions are unmounted while closed** (after the close spring settles), not hidden, so a
  screen reader cannot walk into invisible buttons.
- Pressing any action runs it, then closes the dial.
- Android back closes an open dial (`BackHandler` while open).
- Haptic on trigger press and on action press, when set.

## Reduced motion

The dial opens with a 150ms fade (no translate or stagger). The glyph still rotates via timing.

## A11y

- Fab: `accessibilityRole="button"`. Warn in dev when icon-only with no label.
- Group trigger: `accessibilityRole="button"` with `accessibilityState={{ expanded: isOpen }}`.
- Actions: `button`, labelled by `label`. The scrim has `accessibilityLabel="Close"` and the
  button role.
- While open, mark the group container `accessibilityViewIsModal`.

## Pure logic (`fab.variants.ts` + test first)

- `resolveDialProgress({ open, index, count, stagger })` → 0..1. Test monotonicity and endpoints.
- `resolveFabPlacementStyle({ placement, offset, insetBottom })` → `{ position, bottom, start?, end?, alignSelf? }`.
- `resolveFabIconSize(size)` → icon step.
- `resolveLabelSide(placement)` → `"start" | "end" | "top"`.
- `fabVariants`, a slotted `tv`: `root`, `label`, `scrim`, `dial`, `action`, `actionButton`,
  `actionLabel`, with axes `size × variant × isExtended × isDisabled`. Add the token test.

## Files

`fab/`: `index.ts`, `fab.tsx`, `fab-label.tsx`, `fab-group.tsx`, `fab-action.tsx`,
`fab.context.tsx`, `fab.types.ts`, `fab.variants.ts`, `fab.variants.test.ts`, `AGENTS.md`. Plus
the token edits in `src/styles/`.

## Out of scope (record in AGENTS.md)

- A glass material (needs an uncatalogued native peer).
- `layout="menu"` and `layout="native"` (a menu panel out of the Fab). That is a follow-up once
  Menu has merged, reusing Menu's rows.
- `blur` scrim (needs `expo-blur`, which is not a peer).

## Playground demos

`over-a-list` (hero, capture: ScrollView with bottom padding and a Fab bottom-end), `extended`
(capture), `speed-dial` (capture), `sizes-and-variants` (in-flow row, capture), `placements`,
`controlled-dial`.

## Docs

`fab.mdx` under `---Actions---`. Include a "pad the bottom of your list" note.

## Acceptance checklist

- [ ] In-flow and pinned placements are correct, with the safe-area inset honoured.
- [ ] Sizes 44/56/64 come from new tokens declared in both CSS copies, and the token tests pass.
- [ ] The dial unfolds from one spring with a stagger. Interrupting open/close is smooth.
- [ ] The glyph rotates plus → cross. Scrim tap and Android back close.
- [ ] Actions are unmounted when closed. Pressing an action closes the dial.
- [ ] A11y: expanded state, labels, modal while open, and a dev warning for an unlabelled
      icon-only Fab.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
