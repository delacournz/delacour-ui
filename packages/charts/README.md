# @delacour/charts

Headless charting primitives for React Native — Skia for drawing, Reanimated
for animation, Gesture Handler for touch.

No tokens, no `className`, no theme. Every colour, font and size is a value you
pass in. If you want charts already wearing a design system, use
[`@delacour/native-ui/chart`](https://ui.delacour.co.nz/docs/native/components/chart),
which is this engine with the tokens attached.

> **Alpha.** Both this package and `@delacour/native-ui` publish to npm's
> `alpha` tag. `latest` deliberately points at nothing.

## Install

```bash
bun add @delacour/charts@alpha
bunx expo install @shopify/react-native-skia
```

Peers: `@shopify/react-native-skia`, `react-native-reanimated`,
`react-native-gesture-handler`, `react-native-worklets`, `react`,
`react-native`.

Your app needs a `GestureHandlerRootView` at its root. This package does not
render one — a nested root is dead weight, and every React Native app that
handles touch already has one.

## Use

```tsx
import { CartesianChart, ChartArea, ChartLine } from "@delacour/charts";

<CartesianChart data={rows} xKey="day" yKeys={["revenue"]}>
  {({ points, bounds }) => (
    <>
      <ChartArea baseline={bounds.bottom} color="#0A84FF22" curve="monotone" points={points.revenue} />
      <ChartLine color="#0A84FF" curve="monotone" points={points.revenue} strokeWidth={2} />
    </>
  )}
</CartesianChart>
```

Marks also read the chart context, so they can be placed rather than called:

```tsx
<CartesianChart data={rows} xKey="day" yKeys={["revenue"]}>
  <ChartLine color="#0A84FF" yKey="revenue" />
</CartesianChart>
```

Bars stand on zero and need half a step of x padding so the outermost ones sit
inside the plot. Sibling series stack when the root is told which keys to
stack, because only the root can size the y axis for the totals:

```tsx
import { CartesianChart, ChartBar, ChartBarStack } from "@delacour/charts";

<CartesianChart data={rows} domainPadding={{ x: 0.5 }} includeZero xKey="month" yKeys={["revenue"]}>
  <ChartBar color="#0A84FF" roundedCorners={{ topLeft: 4, topRight: 4 }} yKey="revenue" />
</CartesianChart>

<CartesianChart data={rows} domainPadding={{ x: 0.5 }} stackKeys={["web", "ios", "android"]} xKey="month" yKeys={["web", "ios", "android"]}>
  <ChartBarStack colors={["#0A84FF", "#30D158", "#FF9F0A"]} yKeys={["web", "ios", "android"]} />
</CartesianChart>
```

Add `orientation="horizontal"` to the root and the categories run down the
left with the bars growing rightward; nothing else changes.

A pie is its own root. Slices, labels and the hairline between them are marks,
and a tap reports the slice under the finger:

```tsx
import { PieInset, PieLabel, PieSlices, PolarChart } from "@delacour/charts";

<PolarChart data={rows} innerRadius="60%" labelKey="browser" onSlicePress={setSelected} selectedIndex={selected} valueKey="share">
  <PieSlices colors={["#0A84FF", "#30D158", "#FF9F0A", "#FF375F"]} />
  <PieInset color="#FFFFFF" strokeWidth={2} />
  <PieLabel color="#FFFFFF" font={font} formatLabel={(slice) => `${Math.round(slice.fraction * 100)}%`} minSweep={12} />
</PolarChart>
```

## The maths on its own

`@delacour/charts/core` is every scale, tick, curve and solver in the package,
importable with no Skia in the module graph:

```ts
import { closestIndex, invertValue, makeScale } from "@delacour/charts/core";
```

## Licence

MIT
