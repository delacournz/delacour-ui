# Tour

A guided walkthrough of a screen's controls. The app dims, a hole is cut around one control,
and a card beside it explains it; Next, Back and Skip move through the steps. Compound root plus
`Tour.Step`, and `useTour()` to drive it from inside.

`import { Tour, useTour } from "@delacour/react-native-ui/tour";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/tour` |
| `tour.tsx` | Root — open and step state, the step registry, the `Modal` or in-tree overlay, and the `Object.assign` |
| `tour-step.tsx` | `Tour.Step` — the measured wrapper; registers on mount |
| `tour-overlay.tsx` | Everything drawn while open: measuring, the hole's shared values, card placement — internal |
| `tour-mask.tsx` | The dimmed window with the hole cut out — one Skia canvas, a rect clipped by the hole — internal |
| `tour-scrim.tsx` | What a touch on the dim meets: one full-window `Pressable`, or four around the hole — internal |
| `tour-card.tsx` | The card: position, title, description, footer actions — internal |
| `tour.context.tsx` | The state context (`useTour`) and the registry context `Tour.Step` reads |
| `tour.types.ts` | `TourStepEntry` and `TourGeometryProps`, shared by the root, the step and the overlay |
| `tour.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `tour.variants.test.ts` | |

## Design

- **Steps are layout descriptors, not overlay elements.** A `Tour.Step` wraps its control in a
  `View` (`collapsable={false}`, or Android flattens it and there is nothing to measure) and
  registers `{ order, title, description, overrides, ref }` on mount. It is always mounted, open
  or not, so a step on a screen that is not showing is simply not in the tour. The registry lives
  in its own context with a stable value, so moving through the tour re-renders no step.
- **`order` is sorted, not counted.** Gaps are fine — 10, 20, 30 leaves room to insert. The step
  state is the current step's `order`, not an index, so a step mounting late does not shift which
  one is showing. A requested order no step carries falls back to the lowest
  (`resolveCurrentOrder`) rather than leaving an open tour pointing at nothing.
- **Geometry is inherited.** `shape`, `padding`, `radius` and `placement` on the root are the
  defaults; a step names only what differs (`resolveStepOptions`).
- **Two hole shapes, one rounded rectangle.** `resolveHoleRect` grows the target by the padding;
  `circle` is a square around the larger side with a radius of half of it. `resolveMaskHole`
  clamps the size to zero and the radius to half the shorter side, and the mask always cuts a
  rounded rectangle — a circle is the case where the straight runs are zero — so a hole travelling
  from a rectangle to a circle never changes kind and nothing pops.
- **The mask is Skia, not SVG.** A window-sized `Rect` in a `Group` with `clip` set to the hole and
  `invertClip`, so the hole is subtracted. The clip is a `Skia.RRectXY` derived on the UI thread
  from the five shared values — no path string is built or parsed per frame, which the SVG
  `evenodd` path it replaced did on every frame of a transition. `@shopify/react-native-skia` is
  therefore a peer of `Tour`. `buildMaskPath`, the old path builder, stays exported and
  deprecated so the public surface does not shrink in a patch; nothing in the tour reads it.
- **Card placement** (`resolveCardPlacement`): `auto` is below the hole when the card fits inside
  the safe area, else above. Horizontally centred on the hole, clamped between gutters that clear
  the side insets, at most 360pt wide.

## Mechanics

- **Measuring waits one frame.** On a step change the root calls `onStepChange(order)` first —
  that is where a caller scrolls the target into view — then the overlay waits a
  `requestAnimationFrame` and calls `measureInWindow`. It re-measures on every window change,
  which is rotation. A measurement is tagged with its step, so a stale one is never placed.
- **The hole is five shared values**, eased with `withTiming` 280ms to each new target, read by
  the mask's `useDerivedValue` clip and by an interactive scrim's animated styles — the hole travels
  on the UI thread with no render. The first hole of an opening jumps (travelling in from a zero
  rect would grow it out of the corner), and so does every hole under reduce motion
  (`resolveTourTransitionDuration`).
- **The card is keyed by step and caches its own height.** Remounting per step is what makes
  `onLayout` fire for a step that happens to be as tall as the last; the card is laid out
  invisible, measured, placed, and only then faded in, so it never flips sides mid-transition.
- **The overlay lays out left-to-right.** Window coordinates are physical, and React Native swaps
  `left` for `right` in a right-to-left locale; `direction: "ltr"` on the overlay keeps a hole at
  x=20 at x=20. The card restores the app's direction for its own content, so its footer still
  mirrors. This is the one place the package positions with `left` rather than `start`, and it is
  why.
- **`testID` reaches the card.** The tour draws the card, so a caller cannot tag its actions;
  the root's `testID` is the stem `resolveTourTestIDs` derives `<testID>-card`, `-next`, `-back`
  and `-skip` from. One stem rather than a `closeTestID`-style prop per action, because there are
  four of them. A capture flow presses Next through `-next`.
- **Scrim colour is the `overlay` token**, through `useThemeColor`, resolved above the canvas where
  the theme is in reach and handed to the `Rect` as a colour; the suite asserts both themes declare
  it.

## Interactive mode

- **A `Modal` cannot be interactive.** It is a separate native window, so no touch inside the hole
  could reach the app beneath. With `isInteractive` the overlay is drawn inside `Tour`'s own root
  instead — the root is a `flex-1` `View` for exactly this — as `StyleSheet.absoluteFill` with
  `pointerEvents="box-none"`. The children sit in an inner `grow` view, not `flex-1`: a zero
  flex basis collapses them to nothing when the root sits in an auto-height parent such as a
  scroll view, which the simulator showed as a toolbar drawn zero-high. The scrim becomes four `Pressable`s tiling the window around the
  hole (`resolveScrimRects`), following it on the UI thread, so a touch inside the hole meets
  nothing in the overlay and falls through. The app advances with `useTour().next()`.
- **The trade:** an interactive tour covers only the tour's root, not the status bar or a tab bar
  outside it. Mount `Tour` as high as the dim should reach. Its origin is measured and subtracted,
  and the safe-area insets are reduced to the part the root actually overlaps
  (`resolveOverlayInsets`), so a root that starts below a navigation bar does not push the card a
  status bar too far down.
- **The non-interactive `Modal`** is `transparent`, `statusBarTranslucent`,
  `navigationBarTranslucent`, `animationType="none"`, and wraps its content in a
  `GestureHandlerRootView` — a new window needs its own gesture root, or every `Pressable` in the
  card is dead on Android.

## Accessibility

- **The card's text is one element**, labelled by `resolveTourAnnouncement` — "Step 2 of 5.
  Search. Find anything in your library." — and focus moves to it once the card is placed
  (`AccessibilityInfo.sendAccessibilityEvent(…, "focus")`). The card is
  `accessibilityViewIsModal`.
- **The app is hidden only in non-interactive mode** (`importantForAccessibility=
  "no-hide-descendants"` and `accessibilityElementsHidden` on the wrapper around `children`). An
  interactive tour's spotlit control has to stay reachable.
- **Escape skips when dismissible**: Android back through the Modal's `onRequestClose`, VoiceOver's
  two-finger scrub through the card's `onAccessibilityEscape`, and a tap on the dim. With
  `isDismissible={false}` the dim still swallows touches but does nothing.
- **The scrim is hidden from assistive technology.** The card's actions are the accessible way out.
- **Reduce motion**: the hole jumps; the card still fades, because a fade is not travel
  (`ReduceMotion.Never` on that one timing).

## Deviations from the design spec

- **Progress sits above the title, not in the footer.** Progress, Skip, Back and Next in one row
  overflow a 320pt phone at the 44pt button height the touch-target rule requires. The footer holds
  the three actions; Skip sits at the start.
- **Skip is hidden on the last step**, where Done already ends the tour (`resolveTourFooter`).
- **`TourLabels` gains `announcement`** ("Step 2 of 5"), so the spoken position is translatable
  alongside the visible one.
- **An explicit `placement` flips when only the other side fits**, rather than running the card off
  screen.
- **`haptic` and `className`** are added to `TourProps`, per the category rule that a component
  exposes `haptic?: false | HapticFeedback` and so a caller can size the root it now renders.
- **`useTour()` also returns `index` and `total`**, for a caller drawing its own progress.

## What it does not do

- **No arrow on the card.** The hole already says which control is meant.
- **No persistence.** `onFinish` and `onSkip` are where an app records that the tour was seen.
- **No portal.** The overlay is a `Modal` or in-tree — no teleport or bottom-sheet dependency.
- **No auto-scroll.** The tour cannot know the caller's scroller; `onStepChange` fires before the
  measurement for exactly this.
