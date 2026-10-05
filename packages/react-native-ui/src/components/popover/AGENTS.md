# Popover

A small panel anchored to the control that opened it, with the screen around it still visible —
a rename field beside a title, a note on a badge, a short list of options.

`import { Popover, usePopover } from "@delacour/react-native-ui/popover";`

It draws through the overlay foundation, so it needs `OverlayProvider` at the app root and
`react-native-teleport` installed — see [Overlay](../overlay/AGENTS.md). Without the provider it
renders inline and may be clipped.

## Anatomy

```tsx
<Popover isOpen? defaultOpen? onOpenChange? isDismissible?>
  <Popover.Trigger asChild><Button /></Popover.Trigger>
  <Popover.Anchor />                       // optional — anchor to this instead of the trigger
  <Popover.Content placement? align? offset? alignOffset? width? minWidth? maxHeight?
                   isScrollable? isUnstyled? background? hasScrim? scrimClassName?>
    <Popover.Arrow />
    <Popover.Close />
    <Popover.Title /> <Popover.Description />
    …
  </Popover.Content>
</Popover>
```

`usePopover()` returns `{ isOpen, setOpen, close, placement }` — `placement` is the side the panel
actually landed on, after any flip.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/popover` |
| `popover.tsx` | `Popover` — open state, the two anchor measures, the context; the `Object.assign` names every part |
| `popover.context.tsx` | **Leaf.** `PopoverContext`, `usePopover`, and the content context the arrow and title read |
| `popover.position.ts` | **Leaf, pure, imports nothing.** `resolveAnchoredPosition`, `resolvePopoverWidth`, `resolveEnterTranslate`, `resolveTransformOrigin`, `resolveArrowFrame` and their types |
| `popover.position.test.ts` | The placement matrix — every placement and align, flip and no-flip, shift at each edge, `maxHeight`, the arrow, RTL, `alignOffset`, widths, motion geometry |
| `popover.variants.ts` | The slotted `tv()` — `scrim`, `dismissLayer`, `content`, `arrow`, `title`, `description`, `close` — and the numeric constants |
| `popover.variants.test.ts` | Slots, `isUnstyled`, tokens in both themes, the arrow inset against `--radius` |
| `use-anchor-measure.ts` | **Leaf.** `useAnchorMeasure` — `measureInWindow` on enable and on window-size change |
| `use-anchored-content.ts` | **Leaf.** `useAnchoredContent` — the off-screen measure frame, the resolve, presence, the animated style |
| `popover-arrow.tsx` | **Leaf.** `AnchoredArrow` (placement passed in) and `Popover.Arrow` (placement read from the panel) |
| `popover-trigger.tsx` | `Popover.Trigger` — `Pressable`, or `asChild` to donate the press; the default anchor |
| `popover-anchor.tsx` | `Popover.Anchor` — a non-collapsing `View`, or `asChild` |
| `popover-content.tsx` | `Popover.Content` — the portal, the dismiss layer or scrim, the panel |
| `popover-title.tsx` | `Popover.Title` — `Text.Label` as a header, the panel's label |
| `popover-description.tsx` | `Popover.Description` — `Text.Caption` |
| `popover-close.tsx` | `Popover.Close` — the corner ✕, or `asChild` around a button |

## The anchored leaves — Tooltip imports them

Tooltip, and later Menu, Context Menu and Select, are anchored panels too. They import
`popover.position.ts`, `use-anchor-measure.ts`, `use-anchored-content.ts` and `popover-arrow.tsx`
**directly**, never `./popover` or `./index` — package rule 3's leaf exception. **None of the four
may import `./popover`, `./index` or any part file.** `popover-arrow.tsx` reads
`popover.context.tsx`, itself a leaf; the other three import only `popover.position.ts`, the
variants and the overlay foundation. Break that and a Tooltip import closes a cycle Metro serves
half-initialised.

## Design

- **Placement is a preference, and the rules are a test each.** `resolveAnchoredPosition` keeps
  the preferred side, and flips to the opposite **only** when the preferred side cannot hold the
  panel *and* the opposite has more room — a panel that fits nowhere does not ping-pong to a side
  that is just as bad. Then it aligns along the cross axis, shifts to stay inside
  `window − safe area − 8pt`, and clamps both axes, so it is never off-screen. `maxHeight` is
  `min(maxHeight, room on the resolved side)`, which is what keeps a tall panel on screen.
- **`align` is logical on top and bottom.** Under RTL `start` is the right edge; on a side
  placement it is always the top. `alignOffset` nudges inward from whichever edge is aligned.
- **The arrow points at the anchor's centre, not the panel's.** After a shift the panel is no
  longer centred on its trigger; the arrow still is, clamped `POPOVER_ARROW_INSET` clear of each
  corner so it never hangs off the curve. The inset is the card radius plus the arrow's
  half-diagonal, pinned against `tokens.css`'s `--radius` by a test.
- **The arrow is a square turned 45°, bordered on two edges.** `resolveArrowFrame` turns its
  bordered corner toward the anchor in each placement, so the two bordered edges are the ones
  outside the panel and the bare inner half covers the panel's own border where they meet.
- **Measured in window coordinates, placed by translate.** `measureInWindow` is what makes a
  trigger inside a `ScrollView`, a bottom sheet or under the header land the panel in the right
  place — the panel is teleported to a host that fills the window. The panel sits at the window's
  origin and moves by `translateX/Y`, never `left`/`top`: a translate is not layout, so moving it
  never re-wraps a content-fit panel and never fires another `onLayout`.
- **The panel sits inside a positioner, and the safe-span cap is on the positioner.** The
  positioner is measured, translated and animated, and carries `maxWidth` = the safe span; the
  panel inside it carries the classes and the resolved width and `maxHeight`. An inline
  `maxWidth` on the panel itself beat every class, so a caller's `max-w-64` was silently ignored
  — found on a simulator with the `arrow` demo.
- **One invisible frame before the entrance.** The panel mounts at opacity 0, reports its size,
  is resolved, and only then is presence told to open — so the entrance always starts from the
  right side and the right place. Presence follows `isOpen && position !== null`; the exit does
  not wait for anything.
- **The entrance comes from the anchor.** A 6pt slide back toward the anchor and a `0.96 → 1`
  scale about the arrow (`transformOrigin`), driven by presence's `progress`. Under reduce motion
  both collapse and only the fade runs. A window-size change — a rotation — re-measures the anchor
  a frame later and moves the panel there directly, with no animation.
- **The keyboard is the bottom of the screen.** `useAnchoredContent` tracks keyboard-controller's
  show/hide events and takes `max(safe bottom, keyboard height)` as the bottom inset, so a field
  inside the panel flips it above its trigger instead of typing under the keyboard.
- **Outside taps close, and are swallowed.** Under the panel sits an invisible absolute-fill
  React Native `Pressable` — or `Overlay.Scrim` with `hasScrim` — that closes on a tap when
  dismissible. It never passes the tap through: the mobile convention, and the reason a tap
  outside never presses the button under it. With `isDismissible={false}` it still takes the
  touch and does nothing, for the scrim's reason.
- **`width`.** `"trigger"` is the anchor's measured width, `"full"` the safe span, a number as
  given, each raised to `minWidth` and capped at the safe span; `"content-fit"` (the default)
  lets the content size itself, with `minWidth` as a floor and the safe span as `maxWidth`.
- **`isScrollable` wraps the body in a `ScrollView`, and lifts `Popover.Arrow` out of it** —
  detected by element type — so the arrow is never scrolled or clipped. Without it a body taller
  than `maxHeight` is cut off.
- **`isUnstyled` strips the surface, the border, the corner and the padding** of the panel and the
  arrow's paint, keeping the gap. `background` is drawn absolutely behind the content, for a
  caller painting their own surface.
- **Triggers donate the press.** `Popover.Trigger asChild` hands the toggle to the child's
  `onPress` and composes the measuring ref onto the child's, for `BottomSheet.Trigger`'s reason —
  so the child must be built on `Pressable`. It reports `accessibilityState.expanded`.
- **`Popover.Anchor` takes the measuring from the trigger while it is mounted.** The root keeps one
  `useAnchorMeasure` per candidate and enables only the one in use; the trigger still opens the
  panel and still takes focus back.
- **Modal for assistive technology.** The panel is `accessibilityViewIsModal`, `role="dialog"`,
  labelled by the title's `nativeID`; on entry focus goes to the title (or the panel), on exit back
  to the trigger, and `onAccessibilityEscape` closes it. Android back closes it while it is the top
  overlay (`useOverlayBackHandler`).
- **Draws in the `anchored` band.** Over every sheet and over the dialog it was opened from — the
  foundation's z-order.

## Out of scope

- A sheet presentation on small screens — compose `BottomSheet` instead.
- A frosted backdrop — needs `expo-blur`, not a peer.
- Following an anchor that scrolls while the panel is open — the panel stays where it opened.

## Testing

`bun test` reaches the position resolver and the variants. Everything else — the measure frame,
the motion, the keyboard, dismissal, focus — is verified on a simulator through
`apps/playground`'s `/popover` gallery, whose `edge-collision` demo puts triggers in the four
corners to prove flip and shift.
