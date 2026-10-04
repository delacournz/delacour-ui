# components

The compound `BottomSheet` and its parts. Every part accepts `style` and `ref`;
none takes a class; every `displayName` is `DelacourBottomSheet.BottomSheet.X`.

## Files

| Path | What |
| --- | --- |
| `bottom-sheet.tsx` | The root — state, geometry, animation, pans, intents, the imperative ref, and the `Object.assign` that names the parts |
| `bottom-sheet.types.ts` | Every prop type, `BottomSheetRef`, `BottomSheetContextValue`, `BottomSheetAnimatedValue` |
| `bottom-sheet.context.tsx` | Three contexts: `BottomSheet` (open state and ref methods), `BottomSheetAnimated` (the shared values), `BottomSheetInternal` (what the parts share) |
| `bottom-sheet-trigger.tsx` | Opens the sheet; `asChild` donates `onPress` |
| `bottom-sheet-portal.tsx` | The frame the sheet measures itself against — inside a teleport `Portal` to the nearest host under a provider, in place with `inline` or without one; registers the sheet as presented |
| `bottom-sheet-overlay.tsx` | The scrim: a React Native `Pressable`, written before the panel |
| `bottom-sheet-container.tsx` | The panel — the surface that moves; inset by `detachedFrame` and `box-none` when detached |
| `bottom-sheet-background.tsx` | The panel's absolute-fill surface, `pointerEvents: none`; exactly the sheet's `height` tall when detached |
| `bottom-sheet-handle.tsx` | The grabber's row: the handle pan and the adjustable accessibility element |
| `bottom-sheet-content.tsx` | The static body: the content pan, the `bodyClip` clip, the `contentArea + bodyInset` layout box, the measured inner box and the inset spacer |
| `bottom-sheet-footer.tsx` | The sticky footer: translated to `footerTop`, its styled box padded through the band and measured less the band into `footerContentHeight` |
| `bottom-sheet-close.tsx` | The dismiss control; `asChild` donates `onPress` |
| `bottom-sheet-title.tsx` | The heading; publishes the `nativeID` the panel is labelled by |
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

The ref's `close()` checks the sheet's effective openness on the JS thread
before dispatching, so a `close()` while a queued open is still waiting on
layout clears the queue rather than racing it.

## Accessibility

No `accessible` container: one would collapse the whole sheet into a single
VoiceOver element. Instead the panel is `accessibilityViewIsModal` while open
under an overlay, its descendants are hidden while it is closed, and the title
labels it through `accessibilityLabelledBy`. The handle is the sheet's one
`adjustable` element: increment and decrement move a snap point, escape closes,
and its value reads `SnapPoint i of n`. The overlay is hidden from assistive
technology while it is transparent.

## Contexts

All three are provided once, by the root. A teleported portal keeps the React
tree in place, so they reach every part without being re-provided — and so
does every context the app provides around the trigger.
`useBottomSheetInternal` is exported for a part written outside the package —
a skin's `Footer`, a scrollable — and never for an app.
