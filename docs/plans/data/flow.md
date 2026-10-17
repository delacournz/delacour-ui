# Flow — DATA-01-P6

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/flow`.
> Largest item in the category. Split into internal phases (below) and commit per phase.

## Purpose on mobile

A pan-and-zoom canvas of nodes joined by edges — a pipeline, an org chart, an automation builder.
Nodes are ordinary React views (usually `Card`s) positioned in graph coordinates; edges name the nodes
they join and route themselves from where those nodes are now. The canvas never mutates the graph:
the app owns nodes, edges and positions, and hears about drags and connections through callbacks.

## API

```tsx
<Flow fitViewOnMount onNodeDragEnd={(id, pos) => move(id, pos)} onConnect={(c) => addEdge(c)}>
  <Flow.Background variant="dots" />
  <Flow.Group id="ingest" position={{ x: 0, y: 0 }} size={{ width: 420, height: 220 }} label="Ingest">
    <Flow.Node id="a" position={{ x: 24, y: 48 }}>
      <Card>…</Card>
      <Flow.Handle id="out" side="right" type="source" />
    </Flow.Node>
  </Flow.Group>
  <Flow.Node id="b" position={{ x: 520, y: 80 }} isSelected={sel === "b"} onPress={() => setSel("b")}>…</Flow.Node>
  <Flow.Edge from="a.out" to="b" variant="smoothstep" isAnimated hasArrow />
  <Flow.Controls />
  <Flow.MiniMap />
</Flow>
```

```ts
type FlowPoint = { x: number; y: number };
type FlowRect = FlowPoint & { width: number; height: number };
type FlowViewport = { x: number; y: number; zoom: number };
type FlowSide = "top" | "right" | "bottom" | "left";
type FlowEdgeVariant = "bezier" | "smoothstep" | "step" | "straight";
type FlowEndpointReference = string;                 // "nodeId" | "nodeId.handleId"
type FlowEndpoint = { nodeId: string; handleId?: string };
type FlowConnection = { source: string; sourceHandle?: string; target: string; targetHandle?: string };

FlowProps: defaultViewport?, minZoom? (0.3), maxZoom? (2.5), canPan? (true), canZoom? (true),
  fitViewOnMount?, fitViewPadding? (48), onViewportChange?, onNodeDragEnd?(id, FlowPoint),
  onConnect?(FlowConnection), isValidConnection?(FlowConnection) => boolean, className?
FlowBackgroundProps: variant? "dots"|"lines"|"cross"|"none", gap? (24), size? (1.6), color?
FlowNodeProps: id, position, isDraggable? (true), isConfined? (false), isPinned? (false), isSelected?,
  onPress?, onDelete?, accessibilityMoveStep? (24), accessibilityLabel?, className?, children
FlowHandleProps: id? ("default"), side? ("right"), type? "source"|"target"|"both", offset? (0.5),
  isHidden?, accessibilityLabel?, className?
FlowEdgeProps: from, to, variant? ("bezier"), isAnimated?, isDashed?, color?, width? (2), hasArrow?,
  fromSide?, toSide?, radius? (8), gap? (20), curvature? (0.25)
FlowGroupProps: id, position, size, label?, isDraggable? (true), className?, children
FlowControlsProps: showZoom? (true), showFit? (true), showLock? (true), step? (1.3), className?
FlowMiniMapProps: corner? "top-left"|"top-right"|"bottom-left"|"bottom-right" ("bottom-right"),
  width? (120), height? (84), nodeColor?, className?
