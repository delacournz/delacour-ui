# Chart

Skia charts wearing the theme's five-colour series ramp — the skin over
[`@delacour/charts`](../../../../charts/AGENTS.md), which does the drawing and
knows nothing about tokens.

`import { Chart } from "@delacour/native-ui/chart";`

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
| `chart-grid.tsx`, `chart-line.tsx`, `chart-area.tsx` | Skia marks |
| `chart-x-axis.tsx`, `chart-y-axis.tsx` | Skia axis labels |
| `chart-legend.tsx`, `chart-tooltip.tsx` | React Native, around and over the canvas |

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

- **At most eight token-valued series per render, and it throws past that.**
  `useThemeColor` is a hook and cannot run in a loop over a list whose length
  changes, so the root resolves a fixed eight slots and `partitionChartColors`
  pads to reach them. Literal colours bypass the hook entirely, so a chart of
  twenty literal-coloured series is fine. Eight is an opinion — a categorical
  legend stops being readable well before it — not a limit of the technique.

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

- **Parts must be direct children of `<Chart>`.** The root partitions them by
  component identity to decide what goes inside the canvas, what floats over
  it and what sits under it — the technique `Spinner` uses on its own children.
  An array from `.map()` is fine, since `Children.toArray` flattens it; a mark
  wrapped in a caller's own component is not, because there is nothing to match
  until it renders.

- **`@delacour/charts` is an optional peer, not a dependency.** A dependency
  may be nested, and two copies of the engine mean two chart contexts — so a
  correctly-nested `<Chart.Line>` would throw "must be used inside a `<Chart>`"
  from inside a `<Chart>`. It also peer-depends on Skia, so a dependency would
  install a native module for someone who only ever imported
  `@delacour/native-ui/button`.
