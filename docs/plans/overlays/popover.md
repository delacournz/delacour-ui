# OVL-P1-POPOVER — Popover

`import { Popover } from "@delacour/react-native-ui/popover";`

## Purpose on mobile

A small panel anchored to the control that opened it, keeping the screen around it visible: a
rename field beside a title, a "what changed" note on a badge, a short list of options. Placement
is a preference, not a promise — the panel flips and slides to stay on screen.

**Popover is also the anchored foundation for Tooltip (OVL-P2-TOOLTIP) and, in another category,
Menu, Context Menu and Select.** The anchoring pieces are therefore leaves other folders may import
(rule 3): keep them free of any import from `./popover` or `./index`.

## Builds on

- `@delacour/react-native-ui/overlay` (OVL-P0): `Overlay.Portal layer="anchored"`,
  `Overlay.Scrim` (optional dimming), `useOverlayPresence`, `useOverlayBackHandler`. Read its
  `AGENTS.md` first.
- `react-native-safe-area-context` (safe-area bounds), `useWindowDimensions`, `measureInWindow`.
- `Pressable`, `Slot`, `Text` presets, `Icon`, `ScrollView`.
- Read `bottom-sheet/AGENTS.md` for trigger donation.

No new peer dependency.

## API

```tsx
type PopoverPlacement = "top" | "bottom" | "left" | "right";
type PopoverAlign = "start" | "center" | "end";
type PopoverWidth = number | "trigger" | "content-fit" | "full";

type PopoverProps = {
	isOpen?: boolean;
	defaultOpen?: boolean; // false
	onOpenChange?: (isOpen: boolean) => void;
	/** Outside tap, Android back, escape gesture close it. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};
type PopoverTriggerProps = PressableProps; // asChild donates onPress; the trigger is measured
/** Anchor to a different view than the trigger. Optional. */
type PopoverAnchorProps = ViewProps & { asChild?: boolean };
type PopoverContentProps = ViewProps & {
	className?: string;
	placement?: PopoverPlacement; // "bottom"
	align?: PopoverAlign;         // "center"
	offset?: number;              // 8
	alignOffset?: number;         // 0
	width?: PopoverWidth;         // "content-fit"
	minWidth?: number;
	maxHeight?: number;           // clamped to the space available on the resolved side
	isScrollable?: boolean;       // false
	/** No surface, border, padding — draw your own with `background`. */
	isUnstyled?: boolean;
	background?: ReactNode;
	/** Dim the app behind the panel. Default false — outside taps still close. */
	hasScrim?: boolean;
	scrimClassName?: string;
};
type PopoverArrowProps = { className?: string };
type PopoverTitleProps = TextPresetProps;
type PopoverDescriptionProps = TextPresetProps;
type PopoverCloseProps = /* same discriminated union as Dialog.Close */;

function usePopover(): { isOpen: boolean; setOpen(v: boolean): void; close(): void; placement: PopoverPlacement /* resolved */ };
```

```tsx
<Popover>
  <Popover.Trigger asChild><Button variant="secondary">Rename</Button></Popover.Trigger>
  <Popover.Content width="trigger" minWidth={260} align="start">
    <Popover.Arrow />
    <Popover.Title>Rename</Popover.Title>
    <Input value={name} onChangeText={setName} />
  </Popover.Content>
</Popover>
```

## Anchoring — the exported leaves

| File | What | Imported by |
| --- | --- | --- |
| `popover.position.ts` | **Pure.** `resolveAnchoredPosition(input): AnchoredPosition` and its types | Tooltip, later Menu/Select |
| `popover.position.test.ts` | the matrix below | |
| `use-anchor-measure.ts` | `useAnchorMeasure()` → `{ ref, rect, measure }`; `measureInWindow` on open and on window-size change | Tooltip |
| `use-anchored-content.ts` | the hook that measures the content off-screen on its first frame (opacity 0), resolves the position and returns animated styles that enter from the resolved side | Tooltip |
| `popover-arrow.tsx` | `AnchoredArrow` (also `Popover.Arrow`) — a rotated square half under the panel, positioned by `arrowOffset` | Tooltip |

