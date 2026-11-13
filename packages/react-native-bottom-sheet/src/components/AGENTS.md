# components

The compound `BottomSheet` and its parts. Every part accepts `style` and `ref`;
none takes a class; every `displayName` is `DelacourBottomSheet.BottomSheet.X`.

## Files

| Path | What |
| --- | --- |
| `bottom-sheet.tsx` | The root — state, geometry, animation, pans, intents, the imperative ref, and the `Object.assign` that names the parts |
| `bottom-sheet.types.ts` | Every prop type, `BottomSheetRef`, `BottomSheetContextValue`, `BottomSheetAnimatedValue` |
| `bottom-sheet.context.tsx` | Three contexts: `BottomSheet` (open state and ref methods), `BottomSheetAnimated` (the shared values), `BottomSheetInternal` (what the parts share) |
| `bottom-sheet-trigger.tsx` | Opens the sheet; `asChild` donates `onPress`; reports `expanded`; the node focus returns to |
| `bottom-sheet-portal.tsx` | The frame the sheet measures itself against — inside a teleport `Portal` to the nearest host under a provider, in place with `inline` or without one; registers the sheet as presented |
| `bottom-sheet-overlay.tsx` | The scrim: a React Native `Pressable`, written before the panel |
| `bottom-sheet-container.tsx` | The panel — the surface that moves; inset by `detachedFrame` and `box-none` when detached |
| `bottom-sheet-background.tsx` | The panel's absolute-fill surface, `pointerEvents: none`; exactly the sheet's `height` tall when detached |
| `bottom-sheet-handle.tsx` | The grabber's row: the handle pan and the adjustable accessibility element |
| `bottom-sheet-content.tsx` | The static body: the content pan, the `bodyClip` clip, the `contentArea + bodyInset` layout box, the measured inner box and the inset spacer |
| `bottom-sheet-footer.tsx` | The sticky footer: translated to `footerTop`, its styled box padded through the band and measured less the band into `footerContentHeight` |
| `bottom-sheet-close.tsx` | The dismiss control; `asChild` donates `onPress` |
| `bottom-sheet-title.tsx` | The heading; publishes the `nativeID` the panel is labelled by; the node focus lands on |
| `bottom-sheet-description.tsx` | Supporting copy; publishes a `nativeID` of its own |

`Host` and `Provider` live in `src/portal` and are named on the compound from
there. Parts that arrive later: `Footer` and `TextInput` (BSHEET-3), `ScrollView`,
`FlatList` and `SectionList` (BSHEET-4), `Steps` and `Step` (BSHEET-6b).

## The render tree

```
teleport Portal — only under a provider (absoluteFill of the host, zIndex from the registry)
 Portal — the frame (absolute, top: topInset, box-none, overflow hidden, zIndex; measures the container)
  Overlay  (absoluteFill — margins and gap included, opacity from index, pointerEvents auto|none, RN Pressable)
  Container — the panel (absoluteFill, translateY: position; detached: left/width from detachedFrame, overflow visible, box-none)
    Background (absoluteFill, pointerEvents none; detached: height = sheet height)
    Handle     (pan detector; measures handleHeight)
    Content    (pan detector; clip: overflow hidden, animated maxHeight = bodyClip)
      layout box (animated maxHeight = contentArea + bodyInset; height too under fillParent)
        inner box (measures contentHeight) + trailing spacer (bodyInset, + footerGap above a footer)
    Footer     (absolute, translateY: footerTop; the styled box pads through the band, measures footerContentHeight = box − band)
```

The overlay is written **before** the panel on purpose. Native hit-testing
walks siblings back to front, so a touch on the panel never reaches the
overlay and a touch beside it does — with no Gesture Handler tap anywhere to
out-compete a `TextInput`. That was the first risk in the plan, and it holds
on the simulator: a field inside the sheet focuses on the first tap.

## State opens, intents move

`isOpen` — controlled through `isOpen`/`onOpenChange`, or held by the root —
is the one source of truth for whether the sheet is open. Flipping it true
sets `presented` (which mounts the portal's children) and dispatches an
`open` intent, which resolves once every measurement has landed. Every close
path — swipe, overlay, `Close`, the ref, a controlled `isOpen: false` —
animates to the closed height, and the settle at `-1` is what flips `isOpen`
back and unmounts the children. Closing a sheet that is not open is nothing.

Opening a sheet that is still closing turns it round. A swipe, an overlay
press or a `Close` leaves `isOpen` true until the close settles, so the ref's
`open()` (and so `Trigger`) dispatches an `open` intent when `isOpen` is
already true, instead of a `setOpen(true)` that would change nothing. The
interrupted close never settles, so `onClose` does not fire.

The ref's `close()` checks the sheet's effective openness on the JS thread
before dispatching, so a `close()` while a queued open is still waiting on
layout clears the queue rather than racing it.

## Accessibility

No `accessible` container: one would collapse the whole sheet into a single
VoiceOver element. The rules live in `core/modal-accessibility.ts` and
`accessibility/use-sheet-accessibility.ts`; the parts only read what the root
resolved.

- **Modal.** The panel is `accessibilityViewIsModal` while the sheet is open,
  the root's `modal` prop is true (the default), no `Overlay` has
  `enableTouchThrough` (the overlay registers its kind — `none`, `blocking` or
  `touch-through` — and a touch-through scrim makes the sheet non-modal) and
  the sheet is the top of its host (`isModalTop` over the registry; no registry means every sheet is its
  own top). A scrim is not required. Pass `modal={false}` for a persistent
  drawer that leaves the app reachable — such a sheet also moves no focus.
  Descendants are hidden while it is closed, and the title labels it.
- **Escape.** `onAccessibilityEscape` is on the panel while it is modal and
  dismissible (`enablePanDownToClose`, and the current step's `dismissible`).
  VoiceOver delivers escape to the focused element and its ancestors, so it
  works from any row inside the sheet. The handle's escape action and gesture
  obey the same dismissible flag.
- **Focus in.** Once the sheet has settled open, focus moves to `Title`, else the
  panel, through `sendAccessibilityEvent(node, "focus")`.
- **Focus out.** Once the close has settled, focus returns to `Trigger` if it is
  still mounted. `Trigger` also reports `accessibilityState.expanded` while open;
  with `asChild` the child has to take a `ref`.
- **Not contained here.** The panel hides only its siblings in the teleport host.
  Hiding the app itself (TalkBack, and VoiceOver for the app view) is the
  provider-owning skin's job; the engine has no handle on the app's view.
- The handle is the sheet's one `adjustable` element: increment and decrement
  move a snap point, and its value reads `SnapPoint i of n`. The overlay is
  hidden from assistive technology while it is transparent.

## Contexts

All three are provided once, by the root. A teleported portal keeps the React
tree in place, so they reach every part without being re-provided — and so
does every context the app provides around the trigger.
`useBottomSheetInternal` is exported for a part written outside the package —
a skin's `Footer`, a scrollable — and never for an app.
