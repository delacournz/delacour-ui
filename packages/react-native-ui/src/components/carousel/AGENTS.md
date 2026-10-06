# Carousel

A swipeable run of slides on one fractional position — peeking, looping,
vertical, autoplaying. Compound root plus `Carousel.Content`, `Carousel.Item`,
`Carousel.Caption`, `Carousel.Dots`, `Carousel.Previous`, `Carousel.Next` and
`Carousel.Controls`, and a `useCarousel()` hook for custom controls.

`import { Carousel } from "@delacour/react-native-ui/carousel";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/carousel` |
| `carousel.tsx` | Root + the `Object.assign` surface — owns the index, the reconcile and autoplay |
| `carousel-content.tsx` | `Carousel.Content` — the viewport, the Item walk, the window, the pan, the adjustable element |
| `carousel-item.tsx` | `Carousel.Item` — one absolutely placed slide and its animated style |
| `carousel-caption.tsx` | `Carousel.Caption` — a `Text` on a scrim, faded by its slide's offset |
| `carousel-dots.tsx` | `Carousel.Dots` and the internal dot — decoration driven by `position` |
| `carousel-previous.tsx` | `Carousel.Previous` — an icon `Button` |
| `carousel-next.tsx` | `Carousel.Next` — an icon `Button` |
| `carousel-controls.tsx` | `Carousel.Controls` — a row (a column when vertical), layout only |
| `carousel.context.tsx` | Four contexts split by rate of change, with their hooks |
| `carousel.types.ts` | Prop types shared by two or more parts |
| `carousel.variants.ts` | Pure `tv()` slots, constants and the geometry, coverflow, dot and a11y resolvers |
| `carousel.variants.test.ts` | |
| `use-carousel-autoplay.ts` | The JS interval and every reason it does not run |

The paging maths — wrapped offsets, rubber band, pan origin and position, settle
target, visible window — is **not here**. It lives in
[`src/lib/paging.ts`](../../lib/paging.ts), because `ImageViewer` pages through
the same kind of run and neither component should import the other. Keep that
file stable: its functions are the contract both consume.

## Design

- **Variants**: `track` (flat slides side by side) and `coverflow` (slides turn,
  shrink and fade with their distance from the centre — `resolveCoverflow`).
  **Orientations**: `horizontal`, `vertical`, which also turn the controls row
  and the dots into columns. **Tone** (dots only): `default`, and `overlay` for
  dots sitting on a photo — `primary-foreground`, never a raw white. **No size
  axis**: a slide's size is `itemSize`, in points, because it is a layout
  measurement and not a step on the type scale.
- **`itemSize` is the peek.** Omitted, a slide is the viewport's length and its
  neighbours sit a gap off-screen. Smaller, the active slide is centred
  (`resolveItemInset`) and the neighbours show either side. Larger than the
  viewport, it is clamped to it — a slide that overflows its own viewport cannot
  be centred.
- **Slides are found by walking `Content`'s direct children**, as `ListGroup`
  finds its rows and `Tabs` its panels. The walk is the count, the order and the
  window, so it is one place. An Item behind a wrapper is not found, and a
  development warning says so: a slide that silently vanishes is worse than a
  warning.
- **No `variant="stack"` or fan layout in v1.** Both are a different
  `resolve*` transform on the same position; they wait until `coverflow` has
  proven that seam.
- **No virtualised `data` / `renderItem`.** This holds a handful of hand-written
  slides. A feed is a list (`@legendapp/list`).

## Value flow

- **The whole component is one shared value**, `position`, a float slide index.
  A drag writes it, a spring settles it, and every slide's transform, every dot's
  width and every caption's opacity is a reading of it. Two clocks is how a dot
  ends up a frame behind the slide it marks.
- **`onIndexChange` fires once per gesture, from the pan's `onFinalize`**, before
  the spring lands — never per frame and never on crossing a midpoint. A per-frame
  report re-renders every slide mid-drag; `Tabs` paid for that lesson.
- **The reconcile effect registers no cleanup.** The commit that re-runs it is
  usually the one the gesture just caused, and the gesture has already started the
  settle spring. A cleanup that cancelled it would leave the effect's `none`
  branch nothing to restart, and the run would freeze between two slides. `Tabs`
  shipped that bug once; this copies its fix, not `Checkbox`'s `cancelAnimation`.
- **A rejected controlled change springs back.** Every commit also bumps a
  reducer token, so a controlled parent that refuses the change — and therefore
  re-renders nothing — still re-runs the reconcile, which springs to the index the
  parent kept. `Tabs` and `Switch` carry the same token.
- **The pan's settle records its target before it commits** (`commitFromPan`), so
  an accepted change makes the reconcile a no-op and the fling keeps its momentum.
- **A shrinking run never leaves a dead index.** The drawn index is clamped into
  `[0, count - 1]` and the clamp is reported through `onIndexChange` once. A count
  change jumps rather than springs: the slides under the old position are gone.
- **Loop has no clones.** Each slide's offset is `resolveWrappedOffset` — the
  short way round on a ring — so the first slide sits beside the last and nothing
  ever jumps back. `position` is unbounded while looping; the reconcile aims at
  `resolveNearestPosition`, so `scrollTo` and the arrows take the short way.

## Gesture

