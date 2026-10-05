# Sketch

A freehand drawing surface with its tools around it: a pen, eight shapes, an eraser, a stroke-width slider, colour swatches and undo — delivered as an SVG string. Drawn with `react-native-svg`, driven by one Gesture Handler pan on the UI thread.

Plan ID: LAYOUT-11
Folder: `packages/react-native-ui/src/components/sketch`
Import: `@delacour/react-native-ui/sketch`

Note for the plan lead: this is a **drawing canvas**, not a "sketchy" rendering style.

## Purpose on mobile

Mark up a photo, doodle a note, annotate a receipt, draw a diagram into a message. A finger is the pen, so the surface is large, the tools are thumb-reachable at the bottom, and the result is a portable vector (SVG string) rather than a bitmap.

Deliberately not:

- **A signature pad.** Signature (Forms) is one ink colour, one width, no tools, clear-and-confirm. It overlaps in *maths* only (smoothing a touch path into SVG path data) — that maths lives here as a leaf module Signature may import later. See Cross-category dependencies.
- **A paint program.** No layers, selection, move/resize of drawn shapes, fills, text, zoom/pan of the canvas, pressure/tilt.
- **A raster exporter.** `toSVG()` only. PNG needs `react-native-view-shot` (a native module and a new peer); out of scope, with the hook left open.
- **A modal.** The component is the surface plus toolbar. Presenting it full-screen, or in a `BottomSheet`, is the caller's composition (a demo shows both). No `Sketch.Sheet` in v1.

## API

```ts
export const SKETCH_TOOLS = ["pen", "shape", "eraser"] as const;
export const SKETCH_SHAPES = [
	"rectangle", "ellipse", "triangle", "diamond", "line", "arrow", "star", "heart",
] as const;

export type SketchTool = (typeof SKETCH_TOOLS)[number];
export type SketchShape = (typeof SKETCH_SHAPES)[number];

export type SketchPoint = { x: number; y: number };

/**
 * One committed mark. Geometry is stored as SVG path data, not as points: the live stroke is
 * built as a string on the UI thread, and a string is what `toSVG` needs. Colour is a resolved
 * literal, so the export is theme-independent.
 */
export type SketchItem =
	| { id: string; kind: "stroke"; d: string; color: string; width: number }
	| { id: string; kind: "shape"; shape: SketchShape; d: string; color: string; width: number }
	| { id: string; kind: "erase"; d: string; width: number };

export type SketchHandle = {
	undo: () => void;
	clear: () => void;
	isEmpty: () => boolean;
	/** Self-contained SVG: viewBox is the canvas, optional background rect, masks inlined. */
	toSVG: (options?: SketchExportOptions) => string;
};

export type SketchExportOptions = {
	/** A literal or theme token painted behind everything. Default: the theme's `background`. `null` leaves it transparent. */
	background?: string | null;
};

export type SketchProps = Omit<ViewProps, "children"> & {
	/** Controlled marks. Pass `onChange` with it. */
	items?: readonly SketchItem[];
	defaultItems?: readonly SketchItem[];
	onChange?: (items: readonly SketchItem[]) => void;

	tool?: SketchTool;
	defaultTool?: SketchTool; // "pen"
	onToolChange?: (tool: SketchTool) => void;

	shape?: SketchShape;
	defaultShape?: SketchShape; // "rectangle"
	/** Which shapes the toolbar offers, in order. Default: all eight. */
	shapes?: readonly SketchShape[];
	onShapeChange?: (shape: SketchShape) => void;

	/** Theme tokens (`"foreground"`, `"primary"`) or literals (`"#ec4899"`). Default: foreground, destructive, warning, success, info, primary. */
	colors?: readonly string[];
	color?: string;
	defaultColor?: string; // colors[0]
	onColorChange?: (color: string) => void;

	/** Stroke width in points. */
	size?: number;
	defaultSize?: number; // 4
	minSize?: number;     // 1
	maxSize?: number;     // 24
	onSizeChange?: (size: number) => void;

	isDisabled?: boolean; // blocks drawing, tools and undo; canvas keeps showing the marks
	/** Played on tool/colour change and each undo. `false` silences it. Default "selection". */
	haptic?: false | HapticFeedback;
	/** Imperative handle (React 19 ref-as-prop). */
	ref?: Ref<SketchHandle>;
	children?: ReactNode;
};

type SketchCanvasProps = Omit<ViewProps, "children"> & {
	/** Painted behind the marks, on screen only (export has its own `background`). Default `bg-card`. */
	children?: ReactNode; // overlay, e.g. a photo being annotated, drawn UNDER the marks
};

type SketchToolbarProps = Omit<ViewProps, "children"> & {
	/** Default: pen, shape picker, eraser | swatches | size | undo. Pass children to compose your own. */
	children?: ReactNode;
};

type SketchToolProps = Omit<ToggleButtonProps, "value" | "isSelected" | "onSelected" | "children"> &
	(
		| { tool: "pen" | "eraser"; shape?: never }
		| { tool: "shape"; shape: SketchShape }
	) & { children?: ReactNode }; // default glyph per tool/shape

type SketchSwatchesProps = Omit<ViewProps, "children">;
type SketchSizeProps = Omit<SliderProps, "value" | "defaultValue" | "onChange" | "minValue" | "maxValue" | "children">;
type SketchUndoProps = Omit<ButtonProps, "onPress" | "isDisabled" | "children"> & { children?: ReactNode };

export const Sketch = Object.assign(SketchRoot, {
	Canvas: SketchCanvas,
	Toolbar: SketchToolbar,
	Tool: SketchTool,
	Swatches: SketchSwatches,
	Size: SketchSize,
	Undo: SketchUndo,
	displayName: "DelacourUI.Sketch",
});

export function useSketch(): SketchContextValue; // state + setters + handle
```

