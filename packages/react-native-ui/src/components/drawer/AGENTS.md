# Drawer

A panel that slides in from an edge and covers the app until dismissed: a navigation menu from the
start edge, a filter panel from the end, a notifications tray from the top. Compound root plus
`Drawer.Trigger`, `Drawer.Content`, `Drawer.Header`, `Drawer.Title`, `Drawer.Description`,
`Drawer.Body`, `Drawer.Footer` and `Drawer.Close`, and `useDrawer()`.

`import { Drawer } from "@delacour/react-native-ui/drawer";`

It is drawn with the [overlay foundation](../overlay/AGENTS.md) — `Overlay.Portal`,
`Overlay.Scrim`, `useOverlayPresence`, `useOverlayBackHandler` — so the app has to mount
`OverlayProvider` once at its root. Without one the drawer draws inline and warns once.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/drawer` |
| `drawer.tsx` | Root — the open state, the ids and the focus refs — and the `Object.assign` compound surface |
| `drawer.context.tsx` | **Leaf.** `DrawerProvider`, `DrawerPanelProvider`, `useDrawer()`, `useDrawerContext()`, `useDrawerPart()`, `useDrawerPanel()` |
| `drawer-trigger.tsx` | `Drawer.Trigger` — donates the open with `asChild`, keeps the trigger's ref for focus return |
| `drawer-content.tsx` | `Drawer.Content` — presence, portal, scrim, edge and extent, insets, slide, swipe, back button, focus |
| `drawer-header.tsx` | `Drawer.Header` — the title column and a ✕ at the trailing edge |
| `drawer-title.tsx` | `Drawer.Title` — a `Text.Header` carrying the title `nativeID` and the focus ref |
| `drawer-description.tsx` | `Drawer.Description` — a muted `Text.Paragraph` |
| `drawer-body.tsx` | `Drawer.Body` — a `ScrollView`, or a plain column with `isScrollable={false}` |
| `drawer-footer.tsx` | `Drawer.Footer` — a row under a hairline |
| `drawer-close.tsx` | `Drawer.Close` — the ✕, or with `asChild` any control that closes |
| `use-drawer-pan.ts` | `useDrawerPan` — the swipe-to-dismiss pan, its threshold haptic and its release |
| `drawer.variants.ts` | The slotted `tv()`, the size table, the release constants and the pure geometry — no RN imports |
| `drawer.variants.test.ts` | Edges both directions, extents, frame extents, offsets, drag, release, exit duration, insets, slots per edge, tokens in both themes |

## Design

- **A side is logical, an edge is physical, and only the edge is ever measured.** `side` is what a
  caller writes — `start`, `end`, `top`, `bottom` — and `resolveDrawerEdge(side, I18nManager.isRTL)`
  turns it into `left`, `right`, `top` or `bottom`. Transforms and a pan's translation are physical
  in React Native whatever the layout direction, so the offset, the drag, the release and the insets
  are all computed against the edge. `useDrawer()` returns both.
- **The panel is placed in a left-to-right frame, and its content gets the app's direction back.**
  React Native swaps `left`/`right` styles under RTL by default (`swapLeftAndRightInRTL`), and an app
  may turn that off; either way a `left-0` class would mean something different from the
  `translateX` beside it. The `positioner` slot is an absolute fill with `direction: "ltr"`, so the
  panel's `edge` classes, its corners and its safe-area padding are physical, and `inner` sets the
  app's direction again so text, rows and the header's ✕ lay out as everywhere else. That is also why
  the spec's `edge` variant could stay keyed on the physical edge.
- **The size is a fraction of the window with a cap.** `sm` 62% to 280, `md` 78% to 320, `lg` 88% to
  400, `full` 94% uncapped — of the width for a start/end drawer, of the height for top/bottom. A
  fraction keeps a strip of the app in view to tap away on; the cap keeps a tablet's drawer a drawer.
  The extent is a fixed width or height rather than a measured one, so the first frame already knows
  how far off-screen the panel starts. **The docked edge's inset is added on top**
  (`resolveDrawerFrameExtent`): the size measures the content, not the band under the status bar. A
  top `sm` drawer once spent 62 of its 280pt there and clipped its third row.
- **Insets go on every side that meets a screen edge.** `resolveDrawerInsets` pads the docked side and
  the two beside it, and nothing on the side facing the app, so a start drawer clears the status bar,
  the home indicator and a landscape notch, and a top drawer does not pad for the home indicator it
  never reaches.
- **Docked corners square, free corners round.** `bg-popover` — a layer over the app, as `Dialog` and
  `BottomSheet` paint — with `rounded-lg`, the card step, only on the two corners facing the app.
- **The swipe continues, it does not spring back.** The pan waits for `DRAWER_PAN_ACTIVE_OFFSET` (10pt)
  along the panel's axis and fails on the same travel across it, so a tap reaches a row and a vertical
  scroll in a start/end drawer's body never moves the drawer. Toward the edge the panel follows the
  finger; away it rubber-bands toward 40pt and never reaches it. On release, past 40% of the extent or
  on a fling toward the edge faster than 800 pt/s dismisses — a fling away always restores. A dismiss
  carries on from where the finger left the panel at the release speed (`resolveDrawerExitDuration`,
  80–220 ms, linear) and closes the state only when it lands; the presence exit then runs off-screen
  and unmounts. A restore eases back in the entrance time.
- **The scrim thins with the drag.** Its opacity is `progress × (1 − dragFraction)`. `Overlay.Scrim`
  takes a writable shared value, so an animated reaction writes the product into one of the drawer's
  own rather than handing it a derived value.
- **A haptic marks the threshold, nothing else.** `selection` each time the drag crosses 40% — the
  moment letting go changes what happens — in both directions, from the worklet through `playHaptic`.
  None on open.
- **The pan's worklets live in the hook.** `useDrawerPan` builds them inside a `useMemo`, so they may
  call `drawer.variants`' module-scope worklets; those are flat — a module-scope worklet never calls
  another function — which is why each restates the edge's sign rather than sharing a helper.
  Per-gesture memory (`isDragging`, `isPastThreshold`) is shared values. A touch that never activated
  returns early from `onFinalize`, so a tap during a dismiss cannot restart a restore under it.
- **Reduce motion fades, and the swipe still works.** Under `useReducedMotion()` the open and close do
  not slide — the panel fades in place on `progress` — but a drag still moves it: that is direct
  manipulation, not animation. `isMotionCalm` does not still it, per the foundation.
- **`isDismissible={false}` turns off every way out the drawer did not offer** — the scrim (which still
  takes the touch), the back button, the escape gesture and the swipe. `Drawer.Close` still closes it.
  `isSwipeDismissible={false}` turns off the swipe alone.
- **Every path to closed is one `setOpen(false)`**, and the root drops a set that does not change the
  value, so a scrim tap during a swipe's exit does not report `onOpenChange(false)` twice.
- **The header writes its own ✕, in the flow.** A row: the title column takes the slack and the ✕
  sits at the trailing edge, so a long title wraps before it and RTL needs no rule. `isCloseHidden`
  drops it. There is no `title` or `description` slot — both are text presets with no layout of their
  own, and `tv` emits `undefined` for an empty slot; the parts merge `className` with `cn()`.
- **The body scrolls by default and takes the slack, and the footer is `mt-auto`**, so the footer sits
  at the panel's end however short the content — even with no body, which the simulator caught: a
  header-and-footer bottom drawer left its footer floating under the header. A top or bottom drawer's pan shares the vertical axis with a scroll — keep that
  content short, or use a `BottomSheet`.
- **It draws in the `modal` band**, over the navigator's header and over an open bottom sheet.
- **Triggers and closes donate the press** with `asChild`, for `BottomSheet.Trigger`'s reason.
- **Accessibility.** The panel is `accessibilityViewIsModal`, `role="dialog"`, labelled by the title's
  `nativeID`; focus moves to the title once the entrance finishes and back to the trigger once the
  exit does. `onAccessibilityEscape` and the back button close it when dismissible. The scrim is not
  accessible. The ✕ is labelled `"Close"`.
- **No blur backdrop.** Frosted scrims need `expo-blur`, not a peer; a follow-up for every overlay.

## Preview capture (not yet shot)

No demo is marked `capture` until a capture tool is available. When one is, these are the settings,
and the flows are in `.argent/flows/previews/drawer/`:

| Demo | Capture |
| --- | --- |
| `navigation` | `{ flow: "drawer/navigation", frame: "device", hero: true }` |
| `filters` | `{ flow: "drawer/filters", frame: "device" }` |
| `sizes` | `{ flow: "drawer/sizes", frame: "device" }` |
| `notifications` | `{ flow: "drawer/notifications", frame: "device" }` |

## Testing

`bun test` reaches the edge resolution in both directions, the extents on a small and a wide window, the frame extent with the docked inset,
the offset, the drag and its rubber band, the drag fraction, the release (threshold, fling toward,
fling away), the exit duration, the insets per edge and the slots per edge with their tokens in both
themes. All four sides from every dismissal path, the swipe's continue-and-restore, the scrolling
body, the z-order over a sheet, VoiceOver and reduce motion are verified on a simulator through
`/drawer` in the playground. RTL needs an app restarted with `I18nManager.forceRTL(true)`; the `rtl`
demo shows the resolution the drawer will make.
