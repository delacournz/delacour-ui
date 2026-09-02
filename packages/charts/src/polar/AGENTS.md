# polar

The pie and donut root, its context, and the marks drawn inside it.

Mounted the way `cartesian/` is — a measuring `View`, a `Canvas`, the provider
**inside** the canvas, an overlay for touch — for the reasons that folder's
`AGENTS.md` gives. Only the differences are recorded here.

## Files

| Path | What |
| --- | --- |
| `polar-chart.tsx` | The root: measure, model, canvas, provider, and the tap overlay |
| `polar-chart.context.tsx` | The context, its hook, and the optional variant |
| `polar-chart.types.ts` | Props, render args, and the key-narrowing helpers |
| `hooks/use-polar-model.ts` | Layout and slices, memoised — one pass, nothing measured |
| `marks/pie-slice.tsx` | One filled slice, growing out of the centre on mount |
| `marks/pie-slices.tsx` | Every slice, with a cycled palette and selection dimming |
| `marks/pie-label.tsx` | Skia text on each slice wide enough to hold it |
| `marks/pie-inset.tsx` | A stroked hairline on each edge between slices |

## Design

- **Angles are degrees, 0° at 12 o'clock, clockwise.** The convention every
  pie library shares and the one a designer's "start at the top" maps to
  with no arithmetic. `core/polar/polar-point.ts` does the one conversion to
  trigonometric radians; nothing above it repeats it.

- **A slice path is always eleven verbs.** `M C C C C L C C C C Z`, whatever
  the sweep and whether there is a hole — see `core/polar/build-slice-path.ts`.
  That is what lets a data change morph rather than snap, and it is why the
  mount animation is free: the entrance path is the same slice at radius zero.

- **Colours are mark props, never a data field.** The root reads a value and a
  label from each row and nothing else. A colour column would be a token in
  disguise, and this package has none.

- **The tap runs on the JavaScript thread.** `Gesture.Tap().runOnJS(true)`
  calls `sliceIndexAt` and hands the index to React state. A scrub reads a
  shared value every frame of a drag and has to stay on the UI thread; a tap
  fires once and nothing on the UI side wants its result. `sliceIndexAt` is
  still written as a flat worklet so a scrub over a pie could reuse it.

- **The overlay mounts only with `onSlicePress`.** A pie in a scrolling feed
  with no tap handler should take no touches at all, and a gesture detector
  with nothing to do still claims them.

- **`selectedIndex` is the caller's, not the chart's.** The root carries it
  into context and the marks read it; the root never changes it. Holding
  selection state here would put a second copy of it beside the one a themed
  wrapper already keeps, and the two would drift.

- **`PieInset` draws edges, not outlines.** Stroking each slice would outline
  its arcs too, and a stroked arc under a fill of the same colour reads as a
  slice slightly too big. One `M L` per edge is exactly the hairline wanted.
