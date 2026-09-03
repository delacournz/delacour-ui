# BottomSheet

A panel that slides up over everything, on `@gorhom/bottom-sheet`'s modal. The
library's first overlay. Compound root plus `BottomSheet.Trigger`,
`BottomSheet.Portal`, `BottomSheet.Overlay`, `BottomSheet.Container`,
`BottomSheet.Content`, `BottomSheet.ScrollView`, `BottomSheet.Close`,
`BottomSheet.Title`, `BottomSheet.Description` and `BottomSheet.Footer`.

`import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `delacour-react-native-ui/bottom-sheet` |
| `bottom-sheet.tsx` | Root + the `Object.assign` compound surface |
| `bottom-sheet-trigger.tsx` | `BottomSheet.Trigger` |
| `bottom-sheet-portal.tsx` | `BottomSheet.Portal`, and the overlay hoist |
| `bottom-sheet-overlay.tsx` | `BottomSheet.Overlay` — one of the two `withUniwind` wrappers |
| `bottom-sheet-container.tsx` | `BottomSheet.Container`, the modal, and the footer hoist |
| `bottom-sheet-content.tsx` | `BottomSheet.Content` |
| `bottom-sheet-scroll-view.tsx` | `BottomSheet.ScrollView` — the other wrapper |
| `bottom-sheet-close.tsx` | `BottomSheet.Close` |
| `bottom-sheet-title.tsx` | `BottomSheet.Title` |
| `bottom-sheet-description.tsx` | `BottomSheet.Description` |
| `bottom-sheet-footer.tsx` | `BottomSheet.Footer`, its sticky and inline branches |
| `bottom-sheet-background.tsx` | The sheet's surface — internal |
| `bottom-sheet-handle.tsx` | The grabber — internal |
| `bottom-sheet.context.tsx` | Three contexts — the sheet, the portal, the container |
| `bottom-sheet.variants.ts` | Pure `tv()` slots + two resolvers, no RN imports |
| `bottom-sheet.variants.test.ts` | |
| `use-bottom-sheet-input.ts` | What an `Input` needs to be a field the sheet owns |

## Design

- **Two parts are not drawn where they are written, and that is the component.**
  gorhom takes the scrim and a pinned footer as *render props* on the modal —
  `backdropComponent` and `footerComponent` — not as children. `BottomSheet.Portal`
  lifts the `Overlay` out of its own children and publishes it on context;
  `BottomSheet.Container` lifts a `Footer sticky` out of its own and clones both
  into those slots. The alternative was a `backdrop` prop and a `footer` prop on
  the container, which would put two parts of the anatomy somewhere the anatomy
  cannot see them. `hoistOverlay` and `hoistFooter` live with the part that lifts
  its own children — the rule `withIndicator` follows in [`radio.tsx`](../radio/AGENTS.md) — and the
  decision inside the second, `resolveFooterPlacement`, is pure so `bun test`
  reaches the matrix.
- **The scrim's press area stops at the top of the sheet, and rebuilding it that
  way is the only reason `Input` works in here.** gorhom's backdrop puts a
  full-screen `Gesture.Tap()` behind the sheet. Gesture Handler resolves a touch
  between competing GESTURES, so a `Button` in the sheet has one of its own and
  wins — but a `TextInput` has none, the backdrop takes the tap, and the sheet
  CLOSES instead of the field focusing. That is what gorhom's own
  `BottomSheetTextInput` exists to fix, and taking that route would have left
  this package's `Input` — its variants, its `Input.Group`, its `Field`
  cascade — unusable inside a sheet. So `BottomSheet.Overlay` passes
  `pressBehavior="none"` (no gesture anywhere) and lays a `Pressable` over the
  band ABOVE the sheet, sized from the sheet's own `animatedPosition`. It cannot
  overlap the sheet, so there is nothing for it to take, and the part of the
  scrim anyone can actually see still closes. Confirmed both ways on a
  simulator — with gorhom's backdrop the field could not be focused at all.
- **Never call `dismiss()` on a modal that was never presented.** gorhom's modal
  starts at status `INITIAL`; `dismiss()` reads that as a live sheet closing and
  moves it to `DISMISSING`, where it stays. The next `present()` mounts the
  portal and renders the sheet — and it never animates in, never lays out its
  content and never fires `onChange`. Nothing throws, nothing is logged, and the
  screen simply does not change. `BottomSheet.Container` keeps a
  `hasPresentedRef` so the effect that mirrors `isOpen` only ever dismisses
  something it opened. This cost an afternoon; do not "simplify" the guard away.
- **A portal breaks context, so the container re-publishes its own.** The sheet's
  children are rendered by `@gorhom/portal` into a host inside
  `BottomSheetModalProvider` — a different place in the React tree from where
  they were written — so the `BottomSheetContext` the root provides does not
  reach them, and `BottomSheet.Close` throws "must be rendered inside a
  `<BottomSheet>`". `BottomSheet.Container` wraps the modal's children in the
  same provider again. `BottomSheet.Overlay` cannot be covered that way — gorhom
  renders the backdrop outside those children — so its press area reads gorhom's
  `useBottomSheet()` instead, which lands on `onDismiss` and therefore on
  `onOpenChange` anyway.
- **There is no size and no colour axis.** A sheet has one shape and one surface;
  a second way to paint it would be a second thing to keep in step for no
  question anyone is asking. `bottomSheetVariants` is slots and nothing else.

## Footer and keyboard

- **`BottomSheet.Footer` is inline by default, and `sticky` pins it.** Same word,
  same default as [`Screen.Footer`](../screen/AGENTS.md), so the two cannot be read as opposites. The
  two branches deliberately look different: an inline footer is in the flow and
  inherits the sheet's surface, while a pinned one draws OVER the content and so
  brings a background and a top hairline of its own. Without them the content
  scrolls straight through it and its buttons are legible only where they happen
  to overlap blank space — `Screen.Footer`'s rule about its backing, one
  component along. A footer written `sticky` but rendered outside a container
  falls back to the inline branch rather than throwing: there is no footer
  position to ride, and a row of buttons in the flow is the useful failure.
- **A pinned footer is TALLER by the safe-area band; it is not moved up by it.**
  gorhom's `bottomInset` translates the whole footer up instead, which leaves a
  band the height of the home indicator between the footer and the bottom of the
  sheet — with the content scrolling through it in plain view. So `bottomInset`
  stays 0 and the band is part of the footer's own `paddingBottom`, putting its
  surface against the bottom of the screen.
- **The keyboard takes the band back, and ONLY the band.**
  `BOTTOM_SHEET_FOOTER_PADDING` is always there and the band collapses into it as
  `useReanimatedKeyboardAnimation()`'s `progress` runs 0 → 1, so the controls
  never end up flush against the keyboard. Sliding the whole footer down by the
  band instead — the first thing tried — parks its padding behind the keyboard
  along with it, and the buttons sit on the keys. It also has to be the footer
  genuinely getting *shorter* rather than moving, because that is what lets the
  body's reserve shrink with it instead of holding back the height of a home
  indicator that is no longer on screen. Both numbers are constants rather than
  classes, for `SCREEN_FOOTER_PADDING`'s reason: an animated padding cannot be a
  class, and the reserve maths has to read the same value.
- **The footer publishes its measured height and the body reserves it with an
  animated spacer.** Not gorhom's `enableFooterMarginAdjustment`, which turns that
  height into content-container padding through React state — and since the
  footer changes height on every frame of the keyboard animation, that is a
  commit per frame. A shared value read by a spacer's animated style costs
  nothing on the JS thread; [`Screen`](../screen/AGENTS.md) reserves its own chrome exactly this way.
  The spacer sits OUTSIDE the classed content box, or the content's own `gap`
  lands in front of it and silently doubles `BOTTOM_SHEET_FOOTER_GAP`. The
  container owns the shared value because the footer and the body are siblings in
  gorhom's tree and neither can see the other.
- **Do not put a `KeyboardStickyView` inside a sheet.** This is the one keyboard
  rule that differs from [`Screen`](../screen/AGENTS.md). gorhom's `animatedFooterPosition` already
  carries a pinned footer clear of the keyboard and the translate above gives up
  the safe-area band on top of that; a third mechanism moving the same view would
  fight both for prop ownership every frame.
- **Exactly one thing in the sheet pays for the home indicator.** With a pinned
  footer that is the footer, whose own padding carries the band and whose height
  the body already reserves; the content asking for it too would count it twice.
  With no pinned footer the content is the bottom-most thing and takes it.
  `resolveSheetBottomInset` is that decision and it is pure, so `bun test` reaches
  it. As everywhere else the band comes from `useSafeAreaInsets()` and never from
  `pb-safe`.

## Styling

- **`BottomSheet.ScrollView` puts its classes on an inner `View`, not on gorhom's
  content container**, and that is not tidiness. Uniwind compiles a
  `contentContainerClassName` into an **array** alongside any
  `contentContainerStyle`; gorhom's footer-margin adjustment then reads
  `paddingBottom` off a flattened style, an array flattens to an array, the band
  reads as zero and the last row hides behind a pinned footer. One writer for
  that style, and it is the inset. A scrollable sheet also needs
  `enableDynamicSizing={false}` and explicit `snapPoints`, or the sheet grows to
  the content and there is nothing to scroll within.
- **Two `withUniwind` wrappers, and only two.** `BottomSheetBackdrop` and
  `BottomSheetScrollView` are leaves that take a `style` and no `className`, so
  each is wrapped once, at module scope, in its own file (rule 7).
  `BottomSheetView` and `BottomSheetFooter` are **not** wrapped: both take
  children, so an ordinary `View` nested inside carries the classes instead —
  the move [`Screen.Footer`](../screen/AGENTS.md) already makes with `KeyboardStickyView`. Reach for a
  nested view before a wrapper whenever the third-party component has room for
  one. The scroll view's wrapper also needs its signature restated, the way
  `Screen.LegendList`'s does — `withUniwind`'s mapped return type collapses a
  scrollable's animated props to a single entry.
- **`BottomSheet.Container` takes no `className`.** gorhom's modal wears an
  animated style its own position writes every frame, so a class would reach
  nothing `backgroundClassName` does not reach better. The background and the
  handle are supplied as `backgroundComponent` and `handleComponent` — this
  package's own views, so they take classes — and a `backgroundStyle`,
  `handleStyle` or `handleIndicatorStyle` still arrives, forwarded as the `style`
  each is handed. **Forwarding the background's `style` is load-bearing:** gorhom
  passes `[StyleSheet.absoluteFill, backgroundStyle]`, and dropping it renders the
  sheet transparent over the app.

## Behaviour and defaults

- **One callback for every way a sheet closes.** A swipe down, a press on the
  scrim, `BottomSheet.Close` and a controlled `isOpen` all arrive at
  `onOpenChange`, because presenting is driven by state and gorhom's `onDismiss`
  is consumed rather than forwarded. gorhom's own `onClose` fires for the gesture
  alone, which is the shape that makes a caller wire three handlers and still
  miss one. `useBottomSheet().sheetRef` remains for the imperative calls with no
  declarative form — `snapToIndex`, `expand`, `collapse`.
- **`accessible` defaults to `false`, and it is the least obvious line in the
  component.** gorhom marks the sheet's content container `accessible` with the
  label "Bottom Sheet" and the `adjustable` role. On iOS an `accessible`
  container collapses its whole subtree into ONE element, so every field, button
  and line of copy inside becomes unreachable to VoiceOver — the form gallery
  route was a single "Bottom Sheet" element until this default was flipped. It is
  [`Field`](../field/AGENTS.md)'s rule one component along: the row is `accessible={false}` so the
  control stays the element a screen reader sees. Verified with
  `native-describe-screen` on a simulator, not assumed.
- **Three defaults differ from gorhom's, and each is a modal-sheet decision.**
  `enablePanDownToClose` is on, because a modal sheet has no collapsed resting
  state to pan down to. The backdrop appears on index `0` and disappears on `-1`
  rather than `1` and `0`, for the same reason — gorhom's defaults suit a
  persistent sheet that dims the app only once expanded. And the keyboard trio
  is `interactive` / `restore` / `adjustResize`: leaving Android on gorhom's
  `adjustPan` slides the whole window up instead of resizing it and puts the
  footer off-screen, where `resize` is already what Expo configures and what
  `KeyboardProvider` requires. All are ordinary props; `BOTTOM_SHEET_KEYBOARD_DEFAULTS`
  is a const so a test pins the trio rather than three inline literals.
- **`--overlay` is a token, not a `bg-black/50`.** A pure-black scrim over
  a near-black dark theme is nearly invisible, so the two variants carry
  different alphas — and because the alpha lives in the token, the backdrop's
  `opacity` defaults to **1** rather than gorhom's 0.5, which would multiply the
  two and land the scrim at a fifth of what the theme asked for. It takes no
  `-foreground`: nothing is drawn on a scrim, and the sheet in front brings its
  own. A test pins the token against both `@variant` blocks and pins the opacity
  against the alpha being there.

## Input

- **`useBottomSheetInput()` is why `Input` still works in here.** A sheet only
  grows for the keyboard when it knows the focused field is one of its own, and
  gorhom's answer is to use its `BottomSheetTextInput` — which would leave this
  package's `Input`, its variants, its `Input.Group` and its `Field` cascade
  unusable inside a sheet. The registration is exposed as `{ onFocus, onBlur, ref }`
  instead, so `Input` imports nothing from `@gorhom/bottom-sheet` and the hook is
  inert outside a sheet. The `ref` is not optional polish: without it, moving
  focus between two fields in one sheet reads as the keyboard closing and
  reopening and the sheet resizes twice on the way. It covers the keyboard half only:
  a *drag* across a field can still be claimed by the sheet's content pan, since
  gorhom's input is built on Gesture Handler's `TextInput` and this one is not.
  If that ever bites, the fix is `enableContentPanningGesture={false}` on the
  container. The *tap* half is the scrim's problem and is solved above.

## Structure

- **There is no `bottom-sheet.types.ts`.** Nothing is shared by two modules that
  is not already a type somewhere better: the text parts take `TextPresetProps`,
  which `Text` already exports, and the container reads its footer's props from
  `bottom-sheet-footer.tsx` directly — no cycle, since a part never imports the
  container. A types leaf holding one alias would be a file with nothing in it.
- **There is no `FullWindowOverlay`, so nothing imports `react-native-screens`.**
  `BottomSheetModal` hosts itself in the `BottomSheetModalProvider` that
  `DelacourProvider` mounts, which covers everything short of drawing over a
  *native* stack modal. gorhom's `containerComponent` is the escape hatch if a
  call site ever needs that; it is not worth the optional peer, the iOS element
  inspector and the keyboard caveats before then.

