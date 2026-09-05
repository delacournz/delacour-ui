---
"delacour-react-native-ui": minor
"delacour-react-native-charts": minor
"delacour": patch
---

Add charts: a headless Skia engine, and the `Chart` component that skins it

**`delacour-react-native-charts` is new** — a token-free charting engine for React Native,
drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
dot rides the drawn curve rather than hopping between data points, and path
morphing that never falls back to snapping. `delacour-react-native-charts/core` is every
scale, tick, curve and solver in it, importable with no Skia in the module graph.

**`delacour-react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
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
`delacour-react-native-charts` publishes to the `alpha` tag while this repository is in pre
mode, since a bare `bun add` of it would resolve `latest` and find nothing.
