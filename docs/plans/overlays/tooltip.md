# OVL-P2-TOOLTIP — Tooltip

`import { Tooltip } from "@delacour/react-native-ui/tooltip";`

**Phase P2.** Start only after Popover (OVL-P1-POPOVER) has been merged into the category branch
you branch from. If `src/components/popover/popover.position.ts` does not exist in your checkout,
stop and report — do not rebuild it.

## Purpose on mobile

A short label naming the control under the finger — what an icon-only button does, a keyboard
shortcut, a one-line hint. Mobile has no hover, so a tooltip opens on **long press** by default,
leaving the control's tap alone; `openOn="press"` is for a control with no tap of its own (an
info glyph). It disappears on its own. It is not interactive — anything with a button in it is a
`Popover`.

## Builds on

- Popover's leaves (rule 3, imported directly, never `../popover` index):
  `../popover/popover.position` (`resolveAnchoredPosition`), `../popover/use-anchor-measure`,
  `../popover/use-anchored-content`, `../popover/popover-arrow` (`AnchoredArrow`). Read
  `popover/AGENTS.md` first.
- `@delacour/react-native-ui/overlay`: `Overlay.Portal layer="anchored"`, `useOverlayPresence`.
- `Pressable` (`onLongPress`, `haptic`), `Text` presets.

No new peer dependency.

## API

```tsx
type TooltipProps = {
	isOpen?: boolean;
	defaultOpen?: boolean; // false
	onOpenChange?: (isOpen: boolean) => void;
	openOn?: "longPress" | "press"; // "longPress"
	/** Auto-hide after this many ms. 0 = until an outside tap or the trigger again. Default 1500. */
	duration?: number;
	/** The text a screen reader reads for the trigger — the tooltip's words without opening it. */
	label?: string;
	children: ReactNode;
};
type TooltipTriggerProps = PressableProps; // asChild donates onLongPress / onPress, chained ahead of the child's own
type TooltipContentProps = ViewProps & {
	className?: string;
	placement?: PopoverPlacement; // "top"
	align?: PopoverAlign;         // "center"
	offset?: number;              // 6
	alignOffset?: number;         // 0
	variant?: "inverted" | "surface"; // "inverted"
	width?: PopoverWidth;         // "content-fit"
	minWidth?: number;
	maxHeight?: number;
	isScrollable?: boolean;
};
type TooltipArrowProps = { className?: string };
type TooltipTextProps = TextPresetProps;        // the one-line label
type TooltipTitleProps = TextPresetProps;       // surface variant
type TooltipDescriptionProps = TextPresetProps; // surface variant
```

```tsx
<Tooltip label="Share" openOn="press">
  <Tooltip.Trigger asChild><Button size="icon-md" variant="ghost"><Icon icon={IconShare} /></Button></Tooltip.Trigger>
  <Tooltip.Content><Tooltip.Arrow /><Tooltip.Text>Share</Tooltip.Text></Tooltip.Content>
</Tooltip>
```

## Behaviour

- Long press (Pressable's default delay) opens with a `selection` haptic; the trigger's own
  `onLongPress` still runs. `openOn="press"` opens on tap instead.
- Timer: `duration` ms after the entrance settles, hide. A second activation of the trigger while
  open hides it. Any outside tap hides it — through a transparent layer that **passes the touch
  through** (`pointerEvents="box-none"` content; dismissal by a `Gesture.Tap()` on a
  `GestureDetector` that does not block — or, simpler, close on the next `onTouchStart` captured
  at the viewport). Pure `resolveTooltipDuration(duration, { isScreenReaderEnabled })` → a screen
  reader never needs it (see a11y), so with one on the tooltip does not open from a long press at
  all unless `openOn="press"`.
- Opening one tooltip closes any other open tooltip (module-level "current" id).

## Variants (`tooltip.variants.ts`)

`variant`: `inverted` — `bg-foreground`, text `text-background`, `rounded-md`, compact padding,
`Text.Caption`-sized; `surface` — `bg-popover`, `border border-border`, `rounded-lg`, padding for a
title + description. Slots `content`, `arrow` (matches the variant's fill/border), `text`, `title`,
`description`. Tokens in both themes.

## Accessibility

`label` becomes the trigger's `accessibilityLabel` when the trigger has none, otherwise its
`accessibilityHint` — so VoiceOver says the tooltip's words without opening anything. The tooltip
panel is hidden from assistive technology (`accessibilityElementsHidden`,
`importantForAccessibility="no-hide-descendants"`) to avoid reading it twice, and never takes
focus.

## Motion

From `use-anchored-content`: off-screen measure frame, then fade + 4pt from the resolved side.
Reduce motion: fade only.

## Pure logic to unit-test (write first)

`tooltip.variants.test.ts` (both variants, tokens), `resolveTooltipDuration`,
`resolveTooltipAccessibility({ label, triggerLabel })` → `{ accessibilityLabel?, accessibilityHint? }`.
Positioning is Popover's and already tested — do not re-test it.

## Files

`index.ts`, `tooltip.tsx`, `tooltip.context.tsx`, `tooltip.variants.ts` (+ test),
`tooltip-trigger.tsx`, `tooltip-content.tsx`, `tooltip-arrow.tsx`, `tooltip-text.tsx`,
`tooltip-title.tsx`, `tooltip-description.tsx`, `AGENTS.md`.

## Playground demos (`apps/playground/src/demos/tooltip/`)

`icon-buttons` (hero, toolbar of icon buttons, capture), `press` (info glyph, capture),
`placements` (capture), `surface` (title + description, capture), `persistent` (`duration={0}`),
`controlled`. Route, home row, `testID`s.

## Docs

`tooltip.mdx`, `meta.json` under `---Overlays---`, `ITEM_META.tooltip`, `registry:build`.

## Acceptance

- [ ] Long press on an icon button shows the label, haptic fires, button's tap still works.
- [ ] `openOn="press"` opens on tap; auto-hides after `duration`; `0` stays.
- [ ] Flips/shifts at screen edges; arrow points at the trigger centre.
- [ ] An outside tap hides it and still reaches what was tapped.
- [ ] VoiceOver reads `label` on the trigger; the tooltip itself is never read.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build`; package `AGENTS.md` row; folder `AGENTS.md`; changeset.
