import { describe, expect, test } from "bun:test";
import type { ChartPoint, ChartSegment } from "../chart.types";
import type { ScaleDescriptor } from "../scale/scale.types";
import { barRects, barsPathFromRects, buildBarsPath, resolveBaseline } from "./build-bars";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });
const seg = (x: number, y: number | null, y0: number | null): ChartSegment => ({
	x,
	y,
	xValue: x,
	yValue: y,
	y0,
	y0Value: y0,
});

function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

const bounds = { left: 0, right: 100, top: 0, bottom: 100 };

describe("barRects", () => {
	test("centres each bar on its x, from the baseline to its y", () => {
		const [rect] = barRects([at(50, 30)], { bandwidth: 20, baseline: 100 });
		expect(rect).toEqual({ left: 40, top: 30, right: 60, bottom: 100, negative: false, index: 0 });
	});

	test("an offset shifts every bar, which is how a group interleaves", () => {
		const [rect] = barRects([at(50, 30)], { bandwidth: 20, baseline: 100, offset: -15 });
		expect(rect?.left).toBe(25);
		expect(rect?.right).toBe(45);
	});

	test("a bar below the baseline is flagged negative, with top still above bottom", () => {
		const [rect] = barRects([at(50, 120)], { bandwidth: 20, baseline: 100 });
		expect(rect).toMatchObject({ top: 100, bottom: 120, negative: true });
	});

	test("a gap is a zero-height bar at the baseline, never a dropped bar", () => {
		// Dropping it would shift every later bar's index, and a stacked chart
		// would pair the wrong segments.
		const rects = barRects([at(10, 30), at(50, null), at(90, 60)], { bandwidth: 20, baseline: 100 });
		expect(rects).toHaveLength(3);
		expect(rects[1]).toMatchObject({ top: 100, bottom: 100, negative: false, index: 1 });
	});

	test("a segment bases on its own y0 rather than the baseline", () => {
		const [rect] = barRects([seg(50, 30, 60)], { bandwidth: 20, baseline: 100 });
		expect(rect).toMatchObject({ top: 30, bottom: 60, negative: false });
	});

	test("a negative segment is one whose top is below its base", () => {
		const [rect] = barRects([seg(50, 80, 60)], { bandwidth: 20, baseline: 100 });
		expect(rect).toMatchObject({ top: 60, bottom: 80, negative: true });
	});

	test("a segment with a null base is a gap at the baseline", () => {
		const [rect] = barRects([seg(50, null, null)], { bandwidth: 20, baseline: 100 });
		expect(rect).toMatchObject({ top: 100, bottom: 100 });
	});
});

describe("buildBarsPath", () => {
	test("one rect's worth of verbs per bar", () => {
		expect(commands(buildBarsPath([at(10, 30), at(50, 60)], { bandwidth: 20, baseline: 100 }))).toBe(
			"MCLCLCLCZMCLCLCLCZ"
		);
	});

	test("the verbs never depend on the values", () => {
		// Positive, gap and negative all animate into one another.
		const options = { bandwidth: 20, baseline: 100, roundedCorners: { topLeft: 4, topRight: 4 } };
		const before = buildBarsPath([at(10, 50), at(50, 70), at(90, 20)], options);
		const after = buildBarsPath([at(10, 90), at(50, null), at(90, 120)], options);
		expect(commands(after)).toBe(commands(before));
	});

	test("rounds the value end of a positive bar", () => {
		const path = buildBarsPath([at(50, 30)], { bandwidth: 20, baseline: 100, roundedCorners: { topLeft: 4 } });
		// Starts on the left edge 4 below the top: the top-left corner is rounded.
		expect(path.startsWith("M40,34")).toBe(true);
	});

	test("a negative bar rounds the same corner at its value end, which is its canvas bottom", () => {
		const path = buildBarsPath([at(50, 120)], { bandwidth: 20, baseline: 100, roundedCorners: { topLeft: 4 } });
		// The rect's top-left is now square, so the path starts at the very corner.
		expect(path.startsWith("M40,100")).toBe(true);
		// ...and the bottom-left carries the radius.
		expect(path).toContain("L44,120");
	});

	test("is empty for no points", () => {
		expect(buildBarsPath([], { bandwidth: 20, baseline: 100 })).toBe("");
	});
});

describe("barsPathFromRects", () => {
	test("takes per-rect corners, for a stack that rounds only its top segment", () => {
		const rects = barRects([at(10, 30), at(50, 30)], { bandwidth: 20, baseline: 100 });
		const path = barsPathFromRects(rects, [undefined, { topLeft: 4 }]);
		expect(path.startsWith("M0,30")).toBe(true);
		expect(path).toContain("M40,34");
	});
});

