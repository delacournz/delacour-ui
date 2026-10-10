# ContextMenu

The actions that belong to a piece of **content** — a message bubble, a card, a
row — reached by holding the content itself. A [Menu](../menu/AGENTS.md) hangs
off a control that exists to be opened; a context menu has no such control,
because the target is the content. Compound root plus `ContextMenu.Trigger`,
`ContextMenu.Content`, `ContextMenu.Preview` and `ContextMenu.Item`, with Menu's
`Label`, `Separator`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `Sub`,
`SubTrigger`, `SubContent` and `Background` re-exported outright.

`import { ContextMenu } from "@delacour/react-native-ui/context-menu";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/context-menu` |
| `context-menu.tsx` | Root — Menu's `useMenuRootValue` into `MenuRootProvider`, plus this folder's provider; the `Object.assign` |
| `context-menu-trigger.tsx` | `ContextMenu.Trigger` — the wrapper, the hold-vs-tap gesture, the measurement, the accessibility actions |
| `context-menu-content.tsx` | `ContextMenu.Content` — `Menu.Content` with the context defaults; lifts a `Preview` out by type |
| `context-menu-preview.tsx` | `ContextMenu.Preview` — the lifted copy at the trigger's window rect |
| `context-menu-item.tsx` | `ContextMenu.Item` — `Menu.Item` with a trailing icon and a taller row |
| `context-menu.context.tsx` | The invocation, the registered trigger children, `useContextMenuTarget` |
| `context-menu.variants.ts` | The slotted `tv()`, the constants and the pure resolvers — no RN imports |
| `context-menu.variants.test.ts` | Anchor, hold, accessibility, the content defaults against Menu's resolvers, tokens |

## Design

- **The rows and the panel are Menu's, imported from its leaves.** `Menu.Content`,
  `Menu.Item` and the other rows come from `../menu/<leaf>`, never from `../menu`
  — the folder index would pull Menu's root and could close a cycle (rule 3).
  A restyled copy would be a second press fill and a second placement that drift.
- **One recogniser decides up front.** `Gesture.Exclusive(longPress, tap)`, with
  `LongPress().minDuration(delay).maxDistance(slop)`: the tap waits for the hold
  to fail, so a hold that opens the menu never also fires `onPress`. That is why
  `onPress` is the trigger's prop — a pressable inside it would race the hold
  instead of being arbitrated against it. Without `onPress` the tap is not
  installed at all, so an inner control keeps its own taps.
- **A scroll that starts on the trigger still scrolls.** The hold fails once the
  finger drifts past `slop` (12pt), and the scroller takes the touch. The tap's
  `maxDuration` is at least the hold's delay, so a long `delay` never leaves a
  dead window where neither fires.
- **The delay has a 150ms floor.** `resolveHoldConfig` clamps it: anything
  shorter is a tap, and a menu that opens on a tap swallows `onPress`.
- **The content is not cloned or altered**, and need not be pressable. The
  wrapper is a plain `View` that lays out like one — it does not shrink to its
  child — with `collapsable={false}` so Android keeps a node to measure.
- **`point` anchors at the finger, `target` at the wrapper.** The hold's
  `absoluteX/absoluteY` become a zero-size rect, which Menu's
  `resolveMenuPlacement` handles with no special case; `target` is the wrapper's
  `measureInWindow`. Both go to Menu through its reuse contract: `open(rect)`
  on the shared `MenuRootProvider`, and `anchor` on `Menu.Content`.
- **A preview, or a screen reader, forces the target.** With a preview the panel
  must open beside the lifted copy, never across it; a screen-reader open has no
  pointer coordinate. `resolveContextAnchor` is the one place this is decided.
- **A stale invocation is detected by identity.** The trigger records the rect it
  handed to `open()`; Menu keeps that object as its anchor. A parent flipping
  `isOpen` makes Menu measure the trigger itself, the identities differ, and
  Content and Preview fall back to Menu's measured rect rather than last visit's.
- **The preview is drawn through Menu's `backdrop`.** A `Modal` covers everything,
  so a copy above the scrim has to live inside it. `ContextMenu.Preview` is lifted
  out of the rows by type and handed to `Menu.Content`'s `backdrop`: over the
  scrim, behind the panel, fading with both, taking no touches. That prop is the
  one change this component needed from Menu.
- **The preview is a second instance.** It renders the trigger's children again
  (registered in context from an effect), so their local state starts fresh;
  pass `ContextMenu.Preview` children of its own when that matters. It grows
  1 → 1.03 over Menu's 160ms enter and casts `shadow-lg`. The 8pt offset clears
  that growth for any target under ~530pt tall, and a test pins the arithmetic.
  Under reduced motion it does not grow — it still appears.
- **The scrim is on by default.** `hasScrim` is Menu's; ContextMenu defaults it
  to `true` — the content behind is not the menu's control, and the dim says
  where the action now is. A tap on it (or the preview) closes; Android back
  closes through the `Modal`.
- **Defaults differ from Menu's**: below, start-aligned, 8pt offset, 280 wide at
  least — a point anchor has no width to inherit, and Menu's 200 floor is too
  narrow for a trailing icon and a label. `CONTEXT_MENU_CONTENT_DEFAULTS`.
- **Rows are taller and icons trail.** `ContextMenu.Item` is `Menu.Item` with
  `iconPlacement="trailing"` and `min-h-12` merged over the row's `min-h-11`.
  The other row kinds are re-exported unchanged.
- **The haptic fires at hold acceptance**, in the long-press `onStart` on the UI
  thread, before the open crosses to JS. The root's `haptic` is Menu's: played
  when a row is chosen. Both are off by default.

## Accessibility

- The trigger is **one** element (`accessible`): `accessibilityRole="button"` with
  `onPress`, `"none"` without, `accessibilityState={{ disabled, expanded }}`.
- `accessibilityActions`: `activate` and `longpress` labelled "Show menu".
  `activate` runs `onPress`, or opens when there is none; `longpress` opens
  against the target rect. `resolveContextMenuAccessibility` holds the matrix.
- Disabled: announced, and neither the gesture nor either action does anything.
- The panel is Menu's: `menu` / `menuitem` roles and modal containment. The
  preview is hidden from the accessibility tree.

## Out of scope

- **`presentation="bottom-sheet"`** — the same reason as Menu: it would force the
  optional sheet engine on every consumer.
- **Hardware keyboard** — Shift+F10 and the Context Menu key.
- **Gesture Handler's absolute coordinates** are relative to the root view; in an
  app whose root is not the window (a modal screen with an offset), `point` mode
  can land a few points off. Use `anchor="target"` there.