```

Hook `useFlow()` → `{ viewport (SharedValue), fitView(), zoomBy(f), setLocked(b), getNodeRect(id) }`.

## Architecture

- **Renderer**: `react-native-svg` for edges, background, minimap, connection preview; Reanimated
  `useAnimatedProps` drives SVG `d` / transforms. Nodes are `Animated.View`s inside one transformed
  layer (`translateX/translateY/scale` from the viewport shared value). No Skia (README open question 3).
- **Two copies of each node position**: a `SharedValue<FlowPoint>` per node in a registry (UI thread,
  drag moves it with no React render) and React state for edge routing committed at drag end *and*
  throttled (~30 Hz via `scheduleOnRN`) during drag so edges follow. Edges compute their path in a
  worklet from the node shared values when possible (preferred — zero lag); route functions are
  therefore written as pure worklet-safe functions (`"worklet"` directive) in `flow-geometry.ts`.
- **Node size** measured once via `onLayout` into the registry (graph units = layout px at zoom 1).
- **Gestures**: canvas `Pan` + `Pinch` simultaneous (focal-point zoom, clamped); node `Pan` (drag,
  `minDistance` 4) + `Tap` (onPress) exclusive; handle `Pan` draws a connection preview line and, on
  release over another handle (hit test in graph coords, radius 20), validates via
  `isValidConnection` and calls `onConnect`. Innermost detector wins (RNGH default nesting).
- **Groups**: not a coordinate space. Dragging a group offsets its own and its children's shared values
  in one worklet; `onNodeDragEnd` fires for the group and each child. `isConfined` clamps a child to its
  group rect; `isPinned` disables a child's own drag.
- **Lock** (Controls): disables pan/zoom/drag.
- **fitView**: bounds of all node rects + padding → viewport (pure `fitViewport`), animated 300 ms
  (`withTiming`; instant under reduce motion).

## Edge routing (pure, worklet-safe, fully tested)

- `parseEndpoint("a.out")`.
- `resolveAutoSides(sourceRect, targetRect)` — the axis on which the centres are further apart wins;
  source leaves the facing side, target enters the opposite.
- `resolveHandlePoint(rect, side, offset)`.
- `routeStraight`, `routeBezier(curvature)`, `routeStep(gap)`, `routeSmoothStep(gap, radius)` → SVG `d`.
- `arrowHeadPath(end, direction, size)`.
- Animated dashes: `strokeDashoffset` loop (`withRepeat`), stopped when `useCalmMotion()`.

## Accessibility

- Each node: `accessible`, label = `accessibilityLabel ?? id`, `accessibilityActions`: `activate`,
  `moveUp/Down/Left/Right` (custom actions named "Move up" …, stepping `accessibilityMoveStep`, firing
  `onNodeDragEnd`), "Connect <handle> to <node>" for each valid target (generated from handles), and
  `delete` when `onDelete`. Handles are not separate AT elements. Edges, background, minimap hidden.
- Controls are labelled `Button`s ("Zoom in", "Zoom out", "Fit to view", "Lock canvas" + selected state).

## Reuses

`Button` + `Icon` (Controls), `Surface` (MiniMap / Group label chip), `Text`, `useCalmMotion`,
`useThemeColor` (edge/background colours: `border`, `muted-foreground`, `primary`), Gesture Handler,
Reanimated, Worklets, react-native-svg. **No new peers.**

## Internal phases (commit per phase)

1. Geometry + routing + fitView + viewport math, fully tested (`flow-geometry.ts`, `flow.variants.ts`).
2. Canvas: viewport pan/pinch, Background, node registry, static Nodes + Edges.
3. Node drag, groups, confine/pin, `onNodeDragEnd`; edges follow during drag.
4. Handles + connection drawing + `isValidConnection` / `onConnect`.
5. Controls, MiniMap, lock, `useFlow`.
6. Accessibility actions; docs; demos; registry.

## Playground demos

`pipeline` (hero, capture), `edge-variants` (capture), `groups` (capture), `connect` (clip: drag handle
to handle), `drag` (clip), `controls-minimap` (capture), `animated-edges`, `accessible-move`.
Demo graphs live as module-scope constants; state with `useState`.

## Docs page

`flow.mdx`: overview, the app owns the graph, nodes + handles, edges + routing variants, groups,
connections, viewport + controls + minimap, accessibility, performance notes, API.

## Acceptance

- [ ] Geometry/routing resolvers tested (each side pair, each variant, overlapping nodes, zero-size)
- [ ] Pan + pinch smooth at 60 fps with 30 nodes / 40 edges on simulator; edges follow drags without lag
- [ ] Group drag moves children; confine/pin respected; `onNodeDragEnd` fires for group + children
- [ ] Handle drag draws preview; invalid connection rejected; valid one calls `onConnect` only
- [ ] Controls zoom/fit/lock; MiniMap shows viewport rect
- [ ] VoiceOver: move/connect/delete actions work and report through the same callbacks
- [ ] Animated dashes stop under calm motion
- [ ] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [ ] `bun test`, `bun run typecheck`, `bun run check` green
