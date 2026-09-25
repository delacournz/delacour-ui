# Rating

A row of stars that reads or sets a score. Compound root plus `Rating.Stars` and
`Rating.Output`. Read-only or interactive, in whole or fractional steps, set by a
tap or a drag along the row.

`import { Rating } from "@delacour/react-native-ui/rating";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/rating` |
| `rating.tsx` | Root + the `Object.assign` compound surface |
| `rating-stars.tsx` | `Rating.Stars` — owns the pan, the measurement, the haptic and the accessibility surface |
| `rating-star.tsx` | One star: an empty glyph and a clipped filled one. Internal |
| `rating-output.tsx` | `Rating.Output`, the `Text.Label` readout |
| `rating.context.tsx` | `RatingContext`, `useRating()`, `useRatingContext()`, `useRatingPart()`, `RatingRenderProps` |
| `rating.variants.ts` | Pure `tv()` slots, the value maths and the paint resolver, no RN imports |
| `rating.variants.test.ts` | |

There is no `rating.types.ts`: `RatingRenderProps` is the one shared type and it
is part of the context's own shape, so it lives beside it.

## Design

- **Colours**: `default`, `primary`, `success`, `warning`, `destructive`, `info` —
  Slider's set. The default is **`warning`**, not `default`: a star is read as
  amber before it is read as a star, and a row of ink stars reads as a set of
  icons rather than a score. **Sizes**: `sm`, `md`, `lg`, which are `icon-lg`,
  `icon-xl` and `icon-2xl` on the icon scale — a star is a mark, the way a
  checkbox's tick is.
- **The anatomy is written out**, `Rating.Stars` and an optional
  `Rating.Output`, rather than a `showValue` boolean. A readout beside the stars,
  under them, or formatted as "4.3 · 128 reviews" is three layouts one boolean
  could not express; the root is a column and a `flex-row` class puts it inline.
- **`maxValue` is the star count and `step` the precision**, the names `Slider`
  uses for the same two ideas. A fraction of a count rounds *down*; anything
  that is not a count falls back to five. A step must divide one star — `0.5`
  and `0.25` do, `0.3` does not — and falls back to whole stars otherwise,
  because a rating is usually fed a number from a server rather than a literal.

## Value

- **Any value is drawn; only a touch is snapped.** `clampRating` holds the value
  inside zero and the count and does not snap, so a read-only average of 3.7
  fills seven tenths of the fourth star. `step` constrains what a finger can set.
  A non-finite value draws as zero — a star whose width came out of `NaN` is a
  row that lies about its score.
- **A touch rounds up to the next stop.** Any touch inside a star's cell takes
  that star, and with half stars its left half is the half. A touch exactly on a
  cell's edge belongs to the star before it; the epsilon in `ratingFromOffset` is
  what stops `Math.ceil` and binary floating point disagreeing there.
- **A drag past the first star holds the lowest stop; it does not clear.** A drag
  that overshoots the start is someone rating one star, not someone withdrawing
  a rating. Clearing is its own gesture.
- **`allowClear` is a tap on the value already held**, decided in `onFinalize` by
  `shouldClearRating`. It reads the travel since touch-down, so a drag that
  wanders off and comes back to the same star is a drag rather than a clear, and
  `RATING_TAP_SLOP` is the line between them.
- **The fills sum back to the value.** `starFillOf` gives every star before the
  value a full fill, every star after it none and the one it lands in the
  remainder, and a test sums them.

## Drawing

- **The star is an SVG path drawn here, not an icon.** Central Icons is an
  outlined set: a filled star, and the clipped half of one, has no glyph there.
  The path is ten vertices, stroked in its own fill colour with round joins, which
  softens the points to sit beside the rounded icon set.
- **A partial star is two layers and a clip, not a gradient.** The empty glyph
  sits underneath and the filled one is inside a `View` whose width is the fill as
  a percentage, with `overflow-hidden`. The filled glyph keeps the full glyph's
  size — the window narrows, never the star. A hard-stop gradient would draw the
  same thing, but its stops are paint props re-parsed on every change.
