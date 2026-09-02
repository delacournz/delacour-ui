# Chart

Skia charts wearing the theme's five-colour series ramp — the skin over
[`@delacour/charts`](../../../../charts/AGENTS.md), which does the drawing and
knows nothing about tokens.

`import { Chart, PieChart } from "@delacour/native-ui/chart";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/native-ui/chart` |
| `chart.tsx` | The root, the child partition, and the single `Object.assign` |
| `chart.context.tsx` | The context, mounted twice — see below |
| `chart.types.ts` | `ChartConfig`, `ChartSeriesConfig`, `ChartResolvedSeries` |
| `chart.variants.ts` | The slotted `tv()`, the ramp, and every pure resolver |
| `chart.variants.test.ts` | Including the assertion that the ramp tokens exist |
| `use-chart-font.ts` | `--font-sans` into an `SkFont` |
| `use-chart-palette.ts` | The eight fixed `useThemeColor` slots a series list resolves through |
| `chart-grid.tsx`, `chart-line.tsx`, `chart-area.tsx` | Skia marks; `Chart.Area` takes a `stackId` |
| `chart-bar.tsx` | `Chart.Bar` — a spec the root collects, and a lone engine bar when reached unrouted |
| `chart-bars.tsx` | Internal `ChartBars`: every `Chart.Bar` drawn as one bar, group or stack, spliced in by the root |
| `chart-scatter.tsx`, `chart-candlestick.tsx` | Skia marks — dots per datum, and O/H/L/C candles in the sentiment tokens |
| `chart-x-axis.tsx`, `chart-y-axis.tsx` | Skia axis labels |
| `chart-legend.tsx`, `chart-tooltip.tsx` | React Native, around and over the canvas |
| `chart-tooltip-dot.tsx`, `chart-tooltip-x.tsx`, `chart-tooltip-y.tsx` | Skia cursor marks, named under the tooltip; `.X` is a band over bars |
| `pie-chart.tsx` | The second root: `PieChart`, its child partition, and its `Object.assign` |
| `pie-chart.context.tsx` | The pie's context, mounted twice the same way; `useChartSeries` in `chart.context.tsx` reads either |
| `pie-chart-slice.tsx`, `pie-chart-label.tsx` | Skia marks — the wedges with a hairline between them, and a label per wedge |
| `pie-chart-center.tsx`, `pie-chart-tooltip.tsx` | React Native, over the canvas — the donut hole's content and the tap readout |

## Design

- **Skia's `<Canvas>` is a second React reconciler, so every theme lookup
  happens in the root, above it.** A hook called inside the canvas has no
  Uniwind provider above it and resolves nothing. `ChartRoot` calls
  `useThemeColor` for the series ramp, the grid and the axis labels, and the
  marks receive resolved strings as plain props. This is the single most
  important thing to know before editing anything in this folder.

- **The context is mounted twice, from one value.** Once around the React
  Native subtree — legend and tooltip — and once *inside* the canvas around the
  marks. Context resolves by which reconciler renders the provider node, so a
  provider placed among the canvas' children lands in the Skia tree and marks
  below it read it normally. That is why no context bridge and no `its-fine`
  dependency is needed.

- **A Skia mark takes values, never a `className`.** There is nothing for
  `cn()` to merge on a canvas node and nothing Uniwind could compile. Only the
  root, the legend and the tooltip accept one. Rule 7's `withUniwind` carve-out
  is already spent on `icon.tsx`, and this component does not need a second: it
  sizes the canvas by sizing the `View` around it.

- **The `config` is the chart.** It names each series, sets the draw order, and
  assigns the ramp by position, so a call site writes `yKey="desktop"` and
  never a colour. The shape is shadcn's deliberately — rule 11's principle,
  that a theme written for a web app moves across as a copy rather than a
  translation, extends past token names to the component's own API.

- **The ramp stops at five, and cycles.** `--chart-1` … `--chart-5` are what
  shadcn's palette declares. A sixth token would not survive a pasted theme: a
  designer copying a tweakcn palette supplies five, so a six-series chart would
  draw five themed lines and one stranger — and one wrong-coloured line reads
  as a bug in a way a slightly-off surface does not.

