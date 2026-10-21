# Signature

A pad to sign with a finger or a stylus. Compound root plus `Signature.Pad`,
`Signature.Toolbar`, `Signature.Undo`, `Signature.Redo`, `Signature.Clear` and
`Signature.Alternative`. Hands back the strokes as JSON, as SVG path data, as a
standalone SVG document, or as a PNG.

`import { Signature } from "@delacour/react-native-ui/signature";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/signature` |
| `signature.tsx` | Root: the history, the controlled-value sync, the imperative handle, the announcements, and the `Object.assign` surface |
| `signature-pad.tsx` | `Signature.Pad` — the pan, the live stroke, the guideline, the placeholder and the accessibility surface |
| `signature-ink.tsx` | The one Skia canvas: the finished strokes' picture, the live stroke traced on the UI thread, and the clear's fade. Internal |
| `signature.skia.ts` | Skia only: a stroke's cached `SkPath`, the recorded picture of the finished strokes, and the off-screen PNG render |
| `signature-toolbar.tsx` | `Signature.Toolbar` |
| `signature-action-button.tsx` | The shared body of the three action buttons. Internal |
| `signature-undo.tsx` | `Signature.Undo` |
| `signature-redo.tsx` | `Signature.Redo` |
| `signature-clear.tsx` | `Signature.Clear` |
| `signature-alternative.tsx` | `Signature.Alternative` — the typed-name link |
| `signature.context.tsx` | `SignatureContext`, `useSignature()`, `useSignatureContext()`, `useSignaturePart()` |
| `signature.types.ts` | `SignaturePoint`, `SignatureStroke`, `SignatureValue`, `SignatureHandle`, `SignatureExportOptions`, `SignaturePngOptions` |
| `signature.stroke.ts` | Pure, no RN: point filter, smoother and path tracer (worklets), history reducer, bounds, re-fit, the export frame and PNG size, SVG export, JSON round trip |
| `signature.stroke.test.ts` | |
| `signature.variants.ts` | Pure `tv()` slots, the size tables, the axis ladder and the accessibility resolvers |
| `signature.variants.test.ts` | |

## Design

- **Sizes**: `sm`, `md`, `lg` are fixed pad heights of 120, 180 and 240 points
  (`h-30` / `h-45` / `h-60`), and `full` fills its parent with `md` as a floor.
  The width is always the parent's. **Variants**: `primary` is a filled pad
  (`bg-muted`, `border-input`), `secondary` an outlined one (`border-border`).
  The heights are Tailwind's spacing scale rather than a `--spacing-signature-*`
  token, because nothing else shares them and nobody has asked to retune them; a
  test pins the classes to the numbers so the decision is visible if that
  changes.
- **Drawing is on the UI thread, and React sees a stroke once.** The pan writes
  points into a shared value and a derived value traces them into a Skia path,
  so a moving finger renders nothing. On finger-up the stroke crosses to the JS
  thread with `scheduleOnRN` and joins the finished strokes' picture: one render
  per stroke, none per move. A signature is a few dozen strokes of a few hundred
  points; a render per move would be thousands.
- **One Skia canvas holds all the ink, and no path is a string on screen.** The
  finished strokes are one recorded `SkPicture` — one draw call however many
  strokes — and each stroke's `SkPath` is cached against the immutable stroke,
  so a commit traces one path, not the signature. The live stroke is traced
  straight into a `PathBuilder` each frame: the SVG version wrote a `d` string
  and had it parsed back on every move. Each stroke is still its own `drawPath`,
  so a translucent ink darkens where two strokes cross exactly as separate SVG
  paths did.
- **The live and the finished stroke are traced by the same function.**
  `traceStroke` is a worklet, so the UI thread and the committed picture build
  the identical path and a stroke does not shift by a hair when it is handed
  over. Points are midpoint-quadratic smoothed — each sampled point is a control
  and each midpoint an end — which passes near every point without overshooting
  any, the failure a Catmull-Rom spline has on a sharp turn. `smoothStroke`
  writes that curve as path data for the exports, verb for verb the same.<!-- registry:omit -->
  `signature.stroke.test.ts` holds the two to identical output.<!-- /registry:omit -->
- **The live stroke is cleared after its committed copy renders, and only if it
  is still that stroke.** Cleared at finger-up, the ink blinks out for a frame;
  cleared unconditionally, a fast second stroke — the dot on an i — loses its
  first point to the commit of the one before. The pad keys each stroke with an
  id on the UI thread and the clear compares it there, so nothing reads a shared
  value from the JS thread (the bug that kept `Accordion` shut in Release builds).
