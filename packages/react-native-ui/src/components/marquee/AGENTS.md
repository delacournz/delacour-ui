# Marquee

Content that travels across its container on a loop: a strip of badges, a wall of logos, a ticker
of quotes, two rows drifting opposite ways. Horizontal or vertical, any children, a constant speed
in points per second, held still on touch, and held still for good under calm motion. Compound
root plus `Marquee.Group`, which keeps the strips inside it in step.

`import { Marquee } from "@delacour/react-native-ui/marquee";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/marquee` (root, prop types, constants, `useMarqueeGroup`, variants) |
| `marquee.tsx` | `MarqueeRoot` + the `Object.assign` surface |
| `marquee-group.tsx` | `Marquee.Group` — shared pause, shared finger-down flag, default speed |
| `marquee-track.tsx` | Internal leaf: the UI-thread integrator and the translated strip of copies |
| `marquee-scroller.tsx` | Internal leaf: the still, hand-scrollable strip under calm motion |
| `marquee-fade.tsx` | Internal leaf: the two edge gradients (react-native-svg) |
| `marquee.context.tsx` | `MarqueeGroupProvider`, `useMarqueeGroup()` — imports React and types only |
| `marquee.types.ts` | `MarqueeStripProps`, shared by the track and the scroller |
| `marquee.variants.ts` | Slotted `tv()` + every pure resolver and worklet, no RN imports |
| `marquee.variants.test.ts` | |

Display names: `DelacourUI.Marquee`, `.Group`, `.Group.Provider`, `.Track`, `.Scroller`, `.Fade`.

## Design

- **It is decoration, so it must be able to stop.** A loop that never ends is the worst case for a
  UI test runner that waits for the screen to idle, and for a reader with reduce motion on. Under
  `useCalmMotion()` the root swaps the track for `MarqueeScroller`: one copy, no duplicates, in a
  `ScrollView` the reader drags by hand, with no indicator. Content stays reachable, and the swap is
  live if the OS setting flips.
- **It is not a carousel.** No snapping, no index, no paging. Anything a reader must reach by
  swiping belongs to `Tabs`' pager.
- **`direction` is axis and sign in one value.** A separate `orientation` plus `reverse` pair has an
  illegal state; `resolveMarqueeAxis` derives the axis and `resolveMarqueeSign` the sign.
- **A frame-callback integrator, not `withRepeat`.** `useFrameCallback` adds `dt × velocity` to an
  offset and wraps it by the period (`advanceMarqueeOffset`). A repeating timing cannot resume from
  mid-loop after a pause — it restarts and snaps the strip — and cannot change speed without a seam.
  The integrator holds, resumes and re-speeds from wherever it is. `dt` is clamped to
  `MARQUEE_MAX_FRAME_MS` (64) by `clampFrameDelta`, so a backgrounded app does not teleport the strip
  when it returns.
- **Speed is points per second, never a duration.** A duration makes a three-badge strip crawl and a
  thirty-badge strip fly. `resolveMarqueeDuration` exists only to report one loop's length; it
  drives nothing. A speed of zero or less, or a non-finite one, holds still rather than reversing —
  a negative speed would be a second way of saying `direction`.
- **The period is one copy's measured length, trailing gap included.** Each copy carries its gap as
  trailing padding (`pr-*` horizontal, `pb-*` vertical) and `onLayout` reports the padded size. A
  `gap-*` *between* copies would leave the last copy's gap uncounted, and the loop would jump by one
  gap on every wrap. The variant test asserts no `gap-*` ever reaches a copy.
- **Copy count fills the container plus one period.** `resolveMarqueeCopies` is
  `ceil(container / period) + 1`, at least 2 once measured, at most `MARQUEE_MAX_COPIES` (12) so a
  one-point child does not mount a thousand. It re-resolves on either `onLayout`, which is what
  covers a rotation: the root's new length re-runs it and the trailing edge never shows a gap.
- **The wrap is invisible because the strip is periodic.** `resolveMarqueeTranslation` keeps left
  and up in `(-period, 0]` and right and down in `[-period, 0)`, so the copies always cover the
  container from its start edge, and `offset = period` draws exactly what `offset = 0` draws. The
  test asserts that equality for all four directions.
- **The first frame is invisible, and the period reaches the UI thread a commit late.** Until copy 1
  reports its length there is one copy at opacity 0. Its `onLayout` sets the period as React state,
  the extra copies mount, and only an effect after that commit writes the period to the shared value
  the transform reads. Writing it straight from `onLayout` would let a right-moving strip translate
  by a full period while only one copy existed — a blank frame.
- **The root lays out along the axis, and the track never shrinks.** The track is a main-axis item
  at its full content length rather than stretched to the container's. A track only as long as the
  container hit-tests only that far, so once translated the copies sliding in from the trailing edge
  would sit outside its bounds and take no touches. A horizontal root is `w-full` for the mirror
  reason: in a content-sized parent (`items-center`) a row root grew to the track's length — 9,640
  points on the simulator — clipped nothing and mounted the copy cap.
