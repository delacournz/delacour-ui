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
| `tour-mask.tsx` | The dimmed window with the hole cut out — one Skia canvas, a rect with the current and previous holes erased — internal |
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
  rounded rectangle — a circle is the case where the straight runs are zero — so one drawing
  serves both shapes.
- **The mask is Skia, not SVG.** A window-sized `Rect`, then two `RoundedRect`s drawn with
  `blendMode="dstOut"` that erase it — the current hole and the one it replaced, each with its own
  opacity. Each is a `Skia.RRectXY` derived on the UI thread from five shared values — no path
  string is built or parsed per frame, which the SVG `evenodd` path it replaced did on every frame
  of a transition. `react-native-skia` is
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
- **The hole crossfades; it does not travel.** Five shared values are set straight to each new
  target — so an interactive scrim passes touches to the new control at once — and a second five
  keep the hole being left. The old hole's opacity falls to 0 while the new one's rises to 1, 220ms
  ease-out (`TOUR_HOLE_FADE_MS`), so the dim fills in over the last control while it lifts over
  the next. A step changed mid-fade hands the old hole over at the opacity it had reached, so
  nothing pops. The first hole of an opening appears with the tour, and a re-measure that lands
  on the same hole swaps at once — crossfading a hole with itself would dim it for a moment
  (`resolveTourHoleFadeDuration`, `isSameHoleRect`). A sliding hole read as a block dragged
  across the screen; the crossfade keeps the eye on the card instead.
- **Opening has an entrance.** The first hole is open from the start and the whole mask fades up
  around it, 240ms ease-out (`TOUR_ENTER_MS`) — the room dimming around a spotlight. The card
  follows 60ms later, fading in over 240ms while it rises 8pt into place
  (`resolveTourCardEntrance`); reduce motion keeps its fade and drops the rise. The overlay is
  mounted only while the tour is open, so every opening starts from zero.
- **The card is mounted once and glides.** It is laid out invisible, measured, placed and brought
  in on opening; from then on it stays visible and glides 280ms ease-out to each step's place
  while its content swaps (`resolveTourTransitionDuration`). It keeps the last height it measured,
  so the next step is placed with it at once and the glide retargets if the new content lays out
  taller or shorter. It used to be keyed by step, which unmounted it and faded a new one in on
  every step — a visible blink.
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
- **Reduce motion**: the card jumps instead of gliding. The hole still crossfades and the card
  still fades in on opening, because a fade is not travel (`ReduceMotion.Never` on those timings).

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
