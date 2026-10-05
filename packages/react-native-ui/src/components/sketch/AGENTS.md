# Sketch

A freehand drawing surface with its tools around it: a pen, eight shapes, an
eraser, colour swatches, a stroke width and undo — delivered as an SVG string.
Drawn with `react-native-svg`, driven by one Gesture Handler pan on the UI thread.

`import { Sketch } from "@delacour/react-native-ui/sketch";`

It is a drawing canvas, not a "sketchy" rendering style. It is also not a
signature pad (one ink, no tools — that is Forms' Signature, which shares only
the maths), not a paint program (no layers, selection, fills, text, zoom or
pressure), not a raster exporter (`toSVG()` only) and not a modal (presenting it
full-screen or in a sheet is the caller's composition).

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/sketch` |
| `sketch.tsx` | Root: the five controllable axes, the token lookup, the handle, the `Object.assign` surface |
| `sketch-canvas.tsx` | `Sketch.Canvas` — the `Svg`, the live paths, the eraser's live mask and the pan |
| `sketch-groups.tsx` | Internal: the committed drawing as `memo`'d masked runs |
| `sketch-toolbar.tsx` | `Sketch.Toolbar` — the default three-row tray, or the caller's tools in a row |
| `sketch-tool.tsx` | `Sketch.Tool` — a `ToggleButton` per tool or shape, and the shape glyphs |
| `sketch-swatches.tsx` | `Sketch.Swatches` — the colour radio group |
| `sketch-size.tsx` | `Sketch.Size` — the stroke-width `Slider` |
| `sketch-undo.tsx` | `Sketch.Undo` |
| `sketch.context.tsx` | `SketchProvider`, `useSketch`, `useSketchContext`, internal `useSketchPart` |
| `sketch.types.ts` | `SketchHandle`, `SketchExportOptions`, `SketchCommit`, `SketchCanvasSize` |
| `sketch.paths.ts` | **Leaf**: stroke smoothing, the shapes, eraser grouping, SVG export. Imports nothing |
| `sketch.paths.test.ts` | Including a text-level assertion that the leaf has no `import` |
| `sketch.variants.ts` | The slotted `tv()`, the label record, colour/size/label/export resolvers |
| `sketch.variants.test.ts` | |

DisplayNames: `DelacourUI.Sketch`, `.Sketch.Canvas`, `.Toolbar`, `.Tool`,
`.Swatches`, `.Size`, `.Undo`, and the internal `.Sketch.Provider`,
`.Sketch.Groups`, `.Sketch.Group` and `.Sketch.ShapeGlyph.<shape>`.

## Model

- **Strings, not points.** A mark stores SVG path data. The live stroke is built
  as a string on the UI thread one quadratic segment per touch sample
  (`appendSketchSegment`, the midpoint smoother), and a string is what the export
  needs. Points would cost an array copy per sample and a join per frame.
- **Ink is content, not chrome.** An item holds the literal its colour resolved
  to *when it was drawn*, so toggling the theme does not recolour a drawing. The
  default `foreground` swatch is therefore near-black when drawn in light and
  near-white when drawn in dark. `toSVG`'s default background is resolved at
  export time, so the file stays legible either way.
- **The eraser is a mask, not geometry deletion.** It hides only the ink under it
  that was drawn *before* it; a stroke drawn afterwards over the same spot is
  intact. `groupSketchItems` splits the drawing at every eraser and masks each run
  of ink by the erasers after it. The canvas and `sketchItemsToSvg` share that one
  model, so the file matches the screen. Undo removes an erase like any mark.
- **Ids are minted on the JS thread** when a stroke commits. They only have to be
  unique within the drawing.

## Gesture

- **One `Gesture.Pan()` on the canvas, `minDistance(0)`, `maxPointers(1)`.**
  `onBegin` starts the stroke — a pan activates on movement, so a tap never
  reaches `onStart`, and a pen tap must leave a dot. `onFinalize` commits, because
  it is the one callback every path reaches. Nothing runs on the JS thread during
  a stroke.
- **The tool is snapshotted at touch-down.** Tool, shape, ink and width live in
  shared values the pan copies into the stroke in `onBegin`, so a swatch changed
  mid-stroke cannot split it. The gesture is not rebuilt when the tool changes.
- **The live path is cleared after the commit renders, not in the worklet.**
  Clearing in the worklet leaves a frame with no ink before React draws the
  committed copy; clearing late leaves a frame of the same ink twice, which is
  invisible. A stroke sequence number stops the late clear from wiping a stroke
  that began in between. The live path also keeps its *layer* (ink or eraser)
  after release, so a finished erase never flashes up as ink.
- **The live eraser sits in an always-mounted mask over every committed run.**
  Mounting it only while erasing would remount the drawing at touch-down.
- **A shape drag under 4pt on both axes commits nothing**; a tap with a shape tool
  is not a shape. Line and arrow follow the drag; the rest use its normalised
  bounds, so dragging up-left draws the same rectangle as down-right.
- **Until measured the pan is disabled** and `toSVG` returns a `0 0 0 0` viewBox.
- **Worklet capture.** `appendSketchSegment`, `buildSketchShapePath`,
  `startSketchPath`, `finishSketchPath` and `formatSketchNumber` are marked
  `"worklet"` and read nothing at module scope but each other — the same pattern
  `Slider.Track` uses with `slider.variants.ts`. If one ever fails to capture on
  a Release build (`undefined is not a function` on the UI thread), inline it in
  the pan callback and keep the tested function as the reference.
- **Reduce motion changes nothing.** The only motion is the stroke following the
  finger, which is the behaviour itself.

## Rendering

- **SVG, not Skia.** Sketch needs only path strings, which SVG draws and which
  are already the export format. Skia would be a 6 MB+ native view for every
  consumer of the folder and a second drawing model whose output is not SVG.
  Revisit only on profiling data; the maths is path-string based either way.
- **Committed runs are `memo`'d by item identity** (`SketchGroupView`), because
  `groupSketchItems` rebuilds the group objects each time. A new stroke re-renders
  the last run; an erase re-renders the runs it masks.
- **Mask cost scales with mask count.** Consecutive erasers merge into one mask.
  There is no cap on items in v1; if a long session with many erases drags, the
  answer is a future `Sketch.flatten` that bakes runs together, not a cap.
- **`Sketch.Canvas` children are painted under the marks** — an image to
  annotate, or an empty-state hint. The `Svg` is `pointerEvents="none"` and the
  pan sits on the canvas `View`.

## Layout

- **The root does not size itself.** Give it `flex-1` or a height. Its slot used
  to carry `flex-1`, and inside a parent with no definite height a zero flex
  basis beat the caller's `h-*`: the canvas measured 0 and the toolbar floated
  over nothing. A test pins that the slot stays without it.

## Toolbar

- **Tools are `ToggleButton`s**, ghost at rest and filled when in hand, at
  `icon-md` (44pt). They do not use `ToggleButton.Group`: the selection is one of
  N across *two* props, tool and shape, and a group selects by one value.
- **`Sketch.Tool tool="shape"` takes an optional `shape`.** With one it selects
  that shape; without, it switches to the shape tool with whatever shape is
  current and shows it — the default toolbar's middle button. The spec had
  `shape` required; optional is what makes a one-button shape entry possible.
- **The default tray is two rows, three with shapes**: pen / shape / eraser, the
  width slider and undo at the far end; the shape list, only while the shape
  tool is in hand, scrolling rather than wrapping (eight 44pt targets are a hair
  wider than a small phone); then the swatches alone. The slider first sat beside
  the swatches and the simulator showed six swatches leave it no width at all.
- **The shape glyphs are drawn by `buildSketchShapePath`**, at the icon set's 1.5
  stroke, shaped like a Central component so `Icon` sizes and colours them.
  Central has no matching set of eight, and a glyph that is not the shape the
  tool draws is a small lie. The pen and eraser are Central's `IconPencil` and
  `IconEraser`; undo is `IconArrowUndoUp`.
- **A swatch is the one sub-44 target: 36pt around a 24pt dot.** Six swatches
  have to fit a 360pt row with the gutter off. The ring always reserves its
  border and is coloured only when selected, so selection moves nothing.
- **A colour that resolves to nothing is not offered.** `resolveSketchSwatches`
  drops it, and a repeated colour appears once. Ink is never `undefined`.
- **Disabled fades the toolbar, never the canvas.** The marks stay readable.

## Colour

- **Tokens and literals are both accepted.** The root reads every token it can
  paint with in one `useCSSVariable([...])` call (`sketchTokenNames`: the export
  surfaces `background` and `card`, then each swatch token once), because the
  swatch count is data and a hook cannot run per swatch.
- **`toSVG({ background })`** accepts a literal, `background`, `card` or one of
  the swatch tokens. Anything else is transparent rather than a wrong colour.
- **Every colour and path is checked before it reaches markup.**
  `isSafeSketchColor` / `isSafeSketchPathData` guard the export against injection
  from a stored drawing; an unsafe item is skipped, not escaped.

## Accessibility

Drawing is a pointer task; the goal is operable and honest, not equivalent.

- **The canvas is an `image`** labelled `"Drawing, empty"` / `"Drawing, 3 marks"`
  (erasers count). Its content is not described — nothing could, honestly.
- **The canvas has `undo` and `clear` actions**, so a screen-reader user can
  reverse and reset. Drawing by touch exploration is not supported; an
  accessibility-critical flow should offer another input path.
- **Undo announces "Undone".** No announcement per stroke — it would be noise.
- **Labels come from `SKETCH_LABELS`**, a `Record` over every tool and shape, so a
  new shape fails the typecheck until it is named.
- **Swatches are radios in a radiogroup**; tokens are named ("Primary"), literals
  by position ("Colour 3 of 6").

## Verification

- `bun test packages/react-native-ui/src/components/sketch` covers the leaf and
  the resolvers.
- **Checked on an iOS simulator (iPhone 17, dev client, 2026-10-05):** a pen
  stroke and a tap dot draw with no worklet crash; the eraser hides earlier ink
  and a later stroke over the gap is intact; two undos remove that stroke and
  bring the erased ink back; a swatch change applies to the next stroke; the
  star draws and a sub-4pt shape tap commits nothing; the canvas reads "Drawing,
  3 marks"; drawing over `Sketch.Canvas` children and `toSVG` work.
- **Not yet checked:** a Release build (the worklet-capture risk is
  Release-specific), 200-stroke performance, the theme toggle, VoiceOver's
  undo/clear actions, and Android `Mask` rendering — the weaker platform for SVG
  masks; if it breaks, record it here and gate the eraser.
- **Previews (2026-10-06, dev client, iPhone 17 Pro):** `default` is the hero clip,
  `shapes`, `eraser` and `annotate` are clips, `colours` is a still. The flows in
  `.argent/flows/previews/sketch/` draw pen strokes with raw `gesture-custom`
  points (a `swipe` is one straight line) and undo back to the seed, so every
  clip loops. **Every flow waits ~400ms after a tool or swatch tap before
  drawing**: the pan reads tool and ink from shared values the canvas updates in
  an effect, and a stroke begun straight after the tap took the old ink (a black
  loop) or the old tool (an ellipse instead of a tick). No finger is that fast;
  argent is.

## Out of scope

`Sketch.Sheet` and any native sheet; PNG export (`react-native-view-shot` would be
a new native peer); a custom colour picker (`Sketch.Swatches` takes trailing
children for one); selecting, moving or restyling marks; text; layers; redo;
zoom; pressure; multi-touch; persistence; Skia; Signature itself.

## Signature (Forms)

`sketch.paths.ts` is a leaf so Forms' Signature can import it directly (rule 3's
leaf exception) rather than fork the smoother. It must keep importing nothing —
not React Native, not Reanimated, not a sibling. If Signature lands first with
its own smoother, reconcile by moving the better one into this leaf.