- **The pan claims its axis and yields the other**: `activeOffset` ±10 on the
  travel axis under `failOffset` ±10 across it. That is what lets a horizontal
  carousel sit in `Screen.ScrollArea` and a `Pressable` in a slide still tap. Not
  `blocksExternalGesture` — React Native's `ScrollView` has no handler tag.
- **The origin is back-computed at activation** (`resolvePanOrigin`), or the slide
  jumps by the 10 points it took to activate. A grab mid-spring resumes from where
  the slide is.
- **The spring is cancelled in `onStart`, never `onBegin`.** Most touches fail on
  the cross axis; cancelling on touch-down would freeze the run for every vertical
  scroll that began on it.
- **The settle is in `onFinalize`**, the one callback on END, FAILED and
  CANCELLED, guarded by an `isDragging` flag so a tap that never activated does not
  retarget anything.
- **A flick moves at most one slide.** `resolveSettleTarget` commits on 300 pt/s
  or a quarter of a pitch, and never further than the next slide, however hard the
  throw. Past a non-looping end the drag is a rubber band capped at half a slide.
- **Worklets call only self-contained worklets.** Every `lib/paging` and
  `carousel.variants` function used on the UI thread is marked `"worklet"` and
  calls nothing else — a module-scope worklet calling another crashes the UI
  thread (`pressable/AGENTS.md`). Axis-dependent choices (`translationX` or `Y`,
  `width` or `height`) are made once on the JS thread and captured as keys.

## Rendering

- **Slides are absolutely placed and moved by transform, never by layout.** One
  `onLayout` on the viewport measures it; the geometry (`viewport`, `size`,
  `pitch`, `inset`) is computed on the JS thread and published as **one** shared
  value, so the UI thread never reads a pitch from one layout and a size from
  another. Until it lands, slides draw at `opacity: 0` — the first paint never
  shows them stacked at the origin.
- **Only the window is mounted**: `windowSize` (default 2) slides either side of
  the committed index, wrapped when looping. Slides outside it are unmounted from
  the committed index on the JS thread, and any mounted slide further out than
  the window is `display: none` on the UI thread before React catches up.
- **Dots stretch by width, not `scaleX`** — a scaled `rounded-full` is an ellipse
  (`Tabs.Indicator`'s reason). Past `maxDots` (default 7) the row is a window
  centred on the active dot.
- **The caption fades with its slide's offset**, full on the active slide and
  gone one slide out, so a peeking neighbour shows its picture and not its words.
  Colour sits on the `Text` (rule 1); the frame carries layout and the scrim.

## Autoplay

- **Stops for good on the first touch** — the pan's `onBegin`, an arrow or a
  caller's `scrollTo` — and at the end of a run that does not loop. Content that
  keeps moving after the user took hold of it is fighting them.
- **Never runs under reduce motion, the app's `isMotionCalm`, or a screen
  reader** (WCAG 2.2.2). The screen reader is subscribed, not sampled.
- **Pauses while the app is backgrounded.** A carousel scrolled off-screen keeps
  ticking: detecting that cheaply is not possible, so it is documented rather than
  solved.
- **A tick is one more caller of the reconcile**, not a second clock.

## Accessibility

- **`Carousel.Content` is the adjustable element**, not the root, so the arrows
  stay reachable in their own right. Its value is "2 of 5"
  (`resolveCarouselA11yValue`); `increment`/`decrement` map to `next`/`previous`,
  and the OS reads the new value.
- **Off-screen slides are hidden from assistive tech** unless the carousel peeks,
  when every mounted slide is visible and stays reachable
  (`resolveSlideAccessibility`).
- **Dots are decoration**: hidden from assistive tech and not tappable — at six
  points they are far below a 44-point target. The arrows are the control, labelled
  "Previous slide" / "Next slide", disabled at the ends unless looping.
- **Reduce motion** settles by a 150 ms timing instead of a spring, collapses
  coverflow to the track transform, and disables autoplay.

## Cross-category

- **No Pagination import.** `Carousel.Dots` is a minimal internal indicator; a
  later Pagination component may wrap or replace it.
- **No Image component required.** Slides are caller-supplied children.

## Notes

- **A demo has to stretch.** The root is `w-full`; inside a shrink-wrapped parent
  that resolves to zero, the viewport measures 0 and no slide shows. Every demo
  sets `align: "stretch"`, as every container demo does.
- **Simulator check, 2026-10-05** (iPhone 17 sim, dev client): track, peek
  centring, coverflow and vertical draw correctly; a ~290 pt fling moves exactly
  one slide; the arrows step and `Next` disables at the non-looping end, where
  further swipes rubber-band back; loop wraps both ways with no jump; autoplay
  advances and stops for good after a swipe; a controlled `index` jumps from an
  outside button and a swipe reports back through `onIndexChange`.
- **Not yet verified on a device**: release mid-drag then scroll the page; inside
  `Screen.ScrollArea`; a `Pressable` in a slide; VoiceOver's adjust gesture and
  the "n of m" announcement; autoplay off under Reduce Motion / VoiceOver; a
  Release build. Preview media is not captured either — the capture script needs
  the argent CLI, which is not installed — so no demo is marked `capture` and the
  docs page carries no `<Preview>`. Add both when previews can run.