describe("resolveBaseline", () => {
	const linear = (domain: readonly [number, number]): ScaleDescriptor => ({
		kind: "linear",
		domain,
		range: [100, 0],
	});

	test("is the position of zero", () => {
		expect(resolveBaseline(linear([-50, 50]), bounds)).toBe(50);
	});

	test("clamps into the plot when zero is outside the domain", () => {
		expect(resolveBaseline(linear([40, 90]), bounds)).toBe(100);
		expect(resolveBaseline(linear([-90, -40]), bounds)).toBe(0);
	});

	test("a log scale bases at the plot bottom, where zero cannot be drawn", () => {
		expect(resolveBaseline({ kind: "log", domain: [1, 1000], range: [100, 0], base: 10 }, bounds)).toBe(100);
	});
});

describe("horizontal bars", () => {
	// Category on y, value on x. A horizontal point is `{ x: value, y: category }`.
	const h = (y: number, x: number | null): ChartPoint => ({ x: x ?? Number.NaN, y, xValue: y, yValue: x });
	const hseg = (y: number, x: number | null, x0: number | null): ChartSegment => ({
		x: x ?? Number.NaN,
		y,
		xValue: y,
		yValue: x,
		y0: x0,
		y0Value: x0,
	});

	test("spans from the baseline x to the value x, a bandwidth tall around y", () => {
		const [rect] = barRects([h(50, 80)], { bandwidth: 20, baseline: 0, orientation: "horizontal" });
		expect(rect).toEqual({ left: 0, top: 40, right: 80, bottom: 60, negative: false, index: 0 });
	});

	test("a bar left of the baseline is negative", () => {
		const [rect] = barRects([h(50, 20)], { bandwidth: 20, baseline: 60, orientation: "horizontal" });
		expect(rect).toMatchObject({ left: 20, right: 60, negative: true });
	});

	test("a gap is a zero-width bar at the baseline", () => {
		const [rect] = barRects([h(50, null)], { bandwidth: 20, baseline: 30, orientation: "horizontal" });
		expect(rect).toMatchObject({ left: 30, right: 30, top: 40, bottom: 60 });
	});

	test("a segment bases on its y0, which lies along the value axis", () => {
		const [rect] = barRects([hseg(50, 80, 30)], { bandwidth: 20, baseline: 0, orientation: "horizontal" });
		expect(rect).toMatchObject({ left: 30, right: 80, negative: false });
	});

	test("an offset shifts the bar along y", () => {
		const [rect] = barRects([h(50, 80)], { bandwidth: 20, baseline: 0, offset: 5, orientation: "horizontal" });
		expect(rect).toMatchObject({ top: 45, bottom: 65 });
	});

	test("the value-end corners land on the right of a positive bar", () => {
		const path = buildBarsPath([h(50, 80)], {
			bandwidth: 20,
			baseline: 0,
			orientation: "horizontal",
			roundedCorners: { topLeft: 4, topRight: 4 },
		});
		// Left edge square: the path starts at the very top-left corner.
		expect(path.startsWith("M0,40")).toBe(true);
		// Right edge rounded at both ends.
		expect(path).toContain("L76,40");
		expect(path).toContain("80,44L80,56");
	});

	test("and on the left of a negative bar", () => {
		const path = buildBarsPath([h(50, 20)], {
			bandwidth: 20,
			baseline: 60,
			orientation: "horizontal",
			roundedCorners: { topLeft: 4, topRight: 4 },
		});
		expect(path.startsWith("M20,44")).toBe(true);
		expect(path).toContain("L24,60");
	});

	test("the verbs never depend on the values", () => {
		const options = { bandwidth: 20, baseline: 0, orientation: "horizontal" as const };
		const before = buildBarsPath([h(10, 50), h(50, 70)], options);
		const after = buildBarsPath([h(10, null), h(50, -20)], options);
		expect(commands(after)).toBe(commands(before));
	});

	test("the baseline is the position of zero on the value scale, clamped to the plot's width", () => {
		const scale: ScaleDescriptor = { kind: "linear", domain: [-50, 50], range: [0, 100] };
		expect(resolveBaseline(scale, bounds, "horizontal")).toBe(50);
		const pinned: ScaleDescriptor = { kind: "linear", domain: [40, 90], range: [0, 100] };
		expect(resolveBaseline(pinned, bounds, "horizontal")).toBe(0);
		expect(resolveBaseline({ kind: "log", domain: [1, 10], range: [0, 100], base: 10 }, bounds, "horizontal")).toBe(0);
	});
});
