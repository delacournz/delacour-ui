import { describe, expect, test } from "bun:test";
import { resolveAxisGutters } from "./axis-gutters";

const base = { yLabelWidths: [10, 24, 18], xLabelWidths: [30, 30, 30], fontHeight: 12 };

describe("resolveAxisGutters", () => {
	test("reserves the widest y label plus the tick padding", () => {
		expect(resolveAxisGutters({ ...base, tickPadding: 6 }).left).toBe(30);
	});

	test("reserves one line height under the plot for the x labels", () => {
		expect(resolveAxisGutters({ ...base, tickPadding: 6 }).bottom).toBe(18);
	});

	test("moves the gutter to the other side when the axis does", () => {
		const right = resolveAxisGutters({ ...base, yAxisSide: "right" });
		expect(right.left).toBeLessThan(right.right);
		const top = resolveAxisGutters({ ...base, xAxisSide: "top" });
		// The bottom keeps the y labels' half-line overhang, but loses the x
		// gutter entirely — 6 rather than 18.
		expect(top.bottom).toBe(6);
		expect(top.top).toBeGreaterThan(base.fontHeight);
	});

	test("carries the first and last x label's overhang", () => {
		// Without it the leftmost label is clipped in half by the canvas edge,
		// which reads as a rendering bug rather than a layout one.
		const gutters = resolveAxisGutters({ ...base, yLabelWidths: [], xLabelWidths: [80, 30, 80] });
		expect(gutters.left).toBe(40);
		expect(gutters.right).toBe(40);
	});

	test("takes the wider of the y gutter and the label overhang, not their sum", () => {
		const gutters = resolveAxisGutters({ ...base, yLabelWidths: [100], xLabelWidths: [20, 20], tickPadding: 6 });
		expect(gutters.left).toBe(106);
	});

	test("reserves half a line above and below for the outermost y labels", () => {
		// A y label is centred on its tick and the outermost ticks sit on the
		// plot rect's edges, so half a line escapes at each end. Without this the
		// top label is sliced by the canvas — the vertical twin of the x labels'
		// horizontal overhang.
		const gutters = resolveAxisGutters({ ...base, xLabelWidths: [], fontHeight: 12 });
		expect(gutters.top).toBe(6);
		expect(gutters.bottom).toBe(6);
	});

	test("takes the wider of the x gutter and the y overhang, not their sum", () => {
		const gutters = resolveAxisGutters({ ...base, tickPadding: 6 });
		expect(gutters.bottom).toBe(18);
	});

	test("reserves no vertical overhang when the y axis draws no labels", () => {
		expect(resolveAxisGutters({ ...base, yLabelWidths: [], xLabelWidths: [] }).top).toBe(0);
	});

	test("reserves nothing for an axis that is not drawn", () => {
		const gutters = resolveAxisGutters({ ...base, showXAxis: false, showYAxis: false });
		expect(gutters).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
	});

	test("reserves nothing when there are no labels to draw", () => {
		expect(resolveAxisGutters({ yLabelWidths: [], xLabelWidths: [], fontHeight: 12 })).toEqual({
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		});
	});
});
