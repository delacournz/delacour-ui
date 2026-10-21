import {
	ImageFormat,
	PaintStyle,
	type SkCanvas,
	Skia,
	type SkPath,
	type SkPicture,
	StrokeCap,
	StrokeJoin,
} from "react-native-skia";
import { resolveSignatureExport, signaturePngSize, traceStroke } from "./signature.stroke";
import type { SignaturePngOptions, SignatureStroke, SignatureValue } from "./signature.types";

/**
 * Every stroke's traced path, keyed by the stroke itself.
 *
 * Strokes are immutable — the history only ever appends, pops or replaces the
 * array — so a stroke traced once never needs tracing again, and a commit costs
 * one new path rather than a pass over the whole signature. A `WeakMap` lets a
 * stroke undone and dropped take its path with it.
 */
const PATH_CACHE = new WeakMap<SignatureStroke, SkPath>();

/** One stroke as a Skia path, traced by the same {@link traceStroke} the live stroke is. */
export function signatureStrokePath(stroke: SignatureStroke): SkPath {
	const cached = PATH_CACHE.get(stroke);
	if (cached !== undefined) return cached;
	const builder = Skia.PathBuilder.Make();
	traceStroke(stroke, builder);
	const path = builder.detach();
	PATH_CACHE.set(stroke, path);
	return path;
}

/** What {@link recordSignaturePicture} draws with. `color` is already resolved, or `undefined`. */
type SignatureInkStyle = { color: string | undefined; strokeWidth: number };

/**
 * The finished strokes, recorded once per change of the strokes or the ink.
 *
 * A picture replays as one draw call, so the canvas holds one node however many
 * strokes there are. Each stroke is its own `drawPath`, as each was its own SVG
 * path before, so a translucent ink still darkens where two strokes cross. An ink
 * that did not resolve draws nothing, as an SVG `stroke={undefined}` did.
 */
export function recordSignaturePicture(strokes: readonly SignatureStroke[], ink: SignatureInkStyle): SkPicture {
	const recorder = Skia.PictureRecorder();
	drawSignatureStrokes(recorder.beginRecording(), strokes, ink);
	return recorder.finishRecordingAsPicture();
}

/** Each stroke as its own `drawPath`, with a round-capped pen. Nothing when the ink did not resolve. */
function drawSignatureStrokes(canvas: SkCanvas, strokes: readonly SignatureStroke[], ink: SignatureInkStyle): void {
	if (ink.color === undefined) return;
	const paint = Skia.Paint();
	paint.setAntiAlias(true);
	paint.setStyle(PaintStyle.Stroke);
	paint.setStrokeCap(StrokeCap.Round);
	paint.setStrokeJoin(StrokeJoin.Round);
	paint.setStrokeWidth(ink.strokeWidth);
	paint.setColor(Skia.Color(ink.color));
	for (const stroke of strokes) canvas.drawPath(signatureStrokePath(stroke), paint);
}

/**
 * The signature as a base64 PNG, rendered off screen on a CPU surface.
 *
 * Framed and coloured by {@link resolveSignatureExport}, the function `toSVG`
 * uses, so the PNG is the SVG rasterised: the same box, the same literal ink,
 * the same background or none. Off screen rather than a snapshot of the pad, so
 * the guideline, the placeholder and the pad's own fill never reach the file.
 * The strokes are the cached paths the pad draws. Returns `""` when the frame
 * has no pixels — an unmeasured pad.
 */
export function renderSignaturePng(value: SignatureValue, options: SignaturePngOptions & { scale: number }): string {
	const { background, box, strokeColor, strokeWidth } = resolveSignatureExport(value, options);
	const size = signaturePngSize(box, options.scale);
	if (size === null) return "";

	const surface = Skia.Surface.Make(size.width, size.height);
	if (surface === null) return "";
	const canvas = surface.getCanvas();
	canvas.scale(size.width / box.width, size.height / box.height);
	canvas.translate(-box.x, -box.y);
	if (background !== null) canvas.drawColor(Skia.Color(background));
	drawSignatureStrokes(canvas, value.strokes, { color: strokeColor, strokeWidth });
	surface.flush();
	return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG);
}
