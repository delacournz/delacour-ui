# core

Every number this package computes, and nothing that draws.

## The rule

**No runtime import of `react`, `react-native`, `@shopify/react-native-skia`,
`react-native-reanimated`, `react-native-gesture-handler` or
`react-native-worklets`.** Type-only imports are fine. `d3-scale` and
`d3-shape` are fine — they are pure ESM JavaScript that Bun can parse.

`src/purity.test.ts` enforces it. See the package `AGENTS.md` for why the
failure mode makes a test necessary rather than a convention sufficient.

## Files

| Path | What |
| --- | --- |
| `chart.types.ts` | `ChartPoint`, `ChartSegment`, `ChartBounds`, `ChartSize`, `ChartRow`, `ChartOrientation` |
| `scale/scale.types.ts` | `ScaleDescriptor` — a scale as plain numbers |
| `scale/make-scale.ts` | d3 builds and nices; only the descriptor comes back |
| `scale/scale.ts` | `scaleValue` / `invertValue` — the two flat worklets |
| `ticks/linear-ticks.ts` | Linear and log tick values, with the log thinning d3 does not do |
| `ticks/time-ticks.ts` | Calendar-correct tick values, via `scaleTime` |
| `ticks/tick-count.ts` | Downsampling, and the shared count that aligns two axes' gridlines |
| `ticks/build-ticks.ts` | Values plus positions, through the same scale the marks use |
| `curve/curves.ts` | The d3-shape interpolators, and which of them approximate |
| `curve/build-line.ts` | Points to an SVG path string |
| `curve/build-area.ts` | The same, closed against a baseline or a lower edge |
| `geometry/domain.ts` | Extent, explicit overrides, padding by fraction and by step, zero |
| `geometry/step.ts` | The smallest gap between x values — what a bar's width and the x padding are stated in |
| `geometry/band.ts` | A datum's band on a scale with no band of its own, and where a group's bars sit inside it |
| `geometry/stack.ts` | Series stacked in data space, then scaled; the totals a stacked y domain needs |
| `geometry/category-domain.ts` | Whether the category domain holds the outermost bars — what `ChartBar` warns about |
| `geometry/chart-bounds.ts` | Canvas minus padding minus gutters |
| `geometry/chart-layout.ts` | The two layout passes, and the category/value roles onto the canvas axes |
| `geometry/x-values.ts` | The numeric-or-index decision, made once for the whole series |
| `geometry/transform-input-data.ts` | Rows to plotted points, on whichever axes the orientation says |
| `interaction/path-segments.ts` | SVG path to flat cubic runs, for the UI thread |
| `interaction/closest-index.ts` | Nearest datum, by binary search |
| `interaction/y-for-x.ts` | `y` on the drawn curve, by bisection |
| `animation/morph-strategy.ts` | Which end to pad, and when to resample instead |
| `animation/resample-points.ts` | Two series brought to one length |
| `text/axis-gutters.ts` | Measured label widths to the space an axis needs |
| `text/label-anchor.ts` | Baseline-anchored text placed against a point |
| `text/bar-label.ts` | A label against a bar's value end, base end or side; `top` follows the value end either way round |
| `util/read-at.ts` | A list read that yields `NaN` for a gap or a missing index — the scrub's flat worklet |
| `shape/rect-path.ts` | A rectangle as `M C L C L C L C Z`, every corner a cubic |
| `shape/build-bars.ts` | Points or segments to bar rects and one path, the baseline held inside the plot |
| `shape/build-scatter.ts` | A circle, square or star per point, each on a fixed verb sequence |
| `shape/build-candles.ts` | Candles zipped from four series; six paths, every candle in each |
| `polar/polar.types.ts` | `PieSliceData`, `PolarLayout`, `InnerRadius` — a slice as plain numbers |
| `polar/polar-point.ts` | Degrees clockwise from 12 o'clock to a canvas point, done once |
| `polar/pie-input.ts` | Rows to values and labels, nothing dropped |
| `polar/resolve-layout.ts` | The largest circle the padded canvas holds, and the hole inside it |
| `polar/resolve-slices.ts` | Values to angles; sweeps sum to the circle exactly |
| `polar/build-slice-path.ts` | A slice as eleven verbs, whatever its sweep |
| `polar/label-position.ts` | A label on the bisector, offset across the annulus |
| `polar/slice-index-at.ts` | Which slice is under a point — the sixth flat worklet |
| `polar/slice-opacity.ts` | What one slice draws at while another is selected |

## Design

- **Pure means testable, and testable is the point.** `bun test` cannot render
  a React Native component, so anything worth asserting has to live here. When
  a decision looks like it belongs in a `.tsx` because it is only used once —
  it is only used once *today*. Put it here.

- **Guard the degenerate input at the bottom, not at every call site.** An
  empty series, a single point, a constant series, a zero-size canvas and a
  `NaN` in the source data are all real and all reach these functions. Each
  returns something finite and sensible, which is why nothing upstream has to
  check first.

- **A `"worklet"` directive is a string, not an import.** It costs a module
  nothing in purity, which is how the scrub solver and the scale readers stay
  testable while running on the UI thread.
