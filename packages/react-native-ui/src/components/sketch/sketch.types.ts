import type { SketchShape } from "./sketch.paths";

/** What `toSVG` takes. */
export type SketchExportOptions = {
	/**
	 * Painted behind everything. A literal, or `background`, `card` or one of the
	 * sketch's swatch tokens. Default: the theme's `background`, resolved when the
	 * export runs. `null` leaves it transparent.
	 */
	background?: string | null;
};

/** The imperative handle a `ref` on `<Sketch>` receives. */
export type SketchHandle = {
	/** Removes the last mark. An eraser stroke is one mark. */
	undo: () => void;
	/** Removes every mark. */
	clear: () => void;
	isEmpty: () => boolean;
	/** Self-contained SVG: the viewBox is the canvas, an optional background rect, masks inlined. */
	toSVG: (options?: SketchExportOptions) => string;
};

/**
 * What the pan hands back to React when a stroke ends: everything an item needs
 * but its id, which is minted on the JS thread.
 */
export type SketchCommit =
	| { kind: "stroke"; d: string; color: string; width: number }
	| { kind: "shape"; shape: SketchShape; d: string; color: string; width: number }
	| { kind: "erase"; d: string; width: number };

/** The canvas's measured size in points. `0×0` until its first layout. */
export type SketchCanvasSize = { width: number; height: number };
