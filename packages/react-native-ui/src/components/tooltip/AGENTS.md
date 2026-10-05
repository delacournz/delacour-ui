# Tooltip

A short label naming the control under the finger — what an icon-only button does, a shortcut, a
one-line hint. It is not interactive: anything with a button in it is a [Popover](../popover/AGENTS.md).

`import { Tooltip } from "@delacour/react-native-ui/tooltip";`

It draws through the overlay foundation, so it needs `OverlayProvider` at the app root and
`react-native-teleport` installed — see [Overlay](../overlay/AGENTS.md). The provider is also what
hears an outside tap; without it the tooltip renders inline, may be clipped, and closes only on its
timer or the trigger.

## Anatomy

```tsx
<Tooltip isOpen? defaultOpen? onOpenChange? openOn? duration? label?>
  <Tooltip.Trigger asChild><Button size="icon-md" variant="ghost" /></Tooltip.Trigger>
  <Tooltip.Content placement? align? offset? alignOffset? variant? width? minWidth? maxHeight? isScrollable?>
    <Tooltip.Arrow />
    <Tooltip.Text />                         // inverted: the one line
    <Tooltip.Title /> <Tooltip.Description /> // surface: a heading and a line
  </Tooltip.Content>
</Tooltip>
```

`useTooltip()` returns `{ isOpen, setOpen, close }`.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/tooltip` |
| `tooltip.tsx` | `Tooltip` — open state, the screen-reader check, activation, the outside-tap subscription, the one-open-at-a-time rule; the `Object.assign` names every part |
| `tooltip.context.tsx` | **Leaf.** `TooltipContext`, `useTooltip`, and the content context the arrow and text read |
| `tooltip.variants.ts` | The slotted `tv()` — `content`, `arrow`, `text`, `title`, `description` per variant — the defaults, and the pure `resolveTooltipDuration`, `shouldTooltipActivate`, `resolveTooltipAccessibility`, `readableTextOf` |
| `tooltip.variants.test.ts` | Both variants and their tokens in both themes, the three resolvers, the defaults |
| `tooltip-trigger.tsx` | `Tooltip.Trigger` — `Pressable`, or `asChild` to donate the long press or the press; the anchor; the label or hint |
| `tooltip-content.tsx` | `Tooltip.Content` — the portal, the panel, the timer |
| `tooltip-arrow.tsx` | `Tooltip.Arrow` — Popover's `AnchoredArrow` in the variant's paint |
| `tooltip-text.tsx` | `Tooltip.Text` — `Text.Caption`, inked for the variant |
| `tooltip-title.tsx` | `Tooltip.Title` — `Text.Label`, for the surface variant |
| `tooltip-description.tsx` | `Tooltip.Description` — `Text.Caption`, for the surface variant |

## Builds on Popover's leaves

`popover/popover.position.ts`, `popover/use-anchor-measure.ts`, `popover/use-anchored-content.ts`,
`popover/popover-arrow.tsx` and `popover/popover.variants.ts` are imported **directly**, never
`../popover` — package rule 3's leaf exception, written down in Popover's own doc. So the tooltip
measures, flips, shifts, clamps and aims its arrow exactly as a popover does, and none of it is
re-tested here. It keeps Popover's collision padding and arrow inset; the inset is sized for the
card corner, which is larger than the inverted chip's `rounded-md`, so it clears both.

## Design

- **A long press opens it, so the control keeps its tap.** Mobile has no hover. A tooltip that
  opened on a tap would take the tap from the button it names, so the default `openOn` is
  `"longPress"`, with a `selection` haptic — fired from the UI thread through `playHaptic`, because
  `Pressable`'s `haptic` plays on press-in, which is every tap. The trigger's own `onLongPress`
  still runs, after the tooltip's. A tap shorter than the long-press delay still presses the
  button; one held past it fails as a tap, so a long press never also presses it. `openOn="press"`
  is for a trigger with no tap of its own — an info glyph.
- **`asChild` donates the gesture.** For `Popover.Trigger`'s reason: a `Button` inside a pressable
  trigger would win the touch and the tooltip would never open. The trigger hands its handler to
  the child as `onLongPress` or `onPress`, chained ahead of the child's own by `mergeProps`, and
  composes the measuring ref onto the child's — so the child has to be built on `Pressable`.
- **An outside tap closes it and still lands.** Popover swallows an outside tap behind an invisible
  catcher, which is right for a panel with things to press in it and wrong for a label: a tooltip
  in the way of the next tap would make the app feel stuck. So there is no catcher. The panel is
  `pointerEvents="none"` — a tap on it falls through too — and the tooltip subscribes, while open,
  to `OverlayProvider`'s `subscribeTouchStart`, which hears every touch starting anywhere beneath
  the provider without claiming it, and closes. Only the provider can do this: nothing else is an
  ancestor of a view the tooltip knows nothing about. See [Overlay](../overlay/AGENTS.md).
- **The trigger again closes it, and that rides on bubbling order.** A touch on the trigger reaches
  the trigger's `onTouchStart` before it bubbles to the provider, so the trigger records whether
  the tooltip was open when this touch began; then the provider closes it; then the long press or
  press arrives and, seeing it was open, leaves it closed rather than re-opening what the touch
  just shut. In long-press mode a plain tap on the trigger closes it too — the user has moved on to
  the button.
- **It hides itself.** `duration` ms (1500 by default) after the entrance settles, so a slow
  entrance never eats into the time the words are on screen. `0` keeps it until an outside tap or
  the trigger. A negative or non-finite duration is a mistake, not a request to vanish, and takes
  the default (`resolveTooltipDuration`).
- **One at a time.** A module-level slot holds the open tooltip's id and close; opening another
  closes it. Two labels pointing at two controls at once say nothing about either.
- **`inverted` is the default look.** The foreground colour as the fill and the background colour
  as the ink reads over anything in either theme, which is what a label floating over arbitrary
  content needs; a compact `rounded-md` chip sized for one caption-sized line. `surface` is the
  popover card — fill, hairline, card corner — with room for `Tooltip.Title` over
  `Tooltip.Description`. The text parts read the variant from the panel, so neither needs a class
  at the call site.
- **The arrow is Popover's, repainted.** `AnchoredArrow` with `isUnstyled`, so Popover's paint is
  stripped and the variant's `arrow` slot is all there is: fill alone on the borderless chip, fill
  plus the border on its two outer edges on the card.
- **Motion is a fade and 4pt.** From `useAnchoredContent`: an invisible measure frame, then a fade
  and a 4pt slide from the resolved side, with no scale — a label appears, it does not grow.
  Under reduce motion only the fade runs.

## Accessibility

- **The trigger carries the words.** `resolveTooltipAccessibility`: `label` becomes the trigger's
  `accessibilityLabel` when it has none — an icon button — or its `accessibilityHint` when it does;
  a label identical to the trigger's is dropped rather than read twice. An `asChild` trigger's
  label is read off the child's props, and visible text counts as a label (`readableTextOf`): a
  `<Button>Sync now</Button>` is already named, and an early build replaced "Sync now" with the
  tooltip's words — found on a simulator with the `surface` demo. So VoiceOver says the tooltip's words without anything
  opening.
- **The panel is never read and never takes focus.** `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` on the positioner; non-modal overlays never move
  focus (the overlay plan's rule). Reading it as well would say everything twice.
- **With a screen reader on, a long press does not open it** (`shouldTooltipActivate`) — the words
  already reached the trigger, and double-tap-and-hold is an action. A press tooltip still opens,
  for someone using zoom alongside VoiceOver, and then never times out
  (`resolveTooltipDuration`): they read at their own pace.
- **Android back closes it** while it is the top overlay, so a tooltip opened over a popover does
  not leave back doing nothing.

## Out of scope

- Following a trigger that scrolls while open — the panel stays where it opened, as Popover's does,
  and the timer clears it soon after.
- Interactive content. A button in a tooltip cannot be pressed; that is a `Popover`.

## Testing

`bun test` reaches the variants and the three resolvers. Positioning is Popover's and tested there.
Everything else — the long press and its haptic, the button's tap surviving it, the timer, an
outside tap closing it and still landing, one-at-a-time, VoiceOver reading `label` — is verified on
a simulator through `apps/playground`'s `/tooltip` gallery.

Preview media is not captured yet (see the overlay plan); the flows are in
`.argent/flows/previews/tooltip/`. When a capture tool is back, mark these `capture`:
`icon-buttons` `{ flow: "tooltip/icon-buttons", frame: "device", hero: true }`, and `press`,
`placements`, `surface` `{ flow: "tooltip/<id>", frame: "device" }`.