`SketchRoot` renders no UI of its own beyond a flex column wrapper: canvas `flex-1`, toolbar below. Default composition when no children are given is the full toolset above, so `<Sketch />` just works.

```tsx
const ref = useRef<SketchHandle>(null);

<Sketch ref={ref} className="flex-1" defaultColor="primary" onChange={(items) => setCount(items.length)} />

<Button onPress={() => save(ref.current?.toSVG({ background: null }) ?? "")}>Done</Button>
```

Custom layout:

```tsx
<Sketch className="flex-1">
  <Sketch.Canvas><Image source={photo} className="absolute inset-0" resizeMode="contain" /></Sketch.Canvas>
  <Sketch.Toolbar>
    <Sketch.Tool tool="pen" />
    <Sketch.Tool tool="shape" shape="arrow" />
    <Sketch.Tool tool="eraser" />
    <Sketch.Swatches />
    <Sketch.Undo />
  </Sketch.Toolbar>
</Sketch>
```

## Variants & sizes

One slotted `tv()` in `sketch.variants.ts`: slots `root`, `canvas`, `toolbar`, `toolbarRow`, `swatch`, `swatchRing`, `swatchDot`, `divider`. No `variant` axis in v1; the single axis is `swatch` `isSelected` (ring on/off). Tool buttons are `ToggleButton` with `variant="ghost"` (`default` when pressed) at `size="icon-md"` — a 44pt hit area, `h-button-md`. Swatch hit area is `size-button-sm` with the dot `size-icon-md` inside, so a 28pt dot still has a 36pt target; the ring keeps layout (always-reserved border, transparent when unselected, like Surface's hairline rule).

Tokens (semantic only, none new): canvas `bg-card` + `border-border` + `rounded-lg border-continuous overflow-hidden`; toolbar `bg-card`/`border-t border-border`, `px-screen-gutter`; selected swatch ring `border-ring`; divider `bg-border`. Colour *values* (the ink) go through `useThemeColor` for tokens and pass literals through — `resolveSketchColor`. No `dark:`, no shadow.

Ink is content, not chrome: a stored item holds the literal it resolved to at draw time, so toggling the theme does not recolour an existing drawing. The default `foreground` swatch is therefore near-black in light and near-white in dark at the time it was drawn; the export's default `background` is resolved at export time, so the SVG remains legible either way. Documented in AGENTS.md.

## States

- **Controlled / uncontrolled** via `useControllableState` for each of `items`, `tool`, `shape`, `color`, `size` (five hooks, one per axis). `items` controlled needs `onChange` or it silently never changes — same warning as other controlled props.
- **Disabled**: pan is `enabled(false)`, toolbar buttons `isDisabled`, canvas drawn at full opacity (marks stay readable), toolbar at 50%.
- **Empty**: Undo disabled when no items; `isEmpty()` true. `Canvas` can host an empty hint as a child, caller-supplied.
- **Loading**: n/a. Canvas size is measured via `onLayout`; until measured (0×0) the pan is disabled and `toSVG` returns an empty svg with `viewBox="0 0 0 0"`.
- **Min drag**: a shape drag under 4pt on both axes commits nothing (a tap with a shape tool is not a shape). A pen tap commits a dot.
- **Tool lock while drawing**: tool/colour/size read at gesture begin and snapshotted into the gesture, so a mid-stroke change cannot split a stroke.

## Accessibility

Drawing is inherently a pointer task; the goal is *operable and honest*, not equivalent.

- Canvas: `accessible`, `accessibilityRole="image"`, label from `resolveSketchAccessibilityLabel(items)` — `"Drawing, empty"` / `"Drawing, 3 marks"`. No attempt to describe content. Stroke geometry is not exposed.
- Canvas `accessibilityActions`: `undo` and `clear` (`onAccessibilityAction`), so a screen-reader user can at least reverse and reset. Touch exploration drawing is not supported; documented limitation, and the caller should offer an alternative input path for accessibility-critical flows.
- Toolbar buttons: ToggleButton already announces selected state; labels `"Pen"`, `"Eraser"`, `"Rectangle"` … from a `Record<SketchTool|SketchShape, string>` (exhaustive, so a shape added to the tuple fails typecheck until labelled).
- Swatch: `accessibilityRole="radio"` in an `accessibilityRole="radiogroup"` container? RN has `radiogroup`; each swatch labelled by the colour's name when it is a token (`"Primary"`) or `"Colour 3 of 6"` for a literal (`resolveSwatchLabel`). Selected state in `accessibilityState.selected`.
- Size slider is `Slider` — already adjustable (increment/decrement actions); label `"Stroke width"`.
- Undo: `accessibilityLabel="Undo"`, disabled state announced.
- Announce after commit: `AccessibilityInfo.announceForAccessibility("Undone")` on undo only; no announcement per stroke (noisy).
- **Reduce motion**: nothing animates decoratively. The only motion is the stroke following the finger, which *is* the behaviour, so it is not calmed.
- Hit targets ≥ 44pt for tools and undo; swatch 36pt with spacing — flag in AGENTS.md as the one sub-44 target and why (six swatches must fit a 360pt row).

## Motion

The component is one gesture, so the work is keeping it on the UI thread.

- **Pan**: `Gesture.Pan().minDistance(0).maxPointers(1)`. `onBegin` starts the stroke (so a stationary tap draws a dot — the Slider's rule: a pan only *activates* on movement, so the dot must be started in `onBegin` and committed in `onFinalize`), `onUpdate` appends, `onFinalize` commits via `scheduleOnRN` from `react-native-worklets`.
- **Live stroke**: one `Animated(Path)` (created with `Animated.createAnimatedComponent(Path)` at module scope, once) whose `d` is an `animatedProps` of a `activeD` shared value. Pen/eraser append a quadratic midpoint segment as a string (`appendSketchSegment`, O(1) per sample — no array copy, no O(n²)); shape recomputes its single path every update from `from`/`to`. Nothing on the JS thread runs during a stroke.
- **Commit**: `onFinalize` sends `{ d, color, width, kind, shape }` to JS; JS mints the id, appends to state and calls `onChange`. The live path is cleared in the same worklet so there is no frame of doubled ink.
- **Committed marks** render grouped (below) and each group is `memo`'d by item identity, so a new stroke re-renders one group, not the drawing.
- **Worklet hygiene** (Screen AGENTS gotcha): a module-scope `"worklet"` helper can fail to capture and crash the UI thread with `undefined is not a function`. `appendSketchSegment` and `buildSketchShapePath` are marked `"worklet"` *and* unit-tested as plain functions; the first simulator step is to draw a stroke on a Release build. Fallback if capture fails: inline the append in the pan callback and keep the tested function as the reference implementation. Reanimated 4 / worklets 0.10 per the catalog.
- **Eraser** is a mask, not geometry deletion: it removes only ink *under the finger* and leaves later strokes over that spot untouched. Render model in `groupSketchItems`: items are split at every `erase`; each group of draw marks is wrapped in `<G mask>` whose `<Mask>` is a white rect minus black strokes of the erasers that come **after** that group. While erasing, the live eraser path is also in an always-mounted top-level mask over the committed groups (empty `d` when the tool is not eraser).
- **Risk**: react-native-svg `Mask` cost scales with mask count. Mitigation: consecutive erasers merge into one mask; `maxItems` is not capped in v1 but a note in AGENTS.md says when to flatten (a future `Sketch.flatten`). Verify on the simulator with ~200 strokes + 20 erases.
- No calm-motion fallback needed (see Accessibility); `useCalmMotion` is not read.

## Reuses

`ToggleButton` (+ group semantics by hand — a Sketch tool group is one-of-N across *two* props, so it does not use `ToggleButton.Group`), `Button` (Undo), `Slider` (size; `onChange` live, `onChangeEnd` for `onSizeChange` once if wanted), `Icon`, `Pressable` (swatches), `Separator`/divider hairline, `useControllableState`, `useThemeColor`, `playHaptic`/`HapticFeedback` from `pressable.tsx` (the library's only haptic vocabulary, importable across folders by the slider's precedent), `react-native-svg` (`Svg`, `Path`, `G`, `Mask`, `Rect` — already a peer), Gesture Handler, Reanimated, `react-native-worklets`.

Not reused: `@delacour/react-native-charts` / Skia. Charts uses Skia for retained, animated geometry from d3 and is a published optional peer; Sketch needs only path strings, which SVG draws and which are already the export format. Peering Skia (in the catalog, so *allowed*) would mean a native 6 MB+ view for every consumer of the folder and a second drawing model whose output is not SVG. Revisit only if profiling shows `Mask` cost is the limit; the Skia alternative would be an optional peer, with the tested maths unchanged (it is path-string based already).

## New peer deps

**None.** `react-native-svg` is already declared and classified `expo` in `PACKAGE_INSTALL`; Gesture Handler, Reanimated, Worklets and Pulsar likewise. `ITEM_META.sketch` needs no `dependencies` override because every import is visible to the scan — confirm by running the registry builder; if the builder cannot see a transitive peer (as with `bottom-sheet`), name it there.

Alternatives considered: Skia (rejected above); `react-native-view-shot` for PNG (rejected: new native peer, out of scope); `@expo/ui` native sheet (rejected: Expo import would force `src/expo/` placement and an optional peer for no gain).

## Cross-category dependencies

- **Forms / Signature**: Signature is the same stroke pipeline with fixed ink. To avoid two copies, the path maths is a **leaf** (`sketch.paths.ts`, imports nothing but TypeScript) that Signature may import directly, per rule 3's leaf exception. Sketch does not wait for Signature and does not import from it; if Signature lands first with its own smoother, reconcile by moving the better one into the leaf in a follow-up. Message the Forms plan owner so the two do not diverge.
- **Forms / ColorPicker** (if planned): the reference offers a custom-colour button. Out of scope here; instead `colors` is open-ended and `Sketch.Swatches` accepts a trailing `children` slot for a caller-supplied picker trigger. Do not import Forms.
- **Overlays**: none required. `BottomSheet` already exists on this branch, so a demo may mount Sketch in one — but a sheet's own content pan will fight the canvas; the demo must use the engine's gesture opt-out (verify the exact prop in `bottom-sheet/AGENTS.md` "an input's drag captured by the sheet") or present full-screen instead. If neither works, drop that demo rather than add a `Sketch.Sheet`.
- **Media**: none. `Sketch.Canvas` children can host an `Image`; no gallery/camera.
- **Navigation / Layout siblings**: none.

## Pure logic to unit-test

`sketch.paths.ts` (leaf, no RN) and `sketch.variants.ts`. Tests first.

| Function | Input → expected |
| --- | --- |
| `formatSketchNumber(n)` | `1`→`"1"`; `1.005`→`"1.01"` or `"1"` per chosen rounding (pin it: 2 dp, trailing zeros trimmed); `-0`→`"0"`; `NaN`→`"0"` |
| `startSketchPath(p)` | `{x:10,y:20}` → `{ d: "M10 20", last: p, mid: p, count: 1 }` |
| `appendSketchSegment(state, p)` | after start `(0,0)`, append `(10,0)` → `d: "M0 0 Q0 0 5 0"`, `mid:(5,0)`; append `(10,10)` → `… Q10 0 10 5`; a point `< 0.5pt` from `last` is dropped (`count` unchanged) |
| `finishSketchPath(state)` | `count` 1 → `"M10 20 L10.01 20"` (round-capped dot); `count` ≥ 2 → `d` plus closing `L last.x last.y` |
| `buildSketchShapePath(shape, from, to)` | rectangle `(0,0)→(10,20)` → `"M0 0H10V20H0Z"`; reversed drag `(10,20)→(0,0)` gives the same string (normalised bounds); ellipse `(0,0)→(10,20)` → two arcs `rx=5 ry=10` closed; triangle apex top-centre; diamond four mid-edge points; line `(0,0)→(10,0)` → `"M0 0L10 0"`; arrow = line + two barbs at ±25° of length `clamp(width*4, 8, 0.4*len)`; star 5 points alternating radii 1 : 0.5 inside bounds; heart within bounds; any shape under 4pt on both axes → `null` |
| `resolveSketchColor(color, tokens)` | `"#ec4899"` → same; `"primary"` → the token's resolved literal; unknown token → `undefined` (caller skips swatch, never draws `undefined` ink) |
| `isSafeSketchColor(s)` | `#fff`, `#ffffff`, `#ffffffff`, `rgb(0 0 0 / 50%)`, `oklch(0.2 0 0)` → true; `red;"onload="`, `url(#x)`, `"><script>` → false (guards `toSVG` injection) |
| `groupSketchItems(items)` | `[a, b, erase1, c, erase2]` → `[{ marks:[a,b], erasers:[erase1, erase2] }, { marks:[c], erasers:[erase2] }]`; no erasers → one group with `erasers:[]`; leading eraser with no marks before it → no empty group; two adjacent erasers merge into the later group's list once |
| `sketchItemsToSvg(items, { width, height, background })` | `[]` → `<svg xmlns="http://www.w3.org/2000/svg" width="W" height="H" viewBox="0 0 W H"></svg>` (with a background rect when given); one stroke → `<path d=".." fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`; erasers produce `<mask id="m0">` with a white rect and black strokes, referenced by `mask="url(#m0)"`; ids deterministic (`m0`, `m1`…); unsafe colour item is skipped, not emitted; shape fill is always `none`; output is stable across calls |
| `undoSketchItems(items)` | removes the last item (an eraser counts as an item and is undone as one); `[]` → `[]` same reference |
| `clampSketchSize(n, min, max)` | `(0,1,24)`→`1`; `(99,1,24)`→`24`; `(NaN,1,24)`→`4`; `min > max` swapped |
| `resolveSketchAccessibilityLabel(items)` | `[]`→`"Drawing, empty"`; 1 → `"Drawing, 1 mark"`; 3 → `"Drawing, 3 marks"` (erasers count as marks) |
| `resolveSwatchLabel(color, index, total)` | `("primary",0,6)`→`"Primary"`; `("#ec4899",2,6)`→`"Colour 3 of 6"` |
| `sketchVariants()` slots | canvas has `overflow-hidden`, `rounded-lg`, `border-continuous`; no slot has `shadow-*`, `dark:` or `self-*`; selected swatch ring `border-ring`, unselected reserves the same border (transparent); no raw palette colours; every token exists in both `theme.css` variants |

## File map

```
packages/react-native-ui/src/components/sketch/
  AGENTS.md
  index.ts
  sketch.tsx                  Object.assign surface + root + handle
  sketch-canvas.tsx           Svg, committed groups, live paths, the pan
  sketch-groups.tsx           memo'd committed-group renderer (internal)
  sketch-toolbar.tsx
  sketch-tool.tsx
  sketch-swatches.tsx
  sketch-size.tsx
  sketch-undo.tsx
  sketch.context.tsx          SketchProvider, useSketch(), useSketchContext(), useSketchPart()
  sketch.types.ts             SketchItem, SketchHandle, shared slot prop types
  sketch.variants.ts          tv(), SKETCH_* constants, label records
  sketch.variants.test.ts
  sketch.paths.ts             LEAF: path/shape/mask/SVG maths, no RN imports
  sketch.paths.test.ts
```

Also: row in the Components table of `packages/react-native-ui/AGENTS.md`, `bun run gen-exports`. DisplayNames: `DelacourUI.Sketch`, `.Sketch.Canvas`, `.Toolbar`, `.Tool`, `.Swatches`, `.Size`, `.Undo`, plus every internal leaf (`DelacourUI.Sketch.Groups`, `DelacourUI.Sketch.Provider`).

## Playground demo

`apps/playground/src/demos/sketch/` + route `apps/playground/src/app/(components)/sketch.tsx` + home row. Demos need `testID` on canvas, each tool, swatches, undo; interaction in a flow, since a drawing demo that nobody draws on captures an empty box. Use `capture.flow` for the animated ones and `frame: "device"` for full-screen. Coordinates only (`gesture pan x y dx dy ms`) — the canvas has no AX nodes; decompose one stroke per command.

| File | Shows | Capture |
| --- | --- | --- |
| `default.tsx` | Full toolset, seeded `defaultItems` (a small drawing) so a still is not blank | capture, **hero**, `frame: "device"` |
| `draw.tsx` | Pen stroke drawn live | capture, `flow` |
| `shapes.tsx` | Shape picker; drawing an arrow and a star | capture, `flow` |
| `eraser.tsx` | Erase through seeded strokes; later strokes remain | capture, `flow` |
| `colours.tsx` | Custom `colors`, token vs literal | capture |
| `annotate.tsx` | `Sketch.Canvas` over a photo, custom toolbar, export button showing the SVG length | gallery only |

## Docs page

`apps/web/content/docs/native/components/sketch.mdx`: hero preview; Installation (`<ComponentInstall name="sketch" />`, noting no extra peers); Usage; Tools and shapes; Colours (tokens vs literals; ink does not follow the theme); Stroke width; Eraser (mask semantics); Undo and the handle; Exporting SVG (`toSVG`, `background`, save/share is the app's job; PNG left to the app); Composing your own toolbar; Annotating an image; Accessibility limits (honest section); API tables for every part and `SketchItem`. Add to `meta.json`.

Registry: `ITEM_META.sketch = { title: "Sketch", description: "A finger-drawing surface with a pen, eight shapes, an eraser, colours, stroke width and undo, exported as SVG.", categories: ["forms"] }` — category is the lead's call (it is closer to media/input than layout; keep consistent with where Signature lands). `PACKAGE_INSTALL`: no change.

## Changeset

`@delacour/react-native-ui` **minor** — "Add Sketch: a drawing surface with pen, shapes, eraser, colours, size and undo, exported as SVG."

## Out of scope

- `Sketch.Sheet`, native sheet presentation, any `@expo/ui` use.
- PNG export / `react-native-view-shot`.
- Custom-colour picker UI.
- Selecting, moving, resizing, restyling or filling drawn shapes; text; layers; redo; canvas zoom/pan; pressure/tilt; multi-touch.
- Persistence (the caller stores `items` or the SVG).
- Skia rendering (revisit on profiling data).
- Signature itself (Forms), beyond leaving the leaf importable.

## Acceptance checklist

- [ ] `sketch.paths.test.ts` and `sketch.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/sketch`)
- [ ] `sketch.paths.ts` imports nothing from React, RN, Reanimated or SVG (purity checked like charts' `core/` rule; add a text-level assertion)
- [ ] `bun run typecheck` and `bun run check` clean; no `any`; discriminated unions for `SketchItem` and `SketchToolProps`; no comments inside JSX
- [ ] Every component incl. provider and internal leaves has a `DelacourUI.Sketch…` displayName (`display-name.test.ts`)
- [ ] `sketch/AGENTS.md` written (mask-not-delete eraser, strings-not-points, why SVG not Skia, why no Sheet, the Signature leaf); Components table row; `docs.test.ts` passes
- [ ] `bun run gen-exports` and `bun run gen-demos` run; `demos.test.ts` passes; 4-6 capture, one hero
- [ ] Docs page, `meta.json`, `ITEM_META.sketch`, registry builder passes with no unclassified import
- [ ] Changeset added
- [ ] Simulator (agent-device; `warden claim ios --json`, `--platform ios --udid <id> --session sketch`): Release build draws a stroke without a worklet crash; a stationary tap leaves a dot; pen stays smooth at speed (no JS-thread frame drops with 200 strokes); each shape draws and a sub-4pt drag commits nothing; eraser removes only what it crosses and a stroke drawn afterwards over the erased spot is intact; undo reverses an erase; swatch/size changes apply to the next stroke only; `toSVG()` pasted into a browser matches the screen; light/dark toggle leaves existing ink unchanged; VoiceOver reads `"Drawing, 3 marks"` and the undo/clear actions work; disabled blocks drawing
- [ ] Android emulator check for `Mask` rendering (known weaker platform for SVG masks); if broken, record in AGENTS.md and gate the eraser accordingly
- [ ] `agent-device close` and `warden release` on completion
