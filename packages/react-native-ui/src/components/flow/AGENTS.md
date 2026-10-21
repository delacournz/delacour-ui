# Flow

A pan-and-zoom canvas of nodes joined by edges — a pipeline, an org chart, an automation
builder. Nodes are ordinary views (usually `Card`s) positioned in graph units; edges name the
nodes they join and route themselves from where those nodes are now. Compound root plus seven
parts: `Background`, `Node`, `Handle`, `Edge`, `Group`, `Controls`, `MiniMap`, and the
`useFlow()` hook.

`import { Flow } from "@delacour/react-native-ui/flow";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/flow` |
| `flow.tsx` | Root: the viewport, the canvas gestures, the three layers, fit/zoom/connect, the `Object.assign` surface |
| `flow-background.tsx` | `Flow.Background` — one shader-filled rect sized to the visible graph |
| `flow-node.tsx` | `Flow.Node` — drag, tap, confine, and the node's accessibility actions |
| `flow-handle.tsx` | `Flow.Handle` — placement, registration, and the connection drag |
| `flow-edge.tsx` | `Flow.Edge` — the route worklet, dashes, arrowhead |
| `flow-group.tsx` | `Flow.Group` — the box, its label chip, and the drag that carries its riders |
| `flow-controls.tsx` | `Flow.Controls` — zoom, fit, lock `Button`s on a `Surface` |
| `flow-minimap.tsx` | `Flow.MiniMap` — every entry as a block, plus the visible-area frame |
| `flow-connection-preview.tsx` | Internal: the line a connection drag draws, above the nodes |
| `flow-registry.ts` | Internal: the node/group index — a shared position, size and handle map per entry |
| `flow.context.tsx` | `FlowProvider`, `useFlow()`, `useFlowContext()`, `useFlowPart()`, the canvas-layer, group and node contexts |
| `flow-geometry.ts` | Types, routing, fit, zoom and minimap maths — one worklet, plus JS-thread copies |
| `flow-geometry.test.ts` | Every side pair, every variant, overlap, zero size, fit, zoom, clamp |
| `flow.variants.ts` | The slotted `tv()`, the defaults, and every non-geometry resolver — no RN imports |
| `flow.variants.test.ts` | |

## Design

- **The app owns the graph; the canvas never changes it.** Positions are props. A drag moves a
  node's shared value on the UI thread, then reports once through `onNodeDragEnd`; a connection
  reports through `onConnect`. An app that ignores a callback sees the node stay where the drag
  left it until its own state next changes — nothing is silently rewritten.
- **Every entry has two copies of its position, and the UI thread's is the live one.** The
  registry holds a `SharedValue` per node and group. A drag writes it with no React render, the
  node layer's transform turns it into pixels, and every edge's `useDerivedValue` reads the same
  value — so edges follow on the same frame rather than a render behind. React state holds only
  *which* nodes exist, never where they are.
- **Registry entries are made by whoever asks first.** An edge may render before the nodes it
  names, so `ensure(id)` creates the entry and the node fills it in on mount. An edge to a node
  that never mounts draws nothing, never a line from the origin.
- **All geometry is one module-scope worklet with its helpers inside it.** A worklet calling a
  sibling worklet captures it in source order, and the UI thread throws "undefined is not a
  function" the first time a node moves. Worklets reach geometry as `flowGeometry().route…`; the
  JS thread and the tests use the destructured copies, which are not worklets.
- **Children draw in three layers whatever order they are written in.** `sortLayers` walks
  children, fragments and arrays: `Edge` and `Background` go into one Skia canvas beneath the nodes,
  `Node` and `Group` into the transformed view, `Controls` and `MiniMap` on top unscaled. An
  edge wrapped in a custom component is not found — it renders `null` and warns in development.
- **Layers are chosen by `displayName`, never by `child.type === FlowEdge`.** In a development
  bundle the element's type is not the function the root imported, so the identity check sent
  every edge and the background to the node layer, where they drew nothing — a canvas of cards
  with no lines. `resolveFlowChildLayer` is the pure, tested mapping. Every child is re-keyed
  under its path, so a `.map()` of nodes and a `.map()` of edges sharing ids never collide.
- **The canvas takes its size from the caller, not `flex-1`.** `flex: 1` sets a zero flex basis,
  so inside a content-sized parent — a gallery, a scroll view — a `flex-1 h-96` canvas collapsed
  to nothing. Pass `h-*`, or `flex-1` yourself where the parent has a height.
- **The JS thread never reads back a shared value it just wrote.** A write from the JS thread
  lands on the UI thread a frame later, and a read in between returns the old value. So sizes and
  the container are mirrored on the JS side (`meta.size`, a ref), the handle map is rebuilt from
  `meta.handles` rather than spread from `handles.value` — spreading made a node's second handle
  erase its first, and edges fell back to automatic sides — and `fitViewOnMount` fits a frame
  after the last layout.
- **`isMeasured` survives an unmount.** A remount (Fast Refresh, a strict-mode double effect)
  re-runs effects but not `onLayout`; clearing it left every node unhittable for connections.