- **The glyph's size is a class on a `View`, and the `Svg` fills it at `100%`.**
  That keeps the icon scale the one source of the size without wrapping `Svg` in
  `withUniwind`, which rule 7 forbids.
- **The colour is a token read with `useThemeColor`, not a class.** A path's
  `fill` is a paint prop no `className` reaches. `RATING_FILL_TOKEN` names the
  token per colour and `resolveRatingPaint` settles it, so the whole paint matrix
  is reachable from `bun test`, which also checks every token it names exists in
  both variants of `theme.css`.
- **An empty star is `muted-foreground` at 30% — the same chrome at every colour.**
  No token sits where an empty star needs to: `border` and `input` vanish against
  a light card, and `muted-foreground` at full strength reads as a disabled
  filled star. The opacity is on the whole `Svg` view, not on the path's
  `fillOpacity` and `strokeOpacity` — half the stroke overlaps the fill, and two
  translucent paints draw a darker ring round every empty star.
- **Invalid outranks the colour on the empty stars too.** A required rating left
  at zero has no filled star to turn red, so the outlines carry the signal or
  there is none.

## Gesture

- **Neither the row nor a star is a `Pressable`**, for the reasons
  [Slider](../slider/AGENTS.md) gives for its track: a tap-to-set would fire
  `onPress` every time, and a `Pressable` per star would nest five taps inside the
  row's pan. One `Gesture.Pan()` on the row reads the star under the finger. What
  is inherited is `playHaptic`, the one haptic switch.
- **The value is written in `onBegin`**, because a pan activates on the first
  movement and a stationary tap would never reach `onUpdate`. `minDistance(0)`
  wins the touch from an enclosing scroll view and `shouldCancelWhenOutside(false)`
  keeps a drag past the last star tracking — both exactly as `Slider.Track`.
- **Each star's cell carries the gap as padding**, so every cell is the same width
  and a star's half is the half of its cell. A `gap-*` on the row would leave dead
  space between cells that belongs to no star.
- **The row is padded on the cross axis only**, to 44pt at every size, and a test
  asserts the sum. The main axis is not padded: the value is read straight off
  the touch's offset along the row, and a gutter there would shift every value.
- **The stars render from React state; the gesture reads a shared value.** Unlike
  a slider, a rating crosses a handful of stops in a whole drag, so a commit per
  crossing is a handful of commits and there is no UI-thread mirror to pay for.
  The shared value exists so the worklet can tell a crossing from a repeat
  without waiting on a render. It is re-synced from React on every gesture's end,
  through a token that exists only to re-run the effect — without it a controlled
  parent that rejects a value leaves the shared value holding it.
- **The haptic ticks on grab, on every star crossed and on a clear.** There is no
  distance rate limit as there is on `Slider`: the stops are a star apart, so a
  flick across ten of them is ten ticks a hand can feel.

## Accessibility

- **The row is one `adjustable` control, not five buttons.** Its value is spoken
  as "3.5 out of 5" and a swipe up or down calls `stepRating`, which lands a value
  between stops on the *next* stop in the direction asked rather than a whole
  step past it. Five buttons would make a screen-reader user visit every star to
  learn one number.
- **A read-only rating is an `image` with the same value** — something to read,
  not something to set, and no actions.
- **`Rating.Output` is hidden from assistive technology**, because the row already
  speaks the value and a second, terser reading one swipe later is noise.
- **Pass `accessibilityLabel` to `Rating.Stars`**, not the root. It defaults to
  "Rating", which is correct and says nothing about *what* is being rated.

## Axes

- **The ladder is two rungs**, the rating's own props then an enclosing
  [Field](../field/AGENTS.md), as on `Slider`. A `Field` reaches the two *state*
  axes only, and a test pins that it cannot acquire a paint axis.
- **`isReadOnly` is the rating's own and does not fade.** A score on a review card
  is content, not a control that happens to be off, so it takes no touch and no
  assistive actions but keeps full strength. `isDisabled` is the one that fades.
