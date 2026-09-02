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
| `chart.types.ts` | `ChartPoint`, `ChartBounds`, `ChartSize`, `ChartRow` |
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
| `geometry/domain.ts` | Extent, explicit overrides, padding, zero |
| `geometry/chart-bounds.ts` | Canvas minus padding minus gutters |
| `geometry/x-values.ts` | The numeric-or-index decision, made once for the whole series |
| `geometry/transform-input-data.ts` | Rows to plotted points |
| `interaction/path-segments.ts` | SVG path to flat cubic runs, for the UI thread |
| `interaction/closest-index.ts` | Nearest datum, by binary search |
| `interaction/y-for-x.ts` | `y` on the drawn curve, by bisection |
| `animation/morph-strategy.ts` | Which end to pad, and when to resample instead |
| `animation/resample-points.ts` | Two series brought to one length |
| `text/axis-gutters.ts` | Measured label widths to the space an axis needs |
| `text/label-anchor.ts` | Baseline-anchored text placed against a point |

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
