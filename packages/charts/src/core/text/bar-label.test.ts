import { describe, expect, test } from "bun:test";
import type { BarRect } from "../shape/build-bars";
import { barLabelAnchor } from "./bar-label";

const metrics = { ascent: 9, descent: 3 };
const positive: BarRect = { left: 40, top: 30, right: 60, bottom: 100, negative: false, index: 0 };
const negative: BarRect = { left: 40, top: 100, right: 60, bottom: 130, negative: true, index: 0 };

describe("barLabelAnchor", () => {
	test("top centres the label above a positive bar, gap included", () => {
		const anchor = barLabelAnchor({ rect: positive, position: "top", width: 20, metrics, gap: 4 });
		expect(anchor.x).toBe(40);
		// The glyph box's bottom edge sits 4 above the bar's top.
		expect(anchor.y + metrics.descent).toBe(26);
	});

	test("top flips below the value end of a negative bar", () => {
		// The value end is the canvas bottom; a label above the rect would sit
		// on the baseline, in the middle of the chart.
		const anchor = barLabelAnchor({ rect: negative, position: "top", width: 20, metrics, gap: 4 });
		expect(anchor.y - metrics.ascent).toBe(134);
	});

	test("bottom sits against the base end", () => {
		expect(barLabelAnchor({ rect: positive, position: "bottom", width: 20, metrics, gap: 4 }).y - metrics.ascent).toBe(
			104
		);
		expect(barLabelAnchor({ rect: negative, position: "bottom", width: 20, metrics, gap: 4 }).y + metrics.descent).toBe(
			96
		);
	});

	test("left and right sit beside the bar, centred on its height", () => {
		const left = barLabelAnchor({ rect: positive, position: "left", width: 20, metrics, gap: 4 });
		expect(left.x + 20).toBe(36);
		const right = barLabelAnchor({ rect: positive, position: "right", width: 20, metrics, gap: 4 });
		expect(right.x).toBe(64);
		const centre = (left.y - metrics.ascent + left.y + metrics.descent) / 2;
		expect(centre).toBe(65);
	});

	test("defaults the gap to four", () => {
		expect(barLabelAnchor({ rect: positive, position: "top", width: 0, metrics }).y + metrics.descent).toBe(26);
	});

	describe("horizontal", () => {
		const right: BarRect = { left: 20, top: 40, right: 80, bottom: 60, negative: false, index: 0 };
		const left: BarRect = { left: 20, top: 40, right: 80, bottom: 60, negative: true, index: 0 };

		test("top sits beyond the value end: right of a positive bar, left of a negative one", () => {
			const a = barLabelAnchor({ rect: right, position: "top", width: 20, metrics, gap: 4, orientation: "horizontal" });
			expect(a.x).toBe(84);
			const b = barLabelAnchor({ rect: left, position: "top", width: 20, metrics, gap: 4, orientation: "horizontal" });
			expect(b.x + 20).toBe(16);
			// Both centred on the bar's height.
			expect((a.y - metrics.ascent + a.y + metrics.descent) / 2).toBe(50);
		});

		test("bottom sits against the base end", () => {
			const a = barLabelAnchor({
				rect: right,
				position: "bottom",
				width: 20,
				metrics,
				gap: 4,
				orientation: "horizontal",
			});
			expect(a.x + 20).toBe(16);
			const b = barLabelAnchor({
				rect: left,
				position: "bottom",
				width: 20,
				metrics,
				gap: 4,
				orientation: "horizontal",
			});
			expect(b.x).toBe(84);
		});

		test("left and right stay canvas sides", () => {
			const a = barLabelAnchor({
				rect: right,
				position: "right",
				width: 20,
				metrics,
				gap: 4,
				orientation: "horizontal",
			});
			expect(a.x).toBe(84);
		});
	});
});
