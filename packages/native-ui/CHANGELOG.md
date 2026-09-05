# delacour-react-native-ui

## 0.1.0-alpha.1

### Minor Changes

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

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

- [#21](https://github.com/delacournz/delacour-ui/pull/21) [`d9a7473`](https://github.com/delacournz/delacour-ui/commit/d9a7473cd5acee4113a59d16799feecd16a4fcc0) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Button.Group`, which joins several controls into one segmented run — with
  `Button.Group.Separator` for a rule between two members and `Button.Group.Text`
  for a chunk that says something rather than doing something. An `Input` joins the
  same way.

  ```tsx
  <Button.Group variant="outline">
    <Button onPress={archive}>Archive</Button>
    <Button onPress={report}>Report</Button>
    <Button onPress={snooze}>Snooze</Button>
  </Button.Group>

  <Button.Group>
    <Button onPress={save}>Save</Button>
    <Button.Group.Separator />
    <Button accessibilityLabel="More" size="icon-md" onPress={openMenu}>
      <Icon icon={IconChevronDownSmall} />
    </Button>
  </Button.Group>
  ```

  Each member squares the pair of corners crossing a seam and overlaps its
  neighbour by a point, so two adjacent borders draw as one hairline. React Native
  has no sibling selector, so a member's place is computed in JavaScript and
  published through context rather than matched with CSS — which also means a
  control this package has never heard of can join a run by reading
  `useButtonGroupItem()`.

  The group owns its members' axes: their step outright, since controls of
  different heights do not join, and `variant`, `isDisabled` and `feedback` as
  defaults a member may override. A member keeps its own _shape_, so a square
  button still works inside a run — an `icon-md` member of an `sm` group comes out
  `icon-sm`.

  Nothing existing changes behaviour: a button outside a group draws exactly the
  corner it drew before.

  - New exports: `BUTTON_GROUP_ORIENTATIONS`, `BUTTON_GROUP_POSITIONS`,
    `BUTTON_GROUP_SEPARATOR_ORIENTATION`, `BUTTON_FEEDBACK`,
    `BUTTON_GROUP_FEEDBACK`, `useButtonGroup`, `useButtonGroupContext`,
    `useButtonGroupItem`, `useButtonGroupItemContext`, `ButtonGroupProvider`,
    `ButtonGroupItemProvider`, and the pure resolvers `resolveGroupPositions`,
    `resolveGroupSeams`, `resolveButtonFeedback`, `resolveGroupedButtonSize` and
    `resolveButtonSizeStep`.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

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

- [#19](https://github.com/delacournz/delacour-ui/pull/19) [`dea1a7c`](https://github.com/delacournz/delacour-ui/commit/dea1a7c30963629cb8581b6ea1ade7f266a70b57) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - **Breaking.** `Button`'s `isIconOnly` prop is removed. A square footprint is now a
  size: `size="icon-sm"`, `size="icon-md"` or `size="icon-lg"`.

  ```tsx
  // before
  <Button accessibilityLabel="Favourite" isIconOnly size="sm" variant="ghost">

  // after
  <Button accessibilityLabel="Favourite" size="icon-sm" variant="ghost">
  ```

  Each `icon-*` size is its labelled step with the horizontal padding traded for a
  width off the same token, which is shadcn's spelling and makes padding and width
  mutually exclusive by construction rather than by rule.

  - `BUTTON_SIZES` now holds all six values, and is derived from the new
    `BUTTON_LABEL_SIZES` and `BUTTON_ICON_SIZES` tuples. `ButtonSize` widens to
    match; `ButtonLabelSize` and `ButtonIconSize` are exported alongside it.
  - `buttonVariants` no longer accepts `isIconOnly`; pass the size instead. Its
    signature now matches the public prop exactly, so
    `buttonVariants({ size: "icon-md" })` works.
  - `ButtonLayout` loses `isIconOnly`, and `resolveButtonLayout` no longer takes
    it — it now folds only `isLoading` and `spinnerPlacement`.
  - `useButton()` reports `size` verbatim, so an icon button returns `"icon-lg"`
    rather than `"lg"`. Match against `BUTTON_ICON_SIZES` where a child needs to
    know it sits inside a square one.

### Patch Changes

- Updated dependencies [[`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80), [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80)]:
  - delacour-react-native-charts@0.1.0-alpha.1