- **A tap is a dot.** `minDistance(0)` and the stroke starting in `onBegin` mean a
  touch that never moves still commits a one-point stroke, which `smoothStroke`
  writes as a zero-length segment and the round cap draws as a dot. Without it,
  the dot on an i and the full stop after an initial silently vanish.
- **The pad wins the touch from an enclosing scroll view at once**, as `Slider`
  and `Rating` do. A pad that waited for movement would hand the first downstroke
  of every letter to the scroll. The cost is that a scroll cannot start on the
  pad; docs say so.
- **The history is a pure reducer, and a no-op returns the same reference.** That
  is what lets the root skip both the render and `onValueChange` for an undo with
  nothing to undo, and what makes undo, redo and the redo-dropped-by-a-new-stroke
  rule unit-testable.
- **Clear is final.** It empties the redo stack too and is not undoable. A clear
  that undo could reverse is a clear that needs explaining, and the button is
  labelled "Clear signature" because that label is the only warning there is.
  The ink fades out over 150 ms: a clear counter bumps, the canvas keeps the
  picture from before it as a ghost inside a layer whose paint's alpha runs to
  zero, then drops it — instant under `useCalmMotion()`. A layer and not a group
  opacity, because a picture replays with its own paints and ignores one. The
  ghost is picked during the render the clear lands in, not in an effect after
  it: from an effect it reaches the canvas a commit late, so the ink blinked out
  and then popped back at full strength before fading.
- **`value` re-seeds; it does not gate.** The pad reports a value at each stroke
  end and remembers it, so a parent echoing it back is a no-op and a parent
  passing anything else replaces the drawing and its history. A parent cannot
  veto a stroke the way it can veto a slider position — a stroke is not a value
  on a scale that can be snapped back to, and undoing ink the user just saw
  appear would read as a bug.
- **Strokes are stored in pad coordinates, with the pad's size beside them.**
  A pad measured at another size — a rotation, a `full` pad — re-fits the
  strokes and the redo stack with `scaleValue`, uniformly and centred, rather
  than drawing them off the edge or stretching them. A re-fit does not fire
  `onValueChange`: it is the same signature.
- **Colours are literal in an export.** `toSVG()` has no theme to resolve
  `foreground` against, so a token name falls back to `#000000` ink and no
  background. Black rather than the pad's colour: dark mode's near-white ink
  would export an invisible signature. Every attribute is escaped.
- **The toolbar disables what would do nothing**, and an explicit `isDisabled`
  still wins. It renders nothing while read-only — an undo button beside a
  signature on a receipt, even a disabled one, says it could be changed.
- **`Signature.Alternative` is the accessibility answer, not the label.** A pad
  is a path a finger has to trace; no `accessibilityLabel` makes that possible for
  someone who cannot. So the pad describes itself honestly ("Signature pad,
  empty" / "Signature, drawn, 3 strokes"), offers undo, redo and clear as custom
  actions only while they would do something, announces "Signature captured" and
  "Signature cleared" — and the alternative link hands off to a typed-name flow
  the caller owns. It renders only when `onRequestAlternative` is passed, and it
  stays enabled while the pad is disabled.
- **`Field` reaches the state axes and the name, not the press.** `isInvalid` and
  `isDisabled` cascade and an explicit prop wins; `Field.Label`'s text names the
  pad. The pad registers no press: a tap on the label cannot sign for anyone, and
  focusing a pad means nothing to a touch screen.
- **Haptics**: the `haptic` preset (default `light`) as each stroke begins,
  nothing while drawing — a buzz per point would be a motor running — and a
  selection tick on clear. `haptic={false}` silences both.
- **`toPNG()` is `toSVG()` rasterised.** Both resolve their options through one
  `resolveSignatureExport`, so the same options give the same box, the same
  literal ink and the same background or none — a PNG is transparent unless
  `background` is set. It renders the cached stroke paths off screen on a CPU
  surface at `scale` pixels per point (default the screen's ratio) and returns
  base64 with no `data:` prefix, as `Sketch.toPNG` does. Off screen rather than a
  snapshot of the pad, so the guideline, the placeholder and the pad's fill never
  reach the file. `""` before the pad is measured. The point's `t` is stored so
  a speed-eased stroke width can follow without a format change.
