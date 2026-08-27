import { describe, expect, test } from "bun:test";
import {
	DELACOUR_ADAPTIVE_INSET,
	DELACOUR_BOTTOM_CENTRE_Y,
	DELACOUR_CANVAS,
	DELACOUR_CARD_COLOUR,
	DELACOUR_CENTRE_X,
	DELACOUR_CORNER_RADIUS,
	DELACOUR_CORNER_RATIO,
	DELACOUR_GLYPH_HALF_EXTENT,
	DELACOUR_GLYPH_VIEW_BOX,
	DELACOUR_RECT_X,
	DELACOUR_SQUARE,
	DELACOUR_STROKE,
	DELACOUR_STROKE_COLOUR,
	DELACOUR_TOP_CENTRE_Y,
	delacourIconSvg,
	delacourRectY,
} from "./geometry";
import { readIconSource } from "./source";

const SOURCE = readIconSource();

describe("the committed master art", () => {
	// The PNGs are rasterised from `icon-source.svg` while the React Native
	// components are drawn from the constants. Nothing forces the two to agree,
	// so this is the gate: change one without the other and the build fails here
	// rather than shipping a launcher icon that no longer matches the app.
	test("carries every geometry number the constants restate", () => {
		expect(SOURCE).toContain(`viewBox="0 0 ${DELACOUR_CANVAS} ${DELACOUR_CANVAS}"`);
		expect(SOURCE).toContain(`width="${DELACOUR_SQUARE}" height="${DELACOUR_SQUARE}"`);
		expect(SOURCE).toContain(`stroke-width="${DELACOUR_STROKE}"`);
		expect(SOURCE).toContain(`x="${DELACOUR_RECT_X}"`);
		expect(SOURCE).toContain(`y="${delacourRectY(DELACOUR_TOP_CENTRE_Y)}"`);
		expect(SOURCE).toContain(`y="${delacourRectY(DELACOUR_BOTTOM_CENTRE_Y)}"`);
	});

	test("carries both rotations and the palette", () => {
		expect(SOURCE).toContain(`rotate(45 ${DELACOUR_CENTRE_X} ${DELACOUR_TOP_CENTRE_Y})`);
		expect(SOURCE).toContain(`rotate(45 ${DELACOUR_CENTRE_X} ${DELACOUR_BOTTOM_CENTRE_Y})`);
		expect(SOURCE).toContain(`fill="${DELACOUR_CARD_COLOUR}"`);
		expect(SOURCE).toContain(`stroke="${DELACOUR_STROKE_COLOUR}"`);
	});

	// Not decoration: a rounded join would shrink the glyph's extent and put
	// every derived number below out by ~47px.
	test("keeps the joins mitered and unclipped", () => {
		expect(SOURCE).toContain('stroke-linejoin="miter"');
		expect(SOURCE).toContain('stroke-miterlimit="10"');
	});
});

describe("the derived geometry", () => {
	test("places each rect at its centre", () => {
		expect(DELACOUR_RECT_X).toBe(380.8);
		expect(delacourRectY(DELACOUR_TOP_CENTRE_Y)).toBe(297.3);
		expect(delacourRectY(DELACOUR_BOTTOM_CENTRE_Y)).toBe(464.3);
	});

	// A mitered 90° corner puts its tip (stroke / 2) / sin 45° past the vertex,
	// so the stroked square reaches as far as a bare `SQUARE + STROKE` one would.
	// The naive `SQUARE / √2 + STROKE / 2` is 13.75px short per side.
	test("accounts for the miter tips, not just half the stroke", () => {
		expect(DELACOUR_GLYPH_HALF_EXTENT).toBeCloseTo(232.4967, 4);
		expect(DELACOUR_GLYPH_HALF_EXTENT).toBeGreaterThan(DELACOUR_SQUARE / Math.SQRT2 + DELACOUR_STROKE / 2);
	});

	test("bounds the glyph in a square centred on the canvas", () => {
		const [x, y, width, height] = DELACOUR_GLYPH_VIEW_BOX.split(" ").map(Number);
		expect(width).toBeCloseTo(631.9934, 4);
		expect(height).toBe(width);
		expect(x + width / 2).toBeCloseTo(DELACOUR_CENTRE_X, 6);
		expect(y + height / 2).toBeCloseTo(DELACOUR_CANVAS / 2, 6);
	});

	// The two diamonds are offset from the canvas centre by equal and opposite
	// amounts, which is the only reason a full-bleed square reads as balanced.
	test("centres the glyph vertically", () => {
		const top = DELACOUR_TOP_CENTRE_Y - DELACOUR_GLYPH_HALF_EXTENT;
		const bottom = DELACOUR_BOTTOM_CENTRE_Y + DELACOUR_GLYPH_HALF_EXTENT;
		expect((top + bottom) / 2).toBeCloseTo(DELACOUR_CANVAS / 2, 6);
	});

	// Android shows only the central 72/108 of an adaptive foreground. Scaling
	// the whole 1024 art by exactly that fraction reproduces the iOS ratio
	// inside the mask instead of a glyph that crowds it.
	test("takes the adaptive inset straight from Android's safe zone", () => {
		expect(DELACOUR_ADAPTIVE_INSET).toBeCloseTo(72 / 108, 10);
		const insetExtent = 2 * DELACOUR_GLYPH_HALF_EXTENT * DELACOUR_ADAPTIVE_INSET;
		expect(insetExtent).toBeLessThan(DELACOUR_CANVAS * DELACOUR_ADAPTIVE_INSET);
	});
});

