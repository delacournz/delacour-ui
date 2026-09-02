import { describe, expect, test } from "bun:test";
import { formatNumberTick } from "../text/format-tick";
import { axisRanges, type ChartPlan, pickAxisRoles, placeAxisRoles, planAxis, resolveChartFrame } from "./chart-layout";

const canvas = { width: 300, height: 200 };

function numericAxis(overrides: Partial<Parameters<typeof planAxis>[0]> = {}) {
	return planAxis({
		domain: [0, 100],
		kind: "linear",
		range: [0, 300],
		tickCount: 5,
		format: formatNumberTick,
		show: true,
		...overrides,
	});
}

describe("planAxis", () => {
	test("decides tick values and their labels together", () => {
		const plan = numericAxis();
		expect(plan.tickValues.length).toBeGreaterThan(0);
		expect(plan.labels).toHaveLength(plan.tickValues.length);
		expect(plan.labels[0]).toBe("0");
	});

	test("produces no labels for a hidden axis, but keeps the values", () => {
		// The values still position a gridline even when nothing is written.
		const plan = numericAxis({ show: false });
		expect(plan.labels).toEqual([]);
		expect(plan.tickValues.length).toBeGreaterThan(0);
	});

	test("honours explicit tick values", () => {
		expect(numericAxis({ tickValues: [0, 50, 100] }).tickValues).toEqual([0, 50, 100]);
	});

	test("reports the niced domain, so pass two cannot re-nice it", () => {
		const plan = numericAxis({ domain: [3, 97], nice: true });
		expect(plan.domain).toEqual([0, 100]);
	});

	test("nices to its own tick count, so the ends of the axis get labels", () => {
		// Niced at d3's default ten, [28, 91] rounds to [25, 95] and four ticks
		// across it lands on 40/60/80 — three labels, neither at an end.
		const plan = numericAxis({ domain: [28, 91], nice: true, tickCount: 4 });
		expect(plan.domain).toEqual([20, 100]);
		expect(plan.tickValues).toEqual([20, 40, 60, 80, 100]);
	});

	test("uses the caller's formatter", () => {
		expect(numericAxis({ format: (value) => `${value}%` }).labels[0]).toBe("0%");
	});
});

