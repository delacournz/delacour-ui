import {
	BlendMode,
	ImageFormat,
	PaintStyle,
	type SkCanvas,
	Skia,
	type SkPicture,
	StrokeCap,
	StrokeJoin,
} from "react-native-skia";
import type { SketchItem } from "./sketch.paths";

/** What `drawSketchItems` paints into: the canvas size in points. */
type SketchArea = { width: number; height: number };

/**
 * Paints every mark, oldest first, into one layer.
 *
 * **The eraser is paint order.** An erase stroke is drawn with `BlendMode.Clear`,
 * which zeroes whatever the layer already holds under it — every mark before it
 * — and leaves the marks drawn after it, which have not been painted yet. That
 * is the whole of the eraser's semantics; nothing groups or masks. The layer is
 * what keeps the clear from cutting through to whatever sits under the canvas:
 * an annotated image, or the export's background.
 *
 * Path data that does not parse is skipped, never drawn as an empty path.
 */
export function drawSketchItems(canvas: SkCanvas, items: readonly SketchItem[]): void {
	const paint = Skia.Paint();
	paint.setAntiAlias(true);
	paint.setStyle(PaintStyle.Stroke);
	paint.setStrokeCap(StrokeCap.Round);
	paint.setStrokeJoin(StrokeJoin.Round);

	canvas.saveLayer();
	for (const item of items) {
		const path = Skia.Path.MakeFromSVGString(item.d);
		if (path === null) continue;
		paint.setStrokeWidth(item.width);
		if (item.kind === "erase") {
			paint.setBlendMode(BlendMode.Clear);
		} else {
			paint.setBlendMode(BlendMode.SrcOver);
			paint.setColor(Skia.Color(item.color));
		}
		canvas.drawPath(path, paint);
	}
	canvas.restore();
}

/**
 * The committed drawing, recorded once per change of the marks.
 *
 * A picture replays as one draw call, so the canvas holds one node however many
 * strokes there are — the reason Sketch is on Skia and not on an SVG tree whose
 * mask count grew with every erase.
 */
export function recordSketchPicture(items: readonly SketchItem[], area: SketchArea): SkPicture {
	const recorder = Skia.PictureRecorder();
	const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, area.width, area.height));
	drawSketchItems(canvas, items);
	return recorder.finishRecordingAsPicture();
}

/** What {@link renderSketchPng} draws. `background` is already a literal, or `null`. */
type SketchPngTarget = SketchArea & { background: string | null; scale: number };

/**
 * The drawing as a base64 PNG, rendered off screen on a CPU surface.
 *
 * Off screen rather than a snapshot of the visible canvas, so the file holds the
 * marks and the background only — never the image being annotated under them —
 * matching `toSVG`. Returns `""` before the canvas is measured.
 */
export function renderSketchPng(items: readonly SketchItem[], target: SketchPngTarget): string {
	const pixelWidth = Math.round(target.width * target.scale);
	const pixelHeight = Math.round(target.height * target.scale);
	if (pixelWidth <= 0 || pixelHeight <= 0) return "";

	const surface = Skia.Surface.MakeRaster(pixelWidth, pixelHeight);
	if (surface === null) return "";
	const canvas = surface.getCanvas();
	canvas.scale(target.scale, target.scale);
	if (target.background !== null) canvas.drawColor(Skia.Color(target.background));
	drawSketchItems(canvas, items);
	surface.flush();
	return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG);
}