- **The node layer is huge and centred on the origin.** A view translated outside a zero-size
  parent draws but is not hit tested on every platform, so the layer extends
  `FLOW_LAYER_EXTENT` past the canvas each way and scales about its own centre, which is the
  graph's origin. An empty view allocates no backing store at that size.
- **The canvas is a second React reconciler, so nothing inside it reaches the app.** Context does
  not cross `<Canvas>`: an edge calling `useThemeColor` there would read no `ScopedTheme`, and
  `useCalmMotion` no `CalmMotionProvider`. The root collects every colour its canvas children
  name (`collectFlowCanvasTokens`), resolves them above the canvas in one `useThemeColors` call
  with `isCalm` beside them, and re-renders `FlowProvider` plus `FlowCanvasLayerProvider` inside
  the canvas — the trick `@delacour/react-native-charts` uses. A part off the canvas gets `null`
  from `useFlowCanvasLayer()` and warns. The preview and the minimap own their canvases and
  resolve their colours just outside them.
- **`flow.tsx` imports `lib/skia-native-id` for its effect.** After a JS reload Skia reused the old
  runtime's canvas ids, which its native registry still held as torn down, so the edges and the
  background came up blank — the minimap too — until a re-render (pressing the lock was enough).
  The import moves this runtime's ids to a fresh range before any of the three canvases asks for one.
- **Shared values go straight into Skia props.** The pan and zoom are one derived `transform` on
  the canvas's `Group`; an edge's route is a derived `SkPath` (`Skia.Path.MakeFromSVGString` in
  the worklet), its march a `DashPathEffect` `phase`. Nothing crosses to the JS thread per frame.
- **The background is a runtime shader, not a pattern.** One SkSL effect draws dots, a grid or
  crosses as a signed distance in graph units, so the marks scale with the zoom and stay sharp at
  any of it. Runtime SkSL has no `fwidth`, so the antialias width — one device pixel in graph
  units — is a uniform, `1 / (zoom × PixelRatio)`.
- **Gestures nest innermost-first.** A handle's drag blocks its node's and the canvas's, a
  node's drag blocks the canvas's, and a node that cannot be dragged lets the canvas pan
  straight through it. The canvas's pan and pinch are simultaneous and both incremental, so a
  two-finger gesture pans and zooms about the fingers at once without either clobbering the other.
- **A tap is exclusive with the drag**, which starts after `dragMinDistance` (4 pt), so a press
  only fires when the finger did not travel.
- **Groups are not a coordinate space.** A grouped node's position is a graph coordinate like
  any other, so routing, fit and the minimap never know it is grouped. The group box draws as a
  sibling beneath its children. Its drag offsets its own and every rider's shared value in one
  worklet and fires `onNodeDragEnd` for the group and each rider. `isPinned` keeps a node from
  its own drag but it still rides; `isDraggable={false}` keeps it put on the canvas, group or not.
- **A connection is validated twice, by two owners.** `resolveDraggedConnection` applies the
  handle types (a drag may start at either end; a node never joins itself), then the app's
  `isValidConnection` has the last word. The same validator filters the node's "Connect"
  accessibility actions, so a screen reader is never offered a connection a finger would be
  refused.
- **Fit never magnifies past one to one.** Fitting a single small node would otherwise blow it
  up to `maxZoom`. `fitViewOnMount` waits until every mounted entry has measured and the canvas
  has a size, then fits once without animation.
- **Lock disables pan, zoom, every drag and every connection.** The zoom and fit buttons
  disable with it; the lock button reports its state as `selected`.
- **Animated dashes are decorative, so they stop under calm motion.** `useCalmMotion()` covers
  reduce motion and an E2E build's `isMotionCalm`. A fit or zoom animates for
  `fitDuration` unless reduce motion is on, in which case it jumps.
- **Controls and the minimap are absolutely positioned `Surface`s, not popovers.** No overlay
  layer is needed for something that never leaves the canvas.
- **The minimap's bounds hold the visible area too**, so its frame never slides off the map
  when the canvas is panned past the graph. It takes no touches.
- **Skia is an optional peer.** The renderer is `react-native-skia` + Reanimated +
  Gesture Handler. Skia was already the `Chart` renderer, so an app with either has it; one with
  neither installs it when it adds `flow`.

## Accessibility

- **A node is one element.** Its content merges under `accessibilityLabel` (default: its id),
  with `selected` state and actions for everything a finger can do: activate (when `onPress`),
  move up/down/left/right by `accessibilityMoveStep` (when draggable), one "Connect …" per valid
  pairing of its source handles with another node's target handles, and delete (when
  `onDelete`). Each reports through the same callback the gesture uses.
- **Connect actions are opaque names** (`connect-0`) mapped back to connections, so an id with a
  space or colon never has to survive a round trip through an action name.
- **Handles, edges, the background and the minimap are hidden.** A line has no name of its own;
  the node's label and actions already say what it joins.
- **Controls are labelled `Button`s** — "Zoom in", "Zoom out", "Fit to view", "Lock canvas".

## Performance

- A drag, a pan and a pinch render nothing. React re-renders only when an entry mounts, unmounts
  or changes its handles.
- An edge's route runs per frame on the UI thread only while something it reads is moving.
- Check large graphs on a device; 30 nodes / 40 edges is the target the demos are sized for.