```ts
type AnchorRect = { x: number; y: number; width: number; height: number };
type AnchoredInput = {
	anchor: AnchorRect;
	content: { width: number; height: number };
	bounds: { width: number; height: number; insets: { top: number; right: number; bottom: number; left: number } };
	placement: PopoverPlacement; align: PopoverAlign;
	offset: number; alignOffset: number;
	/** Keep this far from the bounds' safe edges. 8. */
	collisionPadding: number;
	/** The panel's corner radius; the arrow never sits inside it. */
	arrowInset: number;
	maxHeight?: number;
	isRTL: boolean; // align start/end are logical on top/bottom placements
};
type AnchoredPosition = {
	x: number; y: number;
	placement: PopoverPlacement;   // after flip
	maxHeight: number;             // clamped to the room on the resolved side
	arrowOffset: number;           // along the panel edge, toward the anchor's centre
};
```

Rules (each a test): prefer `placement`; flip to the opposite side **only** if the preferred side
lacks room and the opposite has more; after placing, shift along the cross axis to stay inside
`bounds − insets − collisionPadding`; never off-screen; `maxHeight` is `min(maxHeight, room)`;
`arrowOffset` points at the anchor's centre and is clamped to `[arrowInset, size − arrowInset]`;
`align` start/end mirror under RTL for top/bottom; `alignOffset` nudges along the cross axis;
`width: "trigger"` resolves to the anchor's width before positioning (`resolvePopoverWidth`).

## Dismissal

Inside the portal, below the panel: a transparent absolute-fill `Pressable` (or the scrim when
`hasScrim`) that closes on tap when dismissible. It swallows the tap — the mobile convention; it
does not pass through to what is under it. `useOverlayBackHandler` for Android back.

## Motion

Off-screen measure frame, then `progress` drives opacity and a translate of 6pt from the anchor
side (a panel placed below enters downward from the trigger) plus scale `0.96 → 1` with the
transform origin at the arrow. Reduce motion: opacity only. On window-size change while open
(rotation), re-measure and re-place without animation.

## Variants (`popover.variants.ts`)

Slots: `scrim`, `dismissLayer`, `content` (`bg-popover`, `border border-border`, `rounded-lg`,
padding, gap; `isUnstyled` strips all four), `arrow` (`bg-popover`, the same border on its two
outer edges), `title`, `description`, `close`. Tokens in both themes.

## Accessibility

Panel `accessibilityViewIsModal`, `role="dialog"`, labelled by the title when there is one; focus
moves to the first element on enter and back to the trigger on exit; `onAccessibilityEscape`
closes. Trigger gets `accessibilityState={{ expanded: isOpen }}`.

## Pure logic to unit-test (write first)

`popover.position.test.ts` (all four placements, all three aligns, flip, no-flip when the
opposite is worse, cross-axis shift at each edge, maxHeight clamp, arrow tracking and clamping,
RTL align, alignOffset, `width: "trigger"`), `popover.variants.test.ts` (slots, unstyled, tokens).

## Files

`index.ts`, `popover.tsx`, `popover.context.tsx`, `popover.position.ts` (+ test),
`popover.variants.ts` (+ test), `use-anchor-measure.ts`, `use-anchored-content.ts`,
`popover-trigger.tsx`, `popover-anchor.tsx`, `popover-content.tsx`, `popover-arrow.tsx`,
`popover-title.tsx`, `popover-description.tsx`, `popover-close.tsx`, `AGENTS.md` — which must
document the leaf files and that Tooltip imports them.

## Playground demos (`apps/playground/src/demos/popover/`)

`basic` (hero, capture), `placements` (four triggers, capture), `arrow` (capture),
`trigger-width-form` (input, keyboard, capture), `scrollable` (maxHeight), `edge-collision`
(triggers in the screen corners — proves flip and shift), `unstyled`, `scrim`. Route, home row,
`testID`s.

## Docs

`popover.mdx`, `meta.json` under `---Overlays---`, `ITEM_META.popover`, `registry:build`.

## Acceptance

- [ ] Opens below by default, flips above near the screen bottom, shifts to stay inside the safe
      area at both side edges; arrow keeps pointing at the trigger centre.
- [ ] `width="trigger"` matches the trigger; `maxHeight` + `isScrollable` scroll.
- [ ] Outside tap closes (and does not press what is under it); Close and back close.
- [ ] Draws over a bottom sheet and the navigator header; works from inside a `ScrollView`
      (measured in window coordinates).
- [ ] Rotation re-places an open popover.
- [ ] VoiceOver focus contained; reduce motion fades.
- [ ] The leaf files import nothing from `./popover` / `./index` (a Tooltip import cannot cycle).
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build`; package `AGENTS.md` row; folder `AGENTS.md`; changeset.