- **At most eight *distinct* tokens per render, and it throws past that.**
  `useThemeColor` is a hook and cannot run in a loop over a list whose length
  changes, so `useChartPalette` resolves a fixed eight slots and
  `partitionChartColors` dedupes the tokens and pads to reach them. The ramp
  dedupes, so a pie of twenty ramp slices needs five. Literal colours bypass
  the hook entirely, so a chart of twenty literal-coloured series is fine.
  Eight is an opinion — a categorical legend stops being readable well before
  it — not a limit of the technique.

- **No new colour token.** The grid is `border`, which is what `Separator`
  already paints a rule between regions with; axis labels are
  `muted-foreground`, the colour every secondary label here uses; the tooltip
  is `popover` on `border`. Rule 11 would require a `--chart-grid` to be
  derived from a shadcn token anyway, and every borrowed palette would leave it
  on this package's default.

- **One new size token trio**, `--spacing-chart-sm/md/lg`. A canvas has no
  intrinsic height, and without a token every chart on a dashboard would be a
  different one. A height rather than `aspect-video` because two charts at
  different widths must still line up — and registering the names with
  tailwind-merge is what lets a caller's `className="aspect-video h-auto"`
  cleanly win when they want that instead.

- **The tooltip is a React Native view even though it floats over the canvas.**
  It wants `popover`, `border`, the radius scale and the type scale, none of
  which exist in Skia, and it is the part a caller most wants to restyle —
  which a className cannot do to a Skia rounded rect. Axis labels are the
  opposite call and stay in Skia: they move with the plot under a scrub, and an
  overlaid React Native label would lag them by a frame.

- **The tooltip's position rides the UI thread; its text does not.**
  `useAnimatedStyle` follows the finger with no bridge hop, while the contents
  update through `scheduleOnRN` only when the nearest datum index changes —
  which is a few times per drag, not once per frame. Text on a shared value
  would mean an animated `TextInput` with a `value` prop pretending to be a
  label.

- **The cursor marks are named under `Chart.Tooltip` but placed beside it.**
  `Chart.Tooltip.Dot`, `.X` and `.Y` are one feature with the readout, so they
  share its namespace — but the readout is a React Native view over the canvas
  and the marks are drawn inside it. Nesting them
  (`<Chart.Tooltip><Chart.Tooltip.Dot /></Chart.Tooltip>`) would put a canvas
  node in a view's tree and draw nothing, with no error. They are siblings, and
  `partitionChildren` routes them to opposite sides of the boundary.

- **The marks snap to the datum, because the readout names one.** A rule
  tracking the raw touch while the label beside it snaps says two different
  things about one gesture. `snappedX` exists on the scrub for exactly this —
  the crosshair, the dot and the number all read the same row. `glide` opts
  into the continuous curve position, and the doc says what it costs.

- **A dot rings itself in the chart's background.** A dot in the series colour
  sitting on a line of that same colour is a slight thickening and nothing
  more; the ring is what makes it a knob. That is why `surfaceColor` is
  resolved in the root and carried on the context.

- **Bars group by being siblings, and stack by sharing a `stackId`.** That
  is shadcn's surface, and it is the reason `Chart.Bar` does not draw itself:
  a bar's width depends on how many share its step, and its base on what is
  stacked under it, so the root collects every `Chart.Bar`, resolves them with
  `resolveBarLayout`, and mounts one internal `ChartBars` where the first bar
  stood. A `Chart.Bar` wrapped in a caller's own component never reaches that
  pass — it renders a single engine bar in its own colour, so it degrades to
  "not grouped" rather than to nothing, but it cannot group or stack.

- **One stack per chart.** Two `stackId`s, a stack beside a loose bar, or an
  area stack beside a bar stack all throw by name. The engine's `stackKeys` is
  one ordered list because the y domain has to cover one set of running
  totals; a second stack would need a group of stacks, which nothing here
  draws yet. Throwing beats drawing something that looks stacked and is not.