- **Pause is velocity easing.** A `useAnimatedReaction` on the UI thread picks the target — zero
  while held, else the signed speed — and eases `velocity` to it over `easeMs` with
  `ReduceMotion.Never` (calm motion is handled one level up, where the track is never mounted). A
  held strip decelerates rather than freezing mid-frame, and a speed change mid-flight glides.
- **Press-to-hold is a gesture that never activates.** `Gesture.Manual()` sets the finger-down flag
  on touches-down and fails itself on touches-up or cancel, which finalizes and clears the flag. It
  stays in `BEGAN` the whole time, so it cancels nothing beneath it. A long press with no minimum
  duration was the first idea, and it would have activated the instant the finger landed and
  cancelled a child `Pressable`'s tap; running it alongside would mean naming every child's gesture,
  which a container of arbitrary children cannot do. When a child's tap does activate on release,
  it cancels this gesture — at the moment the finger lifts anyway. `Pressable` is not used for the
  same reason: it would swallow the children's presses.
- **A group holds one finger-down flag and one pause.** Each strip in a `Marquee.Group` writes the
  group's flag, so a press on any row stills every row, and the group's `pause` wins over a strip's
  own (`resolveMarqueePause`) — a row that slid on while its sibling held is the drift a group exists
  to prevent. Speed is the other way round: a strip's own wins over the group's
  (`resolveMarqueeSpeed`). Opposite directions are two signs of one speed, so rows stay in
  proportion.
- **Edge fades are two SVG gradients in a token colour.** `MarqueeFade` draws a unit-viewBox
  gradient stretched over an absolutely filled `Svg`, the technique `Skeleton`'s shimmer uses (copied
  as an idea, not imported — it is a private leaf). The colour comes from `useThemeColor` and must
  equal the surface underneath, which is why `MarqueeFadeColor` is a closed set of surface tokens.
  The fades take no touches.
- **No React state on the hot path.** The copy count, the period and the container length are state
  and change on layout; everything per-frame is a shared value.

## Accessibility

- **Duplicates are hidden; copy 1 is the content.** Copies 2..n carry `accessibilityElementsHidden`
  (iOS) and `importantForAccessibility="no-hide-descendants"` (Android). Without it a screen reader
  reads every badge three times and the list sounds thirty items long.
- **Copy 1 stays focusable while it slides.** The strip is translated, not scrolled, so swiping
  focus through it moves nothing.
- **`accessibilityLabel` is for decoration.** Set, the root becomes one accessible element with that
  label and every copy is hidden — a logo wall read as "Trusted by …". Unset, the children keep
  their own semantics.
- **It never auto-pauses on screen-reader focus alone.** There is no cross-platform signal for it;
  press-to-hold plus the calm fallback is the contract.

## Constraints

- **A vertical marquee needs a bounded height** from its `className` (`h-48`). A column of unbounded
  height grows to its content, has nothing to clip, and simply shows every copy stacked; it does not
  crash.
- **`gap` is trailing padding on each copy**, so `contentClassName` should not set `pr-*` / `pb-*`
  on the axis — it would replace the gap and the loop would still be seamless, just differently
  spaced.

## Spikes

The category README lists no spike for Marquee. The decisions verified on the simulator are below.

Verified on an iPhone 17 simulator (iOS, dev client), 2026-10-05:

- **Press-to-hold.** Two frames 1.5 s apart during a long press on `hold-to-pause` are pixel-identical;
  frames after release differ — the strip holds and resumes.
- **A child press while moving.** On `cards`, pressing a moving `Item` fired its `onPress`
  ("Tapped Wellington") — the never-activating `Gesture.Manual` steals nothing.
- **Duplicates hidden.** With copy 2's "Motion" on screen, the AX tree held no "Motion" — only
  copy 1's items are exposed.
- **Calm motion.** With the OS Reduce Motion on, `badges` rendered a `ScrollView` holding one copy,
  and a hand pan scrolled it to the last item.
- **Content-sized parent.** Found here: without `w-full` a horizontal root in a shrink-wrapped stage
  measured 9,640 pt wide. Fixed; it now measures the container's 402 pt.

Not verified on a device: Android / TalkBack, the loop seam over many wraps frame by frame, and a
rotation re-resolving the copy count.

## Previews (follow-up)

No demo carries `capture` yet: a captured demo with no manifest entry fails `demos.test.ts`, and the
media are shot after integration. The five to capture, all `align: "stretch"` and all clips, each
with its flow already written under `.argent/flows/previews/marquee/`: `badges` (**hero**),
`two-rows`, `vertical`, `hold-to-pause`, `speed`. `cards` stays gallery-only. Add
`<Preview id="marquee/badges" title={null} />` above `## Installation` in `marquee.mdx`, and the
others beside their sections, in the same change — a `<Preview id>` for an uncaptured demo throws
at render.
