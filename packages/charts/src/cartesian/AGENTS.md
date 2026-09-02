# cartesian

The chart root, its context, and the marks and axes drawn inside it.

## Where things are mounted, and why

```
View        onLayout, and the only thing that knows the chart's size
  Canvas    the Skia reconciler starts here
    Provider  ← rendered INSIDE the canvas, so marks below can read it
      children
  Overlay   an ordinary RN view; the canvas has no touch targets
```

The provider's position is the whole design. `<Canvas>` mounts a **second React
reconciler**, and context does not cross a reconciler boundary — but it
resolves by which reconciler renders the *provider node*, not by where the
context object was created. Placing the provider among the canvas' children
puts it in the Skia tree, and every mark below resolves it normally. No
`its-fine`, no context bridge, no `FiberProvider` wrapping the host app.

**The consequence for anything that skins this package:** every hook that reads
a theme — `useThemeColor`, anything backed by a CSS variable — has to be called
*above* the canvas and its result passed down as a plain value. There is
nowhere inside to call one. That is not a limitation to work around; it is what
keeps the re-render boundary visible in a diff.

## Files

| Path | What |
| --- | --- |
| `cartesian-chart.tsx` | The root: measure, model, canvas, provider, gesture overlay |
| `cartesian-chart.context.tsx` | The context, its hook, and the optional variant |
| `cartesian-chart.types.ts` | Props, render args, and the key-narrowing helpers |
| `hooks/use-canvas-size.ts` | `onLayout` on the wrapping view |
| `hooks/use-chart-model.ts` | The two passes, with the measuring between them |
| `marks/chart-line.tsx` | A stroked series |
| `marks/chart-area.tsx` | The region between a series and a baseline |
| `marks/chart-grid.tsx` | One path holding every rule |
| `axes/chart-x-axis.tsx` | Tick labels below the plot |
| `axes/chart-y-axis.tsx` | Tick labels beside the plot |

## Design

- **A mark takes `yKey` or `points`, never needing both.** Given a key it reads
  the context; given points it draws exactly those. That is what lets one
  implementation serve the declarative call site and the render-prop one, so
  the two can never drift apart or grow different bugs.

- **The model is a hook, and everything it computes is not.** `useChartModel`
  measures labels with the font and does nothing else of consequence — the
  planning either side of the measurement lives in `core/geometry/chart-layout.ts`
  and is unit-tested. `bun test` cannot render a `.tsx`, so logic left in one
  is logic nothing checks.

- **Skia text for axis labels; React Native text for legends and tooltips.**
  The distinction is whether it moves *with* the canvas. Under a pan the marks
  move on the UI thread, and an overlaid RN label would move on the JavaScript
  thread and lag by a frame — the most visible bug a chart can have. A legend
  sits beside the canvas and is static relative to it, so it belongs in a view
  where it can have a type scale and a colour token.

- **The grid is one path, not one node per rule.** Two axes at eight ticks each
  is sixteen Skia nodes for what is a single stroke, and node count is what a
  Skia tree costs.

- **`useChartContext` throws outside a chart.** A mark that silently rendered
  nothing would leave a blank canvas with no error, and a Skia tree has no
  element inspector to look at.

- **The scrub model is rebuilt on the JavaScript thread and read on the UI
  one.** The root packs bounds, x positions, the scale descriptor and each
  series' cubic runs into a single shared value whenever the data changes. The
  pan then reads plain numbers every frame, with no bridge hop — which is what
  lets the dot keep up with a fast drag.
