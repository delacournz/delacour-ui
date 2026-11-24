# Chart

Skia charts wearing the theme's five-colour series ramp — the skin over
[`@delacour/react-native-charts`](../../../../react-native-charts/AGENTS.md), which does the drawing and
knows nothing about tokens.

`import { Chart, PieChart } from "@delacour/react-native-ui/chart";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/chart` |
| `chart.tsx` | The root, the child partition, and the single `Object.assign` |
| `chart.context.tsx` | The context, mounted twice — see below |
| `chart-frame.tsx` | The frame the canvas fills, as the chart's one accessibility element — an image, or an adjustable stepping the scrub |
| `chart-accessibility.ts` | The pure text alternative: the summary, the readout, the index step, a slice's spoken label |
| `chart-accessibility.test.ts` | Every sentence those produce |
| `chart-accessibility.render.test.tsx` | The frame's role, name, override and steps, mounted |
| `chart.types.ts` | `ChartConfig`, `ChartSeriesConfig`, `ChartResolvedSeries` |
| `chart.variants.ts` | The slotted `tv()`, the ramp, and every pure resolver |
| `chart.variants.test.ts` | Including the assertion that the ramp tokens exist |
| `chart.render.test.tsx` | Mounted under Jest — legend rows, config relabels, dropped pie rows, `Center`, the controlled pie tooltip and the documented throws. Slice taps and the scrub are not reachable: the gestures live in the engine, without a test id |
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
| `pie-chart-slice-targets.tsx` | A selectable pie's accessibility tree — the summary and one `button` per slice, never touch-reactive |
| `pie-chart.render.test.tsx` | The pie's text alternative and its slice items, activated the way VoiceOver and TalkBack do |

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

- **`frameClassName` resizes the frame, not the root.** The canvas fills the
  frame, and the frame carries the size's height, so a `className` on the root
  cannot shorten the plot — the frame would overflow it. `frameClassName` is
  merged after the size's `h-chart-*`, and the tokens are registered with
  tailwind-merge, so `h-16` cleanly replaces it. `Kpi.Sparkline` is the reason
  it exists: a sparkline is a chart with no axes a third the height of the
  smallest one.

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

- **A series can be told apart by more than its colour.** `dash` on a config
  entry — or `Chart.Line dash`, with `false` forcing it solid — draws that
  line dashed, and `Chart.Legend` draws the same series' swatch as a dashed
  sample. Colour alone fails anyone who cannot separate the two hues, a
  greyscale print, and a low-contrast pair (WCAG 1.4.1); a cue the legend did
  not repeat would distinguish two lines without saying which is which. The
  lengths are what shows: the engine moves the round cap's reach out of each
  dash, so a short gap does not close up into a solid line. The swatches are
  hidden from assistive technology — the label beside each names the series.

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

- **Candle sentiment is the top of the ramp.** A rising candle is `chart-1`
  and a falling one `chart-2`, so a candlestick is painted from the same five
  colours as every other chart and a pasted palette recolours it with them.
  `success` and `destructive` were tried first and made the one chart on a
  dashboard that ignored the ramp; a flat candle is `muted-foreground`. The root
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

- **The frame is the chart's one accessibility element.** A Skia canvas is one
  opaque view, so a chart with no text alternative is announced as nothing,
  and its scrub is a long press only a sighted finger can make. The frame
  carries `resolveChartSummary` — the x range, then each series' lowest,
  highest and latest — as an `image`; with a `Chart.Tooltip` placed it is an
  `adjustable` instead, whose increment and decrement step one datum through
  `stepChartIndex` and write the engine's `scrub.focus`, so the tooltip, the
  cursor and the dot follow exactly as they would a touch. Its value text is
  `resolveChartReadout` through the tooltip's own `formatHeading` and
  `formatValue`, read off the placed tooltip at partition time, and the
  tooltip prints through the same `chartTooltipValueText` — the spoken and the
  drawn readout cannot drift. The index lives in `ChartFrame`, a leaf, so a
  drag re-renders the frame and not the root. `accessibilityLabel` replaces
  the summary verbatim; `accessible={false}` hides the chart for a parent that
  names it, which is what `Kpi.Sparkline` does. The summary's words are the
  `labels` prop, not literals: see the bullet below.

- **The scrub stays up after a step.** Nothing clears it: there is no
  accessibility blur to clear it on, and the next touch's end does. A
  sighted helper beside a screen-reader user sees the datum being read.

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

- **The spoken strings are the `labels` prop, not literals.** `Chart` and `PieChart`
  take `labels?: Partial<ChartLabels>` (catalog key `chart`; the pie's keys are
  prefixed `pie`): `noData`, `range`, `summary`, `seriesNoData`, `seriesSummary`,
  `readoutRow`, `noValue`, `readout`, `open`/`high`/`low`/`close` (the candlestick
  tooltip rows), `pieNoData`, `pieSummary`, `pieSummarySlice`, `pieSlice` and
  `piePercent` (also the default slice label and tooltip percentage). Precedence is
  defaults <- `DelacourProvider` `labels` <- the root's prop; an explicit
  `accessibilityLabel`, `format`, `formatValue` or `formatPercent` still wins. The
  resolved set rides `ChartContext` / `PieChartContext`. `resolveChartSummary`,
  `pieSliceAccessibilityLabel` and `resolveChartReadout` take an optional `labels`
  field on their input; `resolveTooltipRows` and `pieLabelText` take it as a
  trailing argument — all default to English. Canvas text is unchanged.

- **A pie nothing selects is one `image`; a selectable pie is a summary and a
  button per slice.** The canvas is one opaque view, so without either a
  screen reader announces nothing. A picture pie's frame carries the
  generated summary (`Pie chart. Free 57%, …`) — `accessibilityLabel`
  replaces it, `accessible={false}` removes the pie. A selectable pie's frame
  cannot be the element, because iOS ignores accessible descendants of an
  accessible parent, so the canvas is hidden and `PieChartSliceTargets` stands
  in: the summary, then each drawn slice in order as a 44-point box at its
  label position, named with its value and share through the tooltip's own
  formatters. The boxes are `pointerEvents="none"` and activate through
  `accessibilityTap` on iOS and the `activate` action on Android, the split
  `Pressable` makes — wired inline, because importing it would make `delacour
  add chart` copy `Pressable` and install a haptics module — and a touch
  handler there would steal a sighted tap from the engine's hit test. Activating a slice selects it; it never toggles
  it off.

- **`@delacour/react-native-charts` is an optional peer, not a dependency.** A dependency
  may be nested, and two copies of the engine mean two chart contexts — so a
  correctly-nested `<Chart.Line>` would throw "must be used inside a `<Chart>`"
  from inside a `<Chart>`. It also peer-depends on Skia, so a dependency would
  install a native module for someone who only ever imported
  `@delacour/react-native-ui/button`.
