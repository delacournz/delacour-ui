# @delacour/charts

A headless charting engine for React Native, drawn with Skia, animated with
Reanimated, driven by Gesture Handler.

**Token-free by construction.** Every colour, font and size arrives as a plain
value. There is no `className` here, no Uniwind, no theme — that is
`@delacour/native-ui/chart`'s job, and the split is what lets the same engine
be skinned by something else entirely.

```ts
import { CartesianChart, ChartLine } from "@delacour/charts";
import { getYForX, makeScale } from "@delacour/charts/core";
```

## Commands

```bash
bun test                 # the pure core, ~160 assertions
bun run typecheck
bun run check            # Biome
```

## The rule everything else falls out of

**Nothing under `src/core` may import a runtime value from `react`,
`react-native`, `@shopify/react-native-skia`, `react-native-reanimated`,
`react-native-gesture-handler` or `react-native-worklets`.** Type-only imports
are fine; `d3-*` is fine.

React Native ships Flow-typed source that Bun's transpiler cannot parse, so one
such import anywhere under `core/` takes the **entire** test suite down — and
the error names whichever file imported the offender first, not the file that
broke the rule. `src/purity.test.ts` fails first and fails by name.

The consequence is the shape of the package: the chart's geometry is plain
data, and everything above `core/` is a thin translator. That is not a testing
tax. It is what makes ~160 assertions of scale, tick, curve and solver maths
runnable in 80ms with no simulator.

## The flat-worklet rule

**A worklet declared at module scope may close over module-scope constants but
never over another function, imported or local.** Any helper it needs is
declared inside its own body.

Module scope is the whole rule. A module-scope worklet that calls another
module-scope worklet binds at import time in source order, and the UI thread
gets `undefined is not a function` — at the moment a finger touches the chart,
on a device, with a stack naming neither function. Four components in
`@delacour/native-ui` document having learned this;
`src/flat-worklet.test.ts` means nobody learns it again.

A worklet created **inside a hook** is captured by ordinary closure and may
call whatever it likes, including the module-scope worklets here. That is how
`gesture/use-scrub-gesture.ts` composes `closestIndex` and `getYForX` without
duplicating sixty lines of solver, and it is why the rule is scoped rather than
absolute.

It is why `getYForX` bisects rather than solving the cubic analytically: the
closed form is `solveCubic` calling `cuberoot`, which the rule forbids. The
exact solver lives in `y-for-x.test.ts` as an **oracle**, checked against
bisection over a thousand random curves. That is the right place for a second
implementation of anything.

Only five modules carry the directive, all under `core/`. Keeping that surface
narrow is what makes the rule cheap — the overwhelming majority of chart maths
runs once per data change on the JS thread, not once per frame on the UI one.

## Two exports, not twenty

```jsonc
"exports": {
  ".": "./src/index.ts",        // the React surface
  "./core": "./src/core/index.ts" // the maths
}
```

`@delacour/native-ui`'s no-barrel rule exists so an app can skip an optional
peer. This package has no optional peers — everyone needs Skia. `./core` earns
its place for a different reason: it is importable **with no Skia in the module
graph at all**, which is what lets a legend or a tooltip do scale arithmetic
without mounting a canvas. Do not split it further; the marks are mutually
referential through the chart context and cannot be used apart from their root.

## Why d3-scale and d3-shape

Two runtime dependencies, deliberately, on a package that would otherwise have
none.

`scaleTime` is the reason. Local calendar boundaries are not evenly spaced — a
DST spring-forward day is 23 hours, months are four different lengths — and a
hand-rolled interval ladder that snaps on epoch multiples puts every tick an
hour off midnight for half the year. `d3-time` already knows all of it, and
that is the one algorithm in this domain that is quietly wrong when written
from scratch.

`d3-shape` supplies the curve interpolators. It emits an SVG path string which
`src/skia/build-path.ts` re-parses — a real cost, paid once per data change,
and the same one victory-native pays.

Both are pure ESM JavaScript, so **`bun test` can import them**. A d3 module
inside `core/` is not a purity violation.

## What is not here