describe("resolveChartFrame", () => {
	const plan: ChartPlan = {
		x: numericAxis({ domain: [0, 10], tickValues: [0, 5, 10] }),
		y: numericAxis({ domain: [0, 100], tickValues: [0, 50, 100] }),
	};

	const frame = (overrides: Partial<Parameters<typeof resolveChartFrame>[0]> = {}) =>
		resolveChartFrame({
			canvas,
			plan,
			xLabelWidths: [10, 10, 20],
			yLabelWidths: [8, 16, 24],
			lineHeight: 12,
			showXAxis: true,
			showYAxis: true,
			...overrides,
		});

	test("insets the plot rect by the measured gutters", () => {
		const resolved = frame();
		expect(resolved.bounds.left).toBeGreaterThan(0);
		expect(resolved.bounds.bottom).toBeLessThan(canvas.height);
	});

	test("keeps the plan's tick values and only moves their positions", () => {
		// The whole point of two passes: values fixed in pass one, positions in two.
		const resolved = frame();
		expect(resolved.xTicks.map((tick) => tick.value)).toEqual([0, 5, 10]);
		expect(resolved.yTicks.map((tick) => tick.value)).toEqual([0, 50, 100]);
	});

	test("puts every tick inside the plot rect", () => {
		const resolved = frame();
		for (const tick of resolved.xTicks) {
			expect(tick.position).toBeGreaterThanOrEqual(resolved.bounds.left - 1e-6);
			expect(tick.position).toBeLessThanOrEqual(resolved.bounds.right + 1e-6);
		}
		for (const tick of resolved.yTicks) {
			expect(tick.position).toBeGreaterThanOrEqual(resolved.bounds.top - 1e-6);
			expect(tick.position).toBeLessThanOrEqual(resolved.bounds.bottom + 1e-6);
		}
	});

	test("inverts the y range, so a larger value sits higher on screen", () => {
		const resolved = frame();
		const [low, high] = [resolved.yTicks[0], resolved.yTicks.at(-1)];
		expect(high?.position ?? 0).toBeLessThan(low?.position ?? 0);
	});

	test("reclaims the gutter when an axis is hidden", () => {
		const shown = frame();
		const hidden = frame({ showXAxis: false, showYAxis: false, xLabelWidths: [], yLabelWidths: [] });
		expect(hidden.bounds.left).toBeLessThan(shown.bounds.left);
		expect(hidden.bounds.bottom).toBeGreaterThan(shown.bounds.bottom);
	});

	test("is stable: measuring the same labels twice gives the same rect", () => {
		// If this ever failed the layout would oscillate on every render.
		expect(frame().bounds).toEqual(frame().bounds);
	});

	test("survives a canvas with no size", () => {
		const resolved = frame({ canvas: { width: 0, height: 0 } });
		expect(Number.isFinite(resolved.bounds.right)).toBe(true);
		expect(resolved.bounds.right).toBeGreaterThanOrEqual(resolved.bounds.left);
	});

	test("reserves the left gutter for category labels planned onto y", () => {
		// A horizontal chart plans its categories into the y range. The frame
		// does not know or care: it measures whatever labels sit on each side.
		const categories = planAxis({
			domain: [0, 2],
			kind: "linear",
			range: [0, 100],
			tickCount: 3,
			tickValues: [0, 1, 2],
			format: (value) => ["January", "February", "March"][value] ?? "",
			show: true,
		});
		const values = planAxis({
			domain: [0, 100],
			kind: "linear",
			range: [0, 300],
			tickCount: 4,
			format: String,
			show: true,
		});
		const frame = resolveChartFrame({
			canvas: { width: 300, height: 100 },
			plan: { x: values, y: categories },
			xLabelWidths: [10, 10, 10, 10],
			yLabelWidths: [60, 62, 40],
			lineHeight: 12,
			showXAxis: true,
			showYAxis: true,
		});
		expect(frame.bounds.left).toBeGreaterThanOrEqual(62);
		expect(frame.yTicks.map((tick) => tick.value)).toEqual([0, 1, 2]);
	});

	test("runs a horizontal chart's category axis top to bottom, so the first row is the top one", () => {
		const categories = planAxis({
			domain: [0, 2],
			kind: "linear",
			range: [0, 100],
			tickCount: 3,
			format: String,
			show: false,
		});
		const values = planAxis({
			domain: [0, 100],
			kind: "linear",
			range: [0, 300],
			tickCount: 4,
			format: String,
			show: false,
		});
		const frame = resolveChartFrame({
			canvas: { width: 300, height: 100 },
			plan: { x: values, y: categories },
			xLabelWidths: [],
			yLabelWidths: [],
			lineHeight: 12,
			showXAxis: false,
			showYAxis: false,
			orientation: "horizontal",
		});
		expect(frame.yScale.range[0]).toBe(frame.bounds.top);
		expect(frame.yScale.range[1]).toBe(frame.bounds.bottom);
		// The first tick — the first category — sits highest on screen.
		expect(frame.yTicks[0]?.position).toBeLessThan(frame.yTicks[2]?.position as number);
		// Values still grow rightward.
		expect(frame.xScale.range).toEqual([frame.bounds.left, frame.bounds.right]);
	});

	test("a vertical chart keeps its value axis bottom to top", () => {
		const frame = resolveChartFrame({
			canvas: { width: 300, height: 100 },
			plan: {
				x: planAxis({ domain: [0, 2], kind: "linear", range: [0, 300], tickCount: 3, format: String, show: false }),
				y: planAxis({ domain: [0, 100], kind: "linear", range: [100, 0], tickCount: 4, format: String, show: false }),
			},
			xLabelWidths: [],
			yLabelWidths: [],
			lineHeight: 12,
			showXAxis: false,
			showYAxis: false,
		});
		expect(frame.yScale.range).toEqual([frame.bounds.bottom, frame.bounds.top]);
	});
});

describe("axis roles", () => {
	const outer = { left: 10, right: 110, top: 5, bottom: 65 };

	test("vertical puts categories on x and values up y", () => {
		expect(pickAxisRoles("x", "y", "vertical")).toEqual({ category: "x", value: "y" });
		expect(placeAxisRoles("c", "v", "vertical")).toEqual({ x: "c", y: "v" });
		expect(axisRanges(outer, "vertical")).toEqual({ category: [10, 110], value: [65, 5] });
	});

	test("horizontal puts categories down y, top first, and values along x", () => {
		expect(pickAxisRoles("x", "y", "horizontal")).toEqual({ category: "y", value: "x" });
		expect(placeAxisRoles("c", "v", "horizontal")).toEqual({ x: "v", y: "c" });
		// Top to bottom, so the first row is the top one and positions ascend.
		expect(axisRanges(outer, "horizontal")).toEqual({ category: [5, 65], value: [10, 110] });
	});

	test("pick and place are inverses", () => {
		for (const orientation of ["vertical", "horizontal"] as const) {
			const picked = pickAxisRoles(1, 2, orientation);
			expect(placeAxisRoles(picked.category, picked.value, orientation)).toEqual({ x: 1, y: 2 });
		}
	});
});
