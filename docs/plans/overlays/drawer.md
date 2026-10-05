# OVL-P1-DRAWER — Drawer

`import { Drawer } from "@delacour/react-native-ui/drawer";`

## Purpose on mobile

A panel that slides in from an edge and covers the app until dismissed: a navigation menu from
the start edge, a filter panel from the end edge, a notifications tray from the top. It covers
rather than pushes the app aside. Bottom drawers are for short, fixed content — anything with snap
points, a keyboard or a long list is a `BottomSheet`.

## Builds on

- `@delacour/react-native-ui/overlay` (OVL-P0): `Overlay.Portal layer="modal"`, `Overlay.Scrim`,
  `useOverlayPresence` (for open/close from code), `useOverlayBackHandler`. Read
  `src/components/overlay/AGENTS.md` first.
- Gesture Handler `Gesture.Pan()` + Reanimated for the swipe-to-dismiss, `react-native-safe-area-context`
  for insets, `I18nManager.isRTL` for logical sides.
- `Pressable`, `Slot`, `Text` presets, `Icon` + `IconCrossSmall`, `ScrollView`.
- Read `bottom-sheet/AGENTS.md` (trigger donation, close control) and the engine's
  `src/gesture/AGENTS.md` for the flat-worklet rule (**a module-scope worklet never calls another
  function**) and how a pan hands off to a release animation.

No new peer dependency.

## API

```tsx
type DrawerSide = "start" | "end" | "top" | "bottom";
type DrawerSize = "sm" | "md" | "lg" | "full";

type DrawerProps = {
	isOpen?: boolean;
	defaultOpen?: boolean; // false
	onOpenChange?: (isOpen: boolean) => void;
	/** Scrim tap, Android back, escape gesture. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};
type DrawerTriggerProps = PressableProps; // asChild donates onPress
type DrawerContentProps = ViewProps & {
	className?: string;
	scrimClassName?: string;
	side?: DrawerSide;          // "start"
	size?: DrawerSize;          // "md"
	isSwipeDismissible?: boolean; // true
};
type DrawerHeaderProps = ViewProps & {
	className?: string;
	/** Hide the ✕ the header writes at its trailing edge. Default false. */
	isCloseHidden?: boolean;
};
type DrawerTitleProps = TextPresetProps;
type DrawerDescriptionProps = TextPresetProps;
type DrawerBodyProps =
	| ({ isScrollable?: true } & ScrollViewProps & { className?: string; contentContainerClassName?: string })
	| ({ isScrollable: false } & ViewProps & { className?: string });
type DrawerFooterProps = ViewProps & { className?: string };
type DrawerCloseProps = /* same discriminated union as Dialog.Close */;

function useDrawer(): { isOpen: boolean; setOpen(v: boolean): void; close(): void; side: DrawerSide; edge: DrawerEdge };
```

```tsx
<Drawer>
  <Drawer.Trigger asChild><Button size="icon-md" accessibilityLabel="Menu">…</Button></Drawer.Trigger>
  <Drawer.Content side="start" size="md">
    <Drawer.Header>
      <Drawer.Title>Menu</Drawer.Title>
      <Drawer.Description>Signed in as …</Drawer.Description>
    </Drawer.Header>
    <Drawer.Body>…rows…</Drawer.Body>
    <Drawer.Footer>…</Drawer.Footer>
  </Drawer.Content>
</Drawer>
```

## Geometry (pure, `drawer.variants.ts`)

- `resolveDrawerEdge(side, isRTL): DrawerEdge` — `"left" | "right" | "top" | "bottom"`; `start`
  is left in LTR, right in RTL.
- `resolveDrawerExtent(size, windowExtent): number` — the panel's width (left/right) or height
  (top/bottom): `sm` 62% max 280, `md` 78% max 320, `lg` 88% max 400, `full` 94% uncapped.
- `resolveDrawerOffset(edge, extent, progress)` — the translate for a presence progress `0..1`
  (`translateX = -extent * (1 - p)` for left, etc.).