`band` and `point` scales. A line over categorical x uses the datum's index
against a linear scale — `resolveXValues` substitutes it when a field is not
numeric — which covers a line and an area completely. A category needs a
*width* rather than a position only once bars exist, and that is when the
scales arrive.

`its-fine`, and any context bridge. Skia's `<Canvas>` mounts a second React
reconciler, but context resolves by which reconciler renders the **Provider
node** — so mounting the provider as a child of the chart root puts it inside
the Skia tree and consumers below resolve it normally. No dependency, no
`FiberProvider` wrapping the host app.

`GestureHandlerRootView`. victory's chart wrapper renders one; `DelacourProvider`
already supplies it and a nested root is dead weight. A consuming app must have
one — that is a README line, not a component.

## Files

| Path | What |
| --- | --- |
| `src/core/scale` | Scales as serialisable descriptors, plus the two flat worklets that read them |
| `src/core/ticks` | Tick values, via d3, and the count-normalising that makes two axes share gridlines |
| `src/core/curve` | d3-shape interpolators and the line and area path builders |
| `src/core/geometry` | Domain, plot rect, and rows into plotted points |
| `src/core/interaction` | The scrub solver: SVG re-encoding, nearest datum, `y` on the curve |
| `src/core/animation` | Point-count matching, so two paths are always interpolatable |
| `src/core/text` | Axis gutters from measured label widths, and label anchoring |
| `src/skia` | The only folder importing Skia values: paths and fonts |
| `src/cartesian` | The chart root, its context, the marks and the axes |
| `src/gesture` | The scrub, as shared values holding only numbers |
| `src/animation` | Path morphing, via Skia's own interpolation |
| `src/purity.test.ts` | The rule above, enforced against the source |
| `src/flat-worklet.test.ts` | The worklet rule, enforced against the source |
| `src/no-classname.test.ts` | The token-free promise, enforced against the source |

## Design

- **A scale is data, not a closure.** d3's scales are functions, and a function
  cannot be read on the UI thread. Every scale therefore exists twice: the d3
  object, which stays on the JS thread and does the nicing and the ticking, and
  a `ScaleDescriptor` of plain numbers, which is what crosses into a worklet.
  The moment a field on a descriptor stops being a number, `invertValue` stops
  working on the UI thread and the failure shows up as a scrub dot that never
  moves.

- **Every path segment is re-encoded as a cubic.** `toCurvePath` turns a
  straight `L` into a cubic whose control points sit at the third and
  two-third marks — the same line. So the scrub solver has one segment kind to
  handle however the curve was drawn, needs no branch on verb, and has no
  second code path to get wrong. d3 emits `L` for a linear curve and `C` for a
  monotone one; downstream they are indistinguishable.

- **Point counts are matched in data space, before either path is built.**
  That is the only place matching is geometrically meaningful, and it is why
  the animation never falls back to snapping: two point arrays of equal length
  through the same curve produce the same sequence of path verbs, which is
  exactly what Skia's interpolation requires. `chooseMorphStrategy` then picks
  motion that means what the data did — appended points grow the tail out of
  where the line stopped, a dropped head collapses into the first survivor.

- **A degenerate input returns a finite number, never `NaN`.** A zero-width
  domain maps to the range midpoint; a collapsed plot rect stays a rect rather
  than inverting; an unreadable log domain returns no ticks rather than
  `-Infinity` ones. One `NaN` written into a shared value freezes a chart
  permanently, and there is nothing on screen to say why.

- **A missing y value becomes a gap, not a dropped row.** Dropping it would
  shift every later point one place left against the shared x positions, and
  the line would draw the wrong shape with nothing logged.

- **A single unreadable x value re-bases the whole series onto indices.**
  Mixing measured values with indices breaks the ascending order every binary
  search here assumes, and a scrub lands on the wrong datum in a way that looks
  like a rendering bug.

- **The engine has no demo coverage assertion.** `apps/playground`'s
  `demos.test.ts` enumerates `@delacour/native-ui`'s component folders, and a
  headless package has none. Rather than contort that test, the twelve demos
  under `src/demos/chart/` exercise this package transitively. A change here
  that nothing in native-ui reaches is a change nothing will catch — write the
  test in `core/`.
