import { describe, expect, test } from "bun:test";
import { formatNumberTick } from "../text/format-tick";
import { type ChartPlan, planAxis, resolveChartFrame } from "./chart-layout";

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
});