- `resolveDrawerRelease({ edge, translation, velocity, extent }): "dismiss" | "restore"` —
  dismiss past 40% of the extent or on a fling toward the edge faster than 800 pt/s; a fling away
  from the edge always restores.
- `resolveDrawerDrag(edge, translation)` — movement toward the edge follows the finger 1:1;
  movement away rubber-bands (`resist(x) = x / (1 + x / 40)` style, capped).
- Insets: the docked edge's panel pads the safe-area insets on its three free sides
  (`resolveDrawerInsets(edge, insets)`), so a start drawer clears the status bar and home indicator.

## Gesture & motion

Pan on the panel, `activeOffsetX` (horizontal edges) or `activeOffsetY` (vertical) so a vertical
scroll in a start/end drawer's `Body` never starts the pan. On release toward dismiss, the exit
animation **continues from where the finger left the panel** — it does not spring back first —
and closes the state when it lands. Programmatic open/close use presence `progress` with
`OVERLAY_MOTION`. Under reduce motion: no slide, the panel fades; the swipe still works (it is
direct manipulation).

A drag also drives the scrim: opacity = `1 - dragFraction` while dragging.

Haptic: none on open; `selection` when a swipe crosses the dismiss threshold (via `playHaptic`
from the worklet).

## Variants (`drawer.variants.ts`, slotted `tv()`)

Slots: `scrim`, `content` (`bg-popover`, the free edge's corners `rounded-lg`, docked corners
square — a `edge` variant), `header` (row; title block flex-1; ✕ at the trailing edge), `title`,
`description`, `body`, `footer` (top hairline, padding), `close`. Every token in both themes.

## Accessibility

Panel `accessibilityViewIsModal`, `role="dialog"`, labelled by the title; focus to title on enter,
back to trigger on exit; `onAccessibilityEscape` and back button close when dismissible. The
scrim is not accessible. Header ✕ is `accessibilityLabel="Close"`.

## Pure logic to unit-test (write first)

`resolveDrawerEdge` (both directions), `resolveDrawerExtent` (each size, small and large window),
`resolveDrawerOffset`, `resolveDrawerRelease` (threshold, fling toward, fling away),
`resolveDrawerDrag`, `resolveDrawerInsets`, variants per edge, tokens in both themes.

## Files

`index.ts`, `drawer.tsx`, `drawer.context.tsx`, `drawer.variants.ts`, `drawer.variants.test.ts`,
`drawer-trigger.tsx`, `drawer-content.tsx`, `drawer-header.tsx`, `drawer-title.tsx`,
`drawer-description.tsx`, `drawer-body.tsx`, `drawer-footer.tsx`, `drawer-close.tsx`,
`use-drawer-pan.ts`, `AGENTS.md`.

## Playground demos (`apps/playground/src/demos/drawer/`)

`navigation` (hero, start, capture), `filters` (end, chips + slider, capture), `sizes` (capture),
`notifications` (top, capture), `rtl` (forces `side` resolution with an RTL sample — use a
`direction: "rtl"` wrapper only if the resolver reads it; otherwise document), `controlled`.
Route, home row, `testID`s.

## Docs

`apps/web/content/docs/native/components/drawer.mdx`, `meta.json` under `---Overlays---`,
`ITEM_META.drawer` (category `overlays`, dependency `react-native-teleport`), `registry:build`.

## Acceptance

- [ ] All four sides open/close from trigger, `Close`, scrim, back, escape.
- [ ] Swipe toward the edge dismisses past threshold or on fling; the exit continues from the
      finger; a short drag restores; dragging away rubber-bands.
- [ ] `start`/`end` swap under RTL.
- [ ] Panel clears status bar / home indicator on its free sides.
- [ ] A vertically scrolling `Body` scrolls without moving the drawer.
- [ ] Draws over the navigator header and over an open bottom sheet.
- [ ] VoiceOver focus contained; reduce motion fades.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build`; row in the package `AGENTS.md`; folder `AGENTS.md`; changeset
      (`@delacour/react-native-ui` minor, `delacour` patch).
