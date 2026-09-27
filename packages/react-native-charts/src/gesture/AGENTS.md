# gesture

The scrub: shared values, the pan that writes them, and the touch surface.

## The contract

Every field a consumer reads holds a **`number` or a `boolean`**. Never an
`SkPath`, never an object, never a function.

That is what keeps a themed tooltip free of any Skia import and readable from a
plain `useAnimatedStyle` on an ordinary React Native view. A shared value
carrying a Skia host object also has a long history of crashing, which is the
second reason and would be sufficient on its own.

## Two y values per series

`y` is the position **on the drawn curve** at the touched x, solved by
`getYForX` against the same cubics the renderer drew. A dot bound to it glides
continuously along the line.

`snappedY` is the position of the nearest datum. A dot bound to it lands on
real measurements.

Both come out of one binary search, so offering both costs nothing and the
consumer picks. Victory-native only does the second; react-native-graph only
does the first.

For a stacked key the root builds `ys` and the curve from the stacked segment
tops, so the dot sits on the segment that is visible, while `values` stay the
raw series so the readout prints what was measured.

## A point per series, either way round

Each series also carries `snappedX` and `x`: with `snappedY` and `y` they are
the nearest datum's canvas point on that series, and the gliding equivalent,
**whichever way the chart is oriented**. A cursor dot reads the pair and
never asks. On a horizontal chart the touch **y** is what matters — clamped,
inverted against the category scale and matched to a row — and there is no
curve to glide along, so the glide values equal the snapped ones.

The root's fields say where the category is: `snappedX` on a vertical chart,
`snappedY` on a horizontal one, `NaN` on the other. A band highlight is
`xStep.px` wide centred on whichever is finite. `xValue` is the category value
under the touch on either.

## Files

| Path | What |
| --- | --- |
| `gesture.types.ts` | The shared-value contract and the scrub's input model |
| `use-chart-scrub.ts` | Allocates the shared values |
| `use-scrub-gesture.ts` | The pan, and everything it does on the UI thread |
| `gesture-overlay.tsx` | An absolute-fill view holding the gesture detector |

## Design

- **`makeMutable` in one `useMemo`, not `useSharedValue` in a loop.** The
  series list is data. Calling a hook per series breaks the rules of hooks the
  moment a series is added, and the memo is keyed on the joined key signature
  so a fresh array of the same keys does not reallocate — which would strand
  the gesture writing to values nothing renders any more.

- **`onFinalize`, never `onDeactivate` alone.** `onFinalize` is the one
  callback that runs on every path out of the gesture, so the dot is never
  stranded on screen until the next touch. This is the bug `react-native-graph`
  fixed and left a comment about, in Gesture Handler 2's `onEnd`.

- **`shouldCancelWhenOutside: false`.** A finger dragged above or below the
  plot keeps scrubbing. Cancelling there strands the gesture for anyone whose
  thumb drifts off the chart, which is most people.

- **`hold` is the default, not `claim`.** A chart usually lives in a scrolling
  feed, and a scrub that activates on a plain drag steals the scroll. Holding
  first is deliberate on the user's part, so nothing is taken by accident. A
  chart that owns its width should be given `claim` explicitly.

- **The handlers close over `apply`, a hook-scope worklet, and that is why they
  may call `getYForX`.** It is captured by ordinary closure. The
  flat-worklet rule in the package `AGENTS.md` constrains module-scope worklets
  only, which is why the solver can be composed here rather than duplicated.

- **Touches land on a React Native view, not on the canvas.** A Skia canvas is
  one view however much is drawn on it, so there is nothing to hit-test
  against. An absolute-fill sibling keeps the hit area exactly the chart's
  bounds and keeps gesture composition ordinary.

- **The pan is a hook, so it exists even when there is nothing to scrub.**
  `usePanGesture` cannot be skipped on the render where the chart has no scrub
  state, so it is mounted disabled and `useScrubGesture` returns `null` in its
  place — the root mounts no overlay for `null`, exactly as before. The
  behaviour's activation options (`activateAfterLongPress` for `hold`, the
  offsets for `claim`, `block` for `block`) are spread in only when named,
  because each changes how the pan activates just by being present.

- **`blocks` is a Gesture Handler 3 gesture.** A scrollable's own gesture —
  `useNativeGesture()` on the list the chart sits in — which the pan is then
  given as `block`. A v2 `Gesture.Native()` is not accepted.