- **Bar corners follow `--radius`.** `--radius` × a per-size multiplier, the
  way `Checkbox`'s fill does, so a theme that squares its buttons squares its
  bars. Only `--radius` survives to runtime — the scale is `@theme inline` —
  so `BAR_RADIUS_MULTIPLIER` restates the steps and a test pins it against
  `tokens.css`. A stack rounds only its outermost segment, so a column reads
  as one bar rather than a pile of pills. `rounded={false}` is square.

- **Candle sentiment borrows `success` and `destructive`.** Rule 11: a
  colour with a meaning is a shadcn token, and those two already mean "up" and
  "down" everywhere else here; a flat candle is `muted-foreground`. The root
  resolves the three with three fixed hook calls, which is why the part takes
  only literal overrides — a token given to a mark inside the canvas has
  nothing to resolve it. The config names the close field alone, so the
  legend says one price; the tooltip prints O/H/L/C, swatched by sentiment.

- **The band is `Chart.Tooltip.X`, not a new part.** Over bars or candles the
  rule becomes a wash one `xStep` wide, snapped to the datum, at a twelfth of
  the axis colour. It is the same question — where along x are you — with an
  answer sized to the mark: a hairline through the middle of a bar says less
  than the whole column lit. `band` flips it either way. A cursor dot skips a
  series that is only a bar, because a bar has no curve to sit on and the band
  already picks out its column.

- **Parts must be direct children of `<Chart>`.** The root partitions them by
  component identity to decide what goes inside the canvas, what floats over
  it and what sits under it — the technique `Spinner` uses on its own children.
  An array from `.map()` is fine, since `Children.toArray` flattens it; a mark
  wrapped in a caller's own component is not, because there is nothing to match
  until it renders.

- **Pie is a second root, not a part.** A pie shares nothing with a cartesian
  plot on screen — no axes, no grid, no scrub, no x — and only the palette,
  the legend and the font underneath, so `<Chart><Chart.Pie /></Chart>` would
  be a root whose every other part throws under it. `PieChart` reuses
  `chartVariants` for its frame heights, `useChartPalette` for its colours and
  `ChartLegend` verbatim, through `useChartSeries`, which reads whichever
  context is above it. Its categories are its **rows**: the ramp walks the
  data, and the `config` is an optional override keyed by a row's name.

- **A pie's colours dedupe before the hook.** Twenty slices walk the
  five-token ramp, and `partitionChartColors` collects *distinct* tokens, so
  that costs five of the eight slots rather than throwing at the ninth slice.
  Rows are dropped for a negative or unreadable value **before** the engine
  sees them, so the series, the values, the engine's slices and the legend all
  agree on an index — a selection reports a position in the drawn order.

- **`PieChart.Center` is a React Native view because it wants the type
  scale.** What sits in a donut's hole is a headline number and a caption,
  which want `text-2xl`, `foreground`, `muted-foreground` and a className —
  none of which a Skia `<Text>` has. It centres over the frame, which is the
  circle's centre because the root gives the engine no padding. It is named
  `Center` rather than `Inset` because the engine's `PieInset` is the hairline
  between slices, and the two would otherwise share a name for two things.

- **The pie tooltip is selection-driven, not scrub-driven.** There is no x to
  scrub along, so a tap selects a slice, the others dim, and the readout sits
  just outside that slice's outer edge on its bisector — the position a
  callout would point at. It needs no shared values: the selection changes a
  few times a session, not once a frame. The slice geometry it reads is
  resolved a second time in the root, with the engine's own pure functions on
  the same frame, because the engine's context stops at the canvas boundary
  and the tooltip lives outside it. A tap selects only when something would
  show it — a `PieChart.Tooltip`, an `onSelect`, or a controlled
  `selectedIndex` — so a pie with none of those takes no gesture at all.

- **`@delacour/charts` is an optional peer, not a dependency.** A dependency
  may be nested, and two copies of the engine mean two chart contexts — so a
  correctly-nested `<Chart.Line>` would throw "must be used inside a `<Chart>`"
  from inside a `<Chart>`. It also peer-depends on Skia, so a dependency would
  install a native module for someone who only ever imported
  `@delacour/native-ui/button`.
