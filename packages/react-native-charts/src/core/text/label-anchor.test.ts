import { describe, expect, test } from "bun:test";
import { anchorX, anchorY, labelHeight } from "./label-anchor";

describe("anchorX", () => {
	test("centres a label on the point it labels", () => {
		expect(anchorX(100, 40, "middle")).toBe(80);
	});

	test("starts and ends against the point", () => {
		expect(anchorX(100, 40, "start")).toBe(100);
		expect(anchorX(100, 40, "end")).toBe(60);
	});
});

describe("anchorY", () => {
	// A 12pt line: 9 above the baseline, 3 below. The asymmetry is the point.
	const metrics = { ascent: 9, descent: 3 };

	test("puts the glyph box's top edge below the anchor, gap included", () => {
		// The bug this replaced: a baseline a whole line-height down put the box's
		// BOTTOM where its top belonged, and every descender — the tail of a `Q`,
		// the hook of a `y` — hung past the reserved gutter and was sliced off by
		// the canvas. `Jan` looked perfect; `Q1` was visibly cut.
		const baseline = anchorY(100, metrics, "below", 6);
		expect(baseline - metrics.ascent).toBe(106);
		expect(baseline + metrics.descent).toBe(118);
	});

	test("keeps a below label inside the gutter reserved for it", () => {
		const gap = 6;
		const gutter = gap + labelHeight(metrics);
		const bottom = anchorY(100, metrics, "below", gap) + metrics.descent;
		expect(bottom).toBeLessThanOrEqual(100 + gutter);
	});

	test("puts the glyph box's bottom edge above the anchor", () => {
		const baseline = anchorY(100, metrics, "above", 6);
		expect(baseline + metrics.descent).toBe(94);
	});

	test("centres the glyph box on the anchor, not the baseline", () => {
		// Anchoring the baseline puts every y-axis label below its own gridline.
		const baseline = anchorY(100, metrics, "middle");
		const top = baseline - metrics.ascent;
		const bottom = baseline + metrics.descent;
		expect((top + bottom) / 2).toBe(100);
	});

	test("a symmetric font still centres", () => {
		const even = { ascent: 6, descent: 6 };
		expect(anchorY(100, even, "middle")).toBe(100);
	});
});

describe("labelHeight", () => {
	test("is the whole glyph box, which is what a gutter reserves", () => {
		expect(labelHeight({ ascent: 9, descent: 3 })).toBe(12);
	});
});
