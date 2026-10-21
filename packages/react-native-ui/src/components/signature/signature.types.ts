/**
 * One sampled touch, in the pad's own points.
 *
 * `t` is milliseconds since the stroke began. Nothing reads it yet; it is stored
 * so a width that eases with drawing speed can follow without a format change.
 */
export type SignaturePoint = { x: number; y: number; t?: number };

/** One continuous touch, from finger down to finger up. */
export type SignatureStroke = readonly SignaturePoint[];

/**
 * A signature as data: the strokes, and the size of the pad they were drawn in.
 *
 * Plain JSON, so it can be persisted and handed back as `value` or
 * `defaultValue` later. The size travels with the strokes because a pad rendered
 * at another size — a rotation, a `full` pad on a tablet — re-fits them rather
 * than drawing them off its edge.
 */
export type SignatureValue = {
	width: number;
	height: number;
	strokes: readonly SignatureStroke[];
};

/** How `toSVG()` frames the exported drawing. */
export type SignatureViewBox = "tight" | "pad";

/**
 * Options for `toSVG()`.
 *
 * Every colour is a **literal** — `#1A1A1A`, `rgb(…)`. An exported file has no
 * theme to resolve a token against, so a token name is ignored rather than
 * written into the file as a colour no viewer knows.
 */
export type SignatureExportOptions = {
	/** The ink. Default `#000000`. */
	strokeColor?: string;
	/** The ink's width in points. Default the pad's own. */
	strokeWidth?: number;
	/** A literal colour painted behind the ink. Default `"transparent"`: no background at all. */
	background?: string;
	/** `pad` (default) keeps the whole pad; `tight` crops to the ink plus `padding`. */
	viewBox?: SignatureViewBox;
	/** Space kept around the ink when `viewBox` is `tight`, in points. Default 8. */
	padding?: number;
};

/** Options for `toPNG()`: the SVG's, plus the pixel density. */
export type SignaturePngOptions = SignatureExportOptions & {
	/** Pixels per point. Default: the screen's pixel ratio. */
	scale?: number;
};

/** What a signature's ref is handed. */
export type SignatureHandle = {
	/** Removes the last stroke. A no-op with nothing to undo. */
	undo: () => void;
	/** Restores the last undone stroke. A no-op with nothing to redo. */
	redo: () => void;
	/** Removes every stroke. Final: it empties the redo stack too. */
	clear: () => void;
	readonly isEmpty: boolean;
	readonly strokeCount: number;
	/** The current value, or `null` while the pad is empty. */
	readonly value: SignatureValue | null;
	/** The signature as a standalone SVG document. Valid, if blank, when empty. */
	toSVG: (options?: SignatureExportOptions) => string;
	/**
	 * The signature as a base64-encoded PNG (no `data:` prefix), framed and
	 * coloured as `toSVG` with the same options would be, at `scale` pixels per
	 * point. Transparent unless `background` is set. `""` before the pad is measured.
	 */
	toPNG: (options?: SignaturePngOptions) => string;
	/** One smoothed SVG path `d` per stroke, in pad coordinates. */
	toPaths: () => readonly string[];
};