describe("delacourIconSvg", () => {
	test("reproduces the committed master when left at its defaults", () => {
		const svg = delacourIconSvg();
		expect(svg).toContain(
			`<rect width="${DELACOUR_CANVAS}" height="${DELACOUR_CANVAS}" fill="${DELACOUR_CARD_COLOUR}"/>`
		);
		expect(svg).toContain(`stroke="${DELACOUR_STROKE_COLOUR}"`);
		expect(svg).toContain(`rotate(45 ${DELACOUR_CENTRE_X} ${DELACOUR_TOP_CENTRE_Y})`);
		expect(svg).toContain(`rotate(45 ${DELACOUR_CENTRE_X} ${DELACOUR_BOTTOM_CENTRE_Y})`);
		expect(svg).not.toContain("scale(");
	});

	test("drops the card for a transparent canvas", () => {
		const svg = delacourIconSvg({ background: null });
		expect(svg).not.toContain(DELACOUR_CARD_COLOUR);
		expect(svg).toContain(`stroke="${DELACOUR_STROKE_COLOUR}"`);
	});

	test("honours an explicit stroke", () => {
		expect(delacourIconSvg({ background: null, stroke: "#FFFFFF" })).toContain('stroke="#FFFFFF"');
	});

	// The translate has to be half the space the scale frees up, or the glyph
	// lands in the top-left corner of the safe zone rather than its centre.
	test("centres an inset glyph in the canvas", () => {
		const svg = delacourIconSvg({ background: null, inset: DELACOUR_ADAPTIVE_INSET });
		const offset = (DELACOUR_CANVAS * (1 - DELACOUR_ADAPTIVE_INSET)) / 2;
		expect(svg).toContain(`translate(${offset} ${offset})`);
		expect(svg).toContain(`scale(${DELACOUR_ADAPTIVE_INSET})`);
	});

	test("emits a full-bleed canvas at every inset", () => {
		for (const inset of [1, DELACOUR_ADAPTIVE_INSET, 0.5]) {
			expect(delacourIconSvg({ inset })).toContain(`viewBox="0 0 ${DELACOUR_CANVAS} ${DELACOUR_CANVAS}"`);
		}
	});

	// The launcher art is masked by iOS and Android themselves. A default that
	// rounded would ship an icon rounded twice, with pale corners inside the
	// system's own mask.
	test("leaves the corners square unless asked", () => {
		expect(delacourIconSvg()).not.toContain("clipPath");
		expect(delacourIconSvg({ corner: 0 })).not.toContain("clipPath");
	});

	test("clips the whole card, not just the glyph", () => {
		const svg = delacourIconSvg({ corner: DELACOUR_CORNER_RADIUS });
		const clipped = svg.indexOf("clip-path=");
		expect(clipped).toBeGreaterThan(-1);
		expect(svg).toContain(`rx="${DELACOUR_CORNER_RADIUS}"`);
		expect(svg.indexOf(`fill="${DELACOUR_CARD_COLOUR}"`)).toBeGreaterThan(clipped);
	});

	test("rounds a transparent canvas without leaving the card behind", () => {
		const svg = delacourIconSvg({ background: null, corner: DELACOUR_CORNER_RADIUS });
		expect(svg).toContain("clip-path=");
		expect(svg).not.toContain(DELACOUR_CARD_COLOUR);
	});
});

describe("the rounded treatment", () => {
	test("takes Apple's continuous-corner ratio", () => {
		expect(DELACOUR_CORNER_RATIO).toBeCloseTo(0.2237, 4);
		expect(DELACOUR_CORNER_RADIUS).toBe(229);
	});

	// A radius at or past half the canvas is a circle, not a rounded square.
	test("stays a squircle, not a circle", () => {
		expect(DELACOUR_CORNER_RADIUS).toBeLessThan(DELACOUR_CANVAS / 2);
	});
});
