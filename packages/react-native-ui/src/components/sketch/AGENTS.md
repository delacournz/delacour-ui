# Sketch

A freehand drawing surface with its tools around it: a pen, eight shapes, an
eraser, colour swatches, a stroke width and undo — delivered as SVG or PNG.
Drawn with Skia (`react-native-skia`, an optional peer), driven by one
Gesture Handler pan on the UI thread.

`import { Sketch } from "@delacour/react-native-ui/sketch";`

It is a drawing canvas, not a "sketchy" rendering style. It is also not a
signature pad (one ink, no tools — that is Forms' Signature, which shares only
the maths), not a paint program (no layers, selection, fills, text, zoom or
pressure), not an image editor (it exports its own marks, never what is under
them) and not a modal (presenting it
full-screen or in a sheet is the caller's composition).

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/sketch` |
| `sketch.tsx` | Root: the five controllable axes, the token lookup, the handle, the `Object.assign` surface |
| `sketch-canvas.tsx` | `Sketch.Canvas` — the Skia `Canvas`, the recorded picture, the live paths and the pan |
| `sketch.skia.ts` | Internal: `drawSketchItems`, the picture recorder and the off-screen PNG render |
| `sketch-toolbar.tsx` | `Sketch.Toolbar` — the default three-row tray, or the caller's tools in a row |
| `sketch-tool.tsx` | `Sketch.Tool` — a `ToggleButton` per tool or shape, and the shape glyphs |
| `sketch-swatches.tsx` | `Sketch.Swatches` — the colour radio group |
| `sketch-size.tsx` | `Sketch.Size` — the stroke-width `Slider` |
| `sketch-undo.tsx` | `Sketch.Undo` |
| `sketch.context.tsx` | `SketchProvider`, `useSketch`, `useSketchContext`, internal `useSketchPart`, `SketchBrush` |
| `sketch.types.ts` | `SketchHandle`, `SketchExportOptions`, `SketchPngOptions`, `SketchCommit`, `SketchCanvasSize` |
| `sketch.paths.ts` | **Leaf**: stroke smoothing, the shapes, eraser grouping, SVG export. Imports nothing |
| `sketch.paths.test.ts` | Including text-level assertions that the leaf has no `import` and the canvas is Skia, not SVG |
| `sketch.variants.ts` | The slotted `tv()`, the label record, colour/size/label/export resolvers |
| `sketch.variants.test.ts` | |

DisplayNames: `DelacourUI.Sketch`, `.Sketch.Canvas`, `.Toolbar`, `.Tool`,
`.Swatches`, `.Size`, `.Undo`, and the internal `.Sketch.Provider` and
`.Sketch.ShapeGlyph.<shape>`.

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
- **The eraser is not geometry deletion.** It hides only the ink under it that
  was drawn *before* it; a stroke drawn afterwards over the same spot is intact.
  Undo removes an erase like any mark. Two renderings, one meaning: on screen and
  in the PNG it is **paint order** — every item drawn oldest first into one layer,
  an erase as a `BlendMode.Clear` stroke, which zeroes what is already there and
  cannot touch what is painted after it. In the SVG it is **masks** —
  `groupSketchItems` splits the drawing at every eraser and masks each run by the
  erasers after it, because SVG has no clear blend. Both read the same items in
  the same order, so the file matches the screen.
- **Ids are minted on the JS thread** when a stroke commits. They only have to be
  unique within the drawing.

## Gesture

- **One `Gesture.Pan()` on the canvas, `minDistance(0)`, `maxPointers(1)`.**
  `onBegin` starts the stroke — a pan activates on movement, so a tap never
  reaches `onStart`, and a pen tap must leave a dot. `onFinalize` commits, because
  it is the one callback every path reaches. Nothing runs on the JS thread during
  a stroke.
- **The tool is snapshotted at touch-down.** Tool, shape, ink and width live in
  the root's shared values (`SketchBrush`, on the context) and the pan copies them
  into the stroke in `onBegin`, so a swatch changed mid-stroke cannot split it.
  The gesture is not rebuilt when the tool changes.
- **The setters write the brush as they run.** It used to be synced from an
  effect after the render, and a stroke begun straight after a tap took the old
  ink (a black loop in red's place) or the old tool. An effect still re-syncs
  from the resolved values, which is what puts back a controlled value the parent
  refused. What is left is the toggle button's own press dispatch: on the
  simulator a stroke 50ms after a tool tap can still beat it, one 120ms after
  cannot — faster than a finger, slower than argent, so the preview flows wait.
- **The live path is cleared after the commit renders, not in the worklet.**
  Clearing in the worklet leaves a frame with no ink before React draws the
  committed copy; clearing late leaves a frame of the same ink twice, which is
  invisible. A stroke sequence number stops the late clear from wiping a stroke
  that began in between. The live path also keeps its *layer* (ink or eraser)
  after release, so a finished erase never flashes up as ink.
- **The live eraser is a `Clear` path in the picture's layer; the live ink is
  outside it.** So the eraser cuts committed ink as it moves, and the stroke
  being drawn is never erased by itself. Both paths are always mounted, empty
  between strokes.
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

- **Skia, not SVG.** It started on `react-native-svg`: a `<Path>` per mark,
  each run of ink wrapped in a `<Mask>` per eraser group, and an animated `d`
  re-parsed by the SVG renderer every frame. Node and mask count grew with the
  drawing, and Android `Mask` rendering was never verified. On Skia the
  committed drawing is one recorded `SkPicture` (`recordSketchPicture`), replayed
  as one draw however many strokes there are; the eraser is a blend mode rather
  than a mask; and the live path is a derived `SkPath` on the UI thread.
- **The picture is re-recorded when `items` or the canvas size change**, in a
  `useMemo` on the JS thread. Recording is a loop of `drawPath` calls with no
  rasterising, so a commit costs one pass over the marks — not a re-render of
  one node per mark.
- **The marks stay strings.** Skia parses each item's `d` with
  `Path.MakeFromSVGString` while recording; the leaf's smoother, the item shape,
  `toSVG` and Signature's import are untouched by the move. Data that does not
  parse is skipped.
- **The layer is load-bearing.** Everything — the picture and the live eraser —
  draws inside one `saveLayer`, so a `Clear` zeroes ink in that layer and leaves
  the canvas transparent rather than punching through to black. That is what
  lets an annotated image or the canvas's own surface show through an erased
  gap.
- **`Sketch.Canvas` children are painted under the marks** — an image to
  annotate, or an empty-state hint. The Skia `Canvas` is absolutely positioned
  over them with `pointerEvents="none"`, and the pan sits on the canvas `View`.
- **The toolbar glyphs stay on `react-native-svg`.** The Central icons the
  toolbar already uses are SVG, and a Skia surface per glyph would be eleven
  surfaces for eleven 24pt icons. Only the drawing moved.

## Export

- **`toSVG()` is vector and `toPNG()` is raster; both hold the marks and the
  background only.** Neither includes what `Sketch.Canvas` children paint under
  the marks.
- **`toPNG()` renders off screen**, on a CPU surface (`Skia.Surface.MakeRaster`) sized
  to the canvas times `scale` (default the screen's pixel ratio), by the same
  `drawSketchItems` the picture records — not a snapshot of the visible canvas,
  which would need the view mounted and would capture nothing of the background
  option. It is synchronous and returns base64 without a `data:` prefix; `""`
  before the canvas is measured. Saving or sharing it is the app's job.

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

- <!-- registry:omit -->`bun test packages/react-native-ui/src/components/sketch` covers the leaf and
  the resolvers.<!-- /registry:omit -->
- **Checked on Skia (iPhone 17 Pro simulator, dev client, 2026-10-06):** the
  seeded picture renders; a red stroke drawn with no pause after the swatch tap
  is red; the eraser clears earlier marks and a later pen stroke over the gap is
  intact; in dark, theme inks parse and `toPNG()` (the `export` demo, not
  captured) matches the screen on the theme's background; erased gaps show the
  canvas surface, not black. All five previews recaptured and identical in
  content to the SVG captures.
- **Checked on SVG, before the move (iPhone 17, dev client, 2026-10-05):** a pen
  stroke and a tap dot draw with no worklet crash; the eraser hides earlier ink
  and a later stroke over the gap is intact; two undos remove that stroke and
  bring the erased ink back; a swatch change applies to the next stroke; the
  star draws and a sub-4pt shape tap commits nothing; the canvas reads "Drawing,
  3 marks"; drawing over `Sketch.Canvas` children and `toSVG` work.
- **Not yet checked:** a Release build (the worklet-capture risk is
  Release-specific), 200-stroke performance, the theme toggle, VoiceOver's
  undo/clear actions, and Android.
- **Previews (2026-10-06, dev client, iPhone 17 Pro, recaptured on Skia):**
  `default` is the hero clip, `shapes`, `eraser` and `annotate` are clips, `colours` is a still. The flows in
  `.argent/flows/previews/sketch/` draw pen strokes with raw `gesture-custom`
  points (a `swipe` is one straight line) and undo back to the seed, so every
  clip loops. **Every flow waits ~400ms after a tool or swatch tap before
  drawing** — see "The setters write the brush as they run" for the press
  dispatch that is still slower than argent.

## Out of scope

`Sketch.Sheet` and any native sheet; exporting what is under the marks; a custom colour picker (`Sketch.Swatches` takes trailing
children for one); selecting, moving or restyling marks; text; layers; redo;
zoom; pressure; multi-touch; persistence; Signature itself.

## Signature (Forms)

`sketch.paths.ts` is a leaf so Forms' Signature can import it directly (rule 3's
leaf exception) rather than fork the smoother. It must keep importing nothing —
not React Native, not Reanimated, not a sibling. If Signature lands first with
its own smoother, reconcile by moving the better one into this leaf.
