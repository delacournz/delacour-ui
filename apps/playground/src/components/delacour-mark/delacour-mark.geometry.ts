/**
 * The Delacour mark's geometry, and an SVG emitter built from it.
 *
 * This module is the single source of truth the launcher art and the in-app
 * art share: `scripts/generate-icons.ts` rasterises `delacourIconSvg()` into
 * every PNG `app.config.ts` points at, and `delacour-mark.tsx` draws the same
 * numbers with react-native-svg. Drawing the mark twice from two sets of
 * constants is how an app icon drifts from the app.
 *
 * It imports nothing — not React, not React Native — so `bun test` can reach
 * the whole of it. Keep it that way; the components are the place for anything
 * that needs a renderer.
 */

/** The master art's canvas. Every number below is in this space. */
export const DELACOUR_CANVAS = 1024;

/** Edge length of each square, before it is rotated and stroked. */
export const DELACOUR_SQUARE = 262.4;

/** Stroke weight. Wide enough that the miter tips matter — see the half-extent. */
export const DELACOUR_STROKE = 66.4;

/** Both squares sit on the canvas's vertical centre line. */
export const DELACOUR_CENTRE_X = DELACOUR_CANVAS / 2;

/** Centre of the upper square. */
export const DELACOUR_TOP_CENTRE_Y = 428.5;

/** Centre of the lower square. The offset from the upper one sets the overlap. */
export const DELACOUR_BOTTOM_CENTRE_Y = 595.5;

/** The card. */
export const DELACOUR_CARD_COLOUR = "#18181B";

/** The stroke. */
export const DELACOUR_STROKE_COLOUR = "#FBBF24";

/**
 * Android shows only the central 72 of an adaptive icon's 108dp foreground.
 * Scaling the whole full-bleed square by that fraction puts the glyph inside
 * the mask at the same proportion iOS shows it at, rather than crowding it.
 */
export const DELACOUR_ADAPTIVE_INSET = 72 / 108;

/** Left edge of both rects — they share a centre line. */
export const DELACOUR_RECT_X = DELACOUR_CENTRE_X - DELACOUR_SQUARE / 2;

/** Top edge of the rect centred on `centreY`. */
export function delacourRectY(centreY: number): number {
	return centreY - DELACOUR_SQUARE / 2;
}

/**
 * How far the stroked, rotated square reaches from its own centre.
 *
 * A mitered 90° corner puts its tip `(stroke / 2) / sin 45°` past the vertex,
 * so the outline reaches exactly as far as a bare `SQUARE + STROKE` square
 * would. The intuitive `SQUARE / √2 + STROKE / 2` is 13.75px short per side,
 * which is enough to mis-centre the glyph and to under-read the Android safe
 * zone. `stroke-miterlimit="10"` is far above the 1.414 a 90° join needs, so
 * nothing is clipped back.
 */
export const DELACOUR_GLYPH_HALF_EXTENT = (DELACOUR_SQUARE + DELACOUR_STROKE) / Math.SQRT2;

/** Half the glyph's taller axis: one square's reach plus the pair's offset. */
const GLYPH_HALF_HEIGHT = DELACOUR_GLYPH_HALF_EXTENT + (DELACOUR_BOTTOM_CENTRE_Y - DELACOUR_TOP_CENTRE_Y) / 2;

/**
 * The smallest square that contains the glyph, as a viewBox.
 *
 * Square rather than the glyph's true 465×632 bounds so a caller sizes the mark
 * with one number and gets symmetric side margins — the proportion the art was
 * drawn at.
 */
export const DELACOUR_GLYPH_VIEW_BOX = [
	DELACOUR_CENTRE_X - GLYPH_HALF_HEIGHT,
	DELACOUR_CANVAS / 2 - GLYPH_HALF_HEIGHT,
	GLYPH_HALF_HEIGHT * 2,
	GLYPH_HALF_HEIGHT * 2,
].join(" ");

export type DelacourIconSvgOptions = {
	/** Card fill, or `null` for a transparent canvas. Defaults to the card colour. */
	background?: string | null;
	/** Stroke colour. Defaults to the brand amber. */
	stroke?: string;
	/** Fraction of the canvas the full-bleed art is scaled into. 1 = full bleed. */
	inset?: number;
};

/**
 * The master art as an SVG string, in the variants the icon pipeline needs.
 *
 * The canvas stays 1024 at every inset — Expo and Android both want a
 * fixed-size layer, and it is the glyph inside it that shrinks.
 *
 * @example
 * delacourIconSvg();                                          // the app icon
 * delacourIconSvg({ background: null });                      // iOS dark
 * delacourIconSvg({ background: null, stroke: "#FFFFFF" });    // iOS tinted
 * delacourIconSvg({ background: null, inset: DELACOUR_ADAPTIVE_INSET });
 */
export function delacourIconSvg(options: DelacourIconSvgOptions = {}): string {
	const { background = DELACOUR_CARD_COLOUR, stroke = DELACOUR_STROKE_COLOUR, inset = 1 } = options;

	const card =
		background === null
			? ""
			: `\n\t<rect width="${DELACOUR_CANVAS}" height="${DELACOUR_CANVAS}" fill="${background}"/>`;

	const rect = (centreY: number): string =>
		`\t\t<rect x="${DELACOUR_RECT_X}" y="${delacourRectY(centreY)}" width="${DELACOUR_SQUARE}" height="${DELACOUR_SQUARE}" transform="rotate(45 ${DELACOUR_CENTRE_X} ${centreY})"/>`;

	const glyph = [
		`\t<g fill="none" stroke="${stroke}" stroke-width="${DELACOUR_STROKE}" stroke-linejoin="miter" stroke-miterlimit="10">`,
		rect(DELACOUR_TOP_CENTRE_Y),
		rect(DELACOUR_BOTTOM_CENTRE_Y),
		"\t</g>",
	].join("\n");

	// Half the space the scale frees up, so the glyph stays centred rather than
	// collapsing towards the origin.
	const offset = (DELACOUR_CANVAS * (1 - inset)) / 2;
	const body =
		inset === 1 ? glyph : `\t<g transform="translate(${offset} ${offset}) scale(${inset})">\n${glyph}\n\t</g>`;

	return `<svg width="${DELACOUR_CANVAS}" height="${DELACOUR_CANVAS}" viewBox="0 0 ${DELACOUR_CANVAS} ${DELACOUR_CANVAS}" xmlns="http://www.w3.org/2000/svg">${card}\n${body}\n</svg>\n`;
}
