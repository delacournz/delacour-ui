import { PaintStyle, Skia, type SkPath, type SkPicture, StrokeCap, StrokeJoin } from "react-native-skia";
import { traceStroke } from "./signature.stroke";
import type { SignatureStroke } from "./signature.types";

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
	const canvas = recorder.beginRecording();
	if (ink.color !== undefined) {
		const paint = Skia.Paint();
		paint.setAntiAlias(true);
		paint.setStyle(PaintStyle.Stroke);
		paint.setStrokeCap(StrokeCap.Round);
		paint.setStrokeJoin(StrokeJoin.Round);
		paint.setStrokeWidth(ink.strokeWidth);
		paint.setColor(Skia.Color(ink.color));
		for (const stroke of strokes) canvas.drawPath(signatureStrokePath(stroke), paint);
	}
	return recorder.finishRecordingAsPicture();
}
