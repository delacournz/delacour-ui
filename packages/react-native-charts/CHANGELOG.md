# @delacour/react-native-charts

## 0.1.0-alpha.4

### Minor Changes

- [#53](https://github.com/delacournz/delacour-ui/pull/53) [`f05da78`](https://github.com/delacournz/delacour-ui/commit/f05da7876dcf7b63a99c3ec18dfe47f9d50c6657) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Name both libraries for what they are

  `@delacour/react-native-ui` and `@delacour/react-native-charts` — the names they published under
  before the scope, with the `delacour-` prefix traded for `@delacour/` rather than dropped. Every
  subpath keeps its spelling (`@delacour/react-native-ui/button`, `@delacour/react-native-charts/core`),
  so only the package half of an import changes.

  The pair now matches: the charts package was briefly `@delacour/charts`, which did not say React
  Native and did not sit beside its sibling. Neither intermediate spelling reached npm.

  The CLI stays `delacour`, unscoped, because it is the thing people type:
  `bunx delacour@alpha add button`.

  `@types/react` is pinned in the workspace catalog as part of this: four packages declared three
  different ranges, so two copies were always installed and only hoisting order decided which reached
  the root. The rename changed that order, split `Ref` types across two copies and collapsed every
  `ComponentRef<typeof Animated.View>` to `never`.

## 0.1.0-alpha.3

### Minor Changes

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

## 0.1.0-alpha.2

### Patch Changes

- [#29](https://github.com/delacournz/delacour-ui/pull/29) [`840a3af`](https://github.com/delacournz/delacour-ui/commit/840a3af7e5dc4f0c0d98ee88a8e3fa9742406e5f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Let `useSystemFont(undefined, size)` fall through to the platform font

  `matchFont` spreads the style it is given over its own defaults, so passing
  `fontFamily: undefined` erased the default instead of deferring to it and
  threw "Value is undefined, expected a String" from inside Skia. The key is now
  omitted when no family is given, which is what the documentation had always
  shown.

## 0.1.0-alpha.1

### Minor Changes

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.
