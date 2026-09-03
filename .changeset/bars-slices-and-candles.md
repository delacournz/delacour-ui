---
"delacour-react-native-charts": minor
"delacour-react-native-ui": minor
"delacour": patch
---

Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

**`delacour-react-native-charts`** gains four marks and a second root. `ChartBar` draws
one bar per datum on a cubic-cornered rect path, so a corner radius animates
without snapping; sibling bars share a step and bars naming one `stackId`
stack in data space, so the y domain covers the running totals rather than
the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
swaps the axis roles at the model, so bars grow rightward from a category
axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
that morphs between any two data sets and a scrub-free tap that resolves a
slice index. `delacour-react-native-charts/core` exports the bar, scatter, candle and
slice geometry alongside the scales.

**`delacour-react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
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
