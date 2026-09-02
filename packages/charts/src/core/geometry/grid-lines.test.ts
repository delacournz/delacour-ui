import { describe, expect, test } from "bun:test";
import type { ChartTick } from "../ticks/tick.types";
import { gridSegments } from "./grid-lines";

const bounds = { left: 20, top: 0, right: 300, bottom: 200 };
const yTicks: ChartTick[] = [
	{ value: 0, position: 200 },
	{ value: 50, position: 100 },
];
const xTicks: ChartTick[] = [
	{ value: 0, position: 20 },
	{ value: 10, position: 300 },
];

describe("gridSegments", () => {
	test("spans the plot rect horizontally at each y tick", () => {
		expect(gridSegments({ bounds, xTicks, yTicks })).toEqual([
			[20, 200, 300, 200],
			[20, 100, 300, 100],
		]);
	});

	test("defaults to the y ticks alone", () => {
		// Horizontal rules carry a value across to the axis, which is what a
		// gridline is for. Vertical ones mostly repeat what the marks show.
		expect(gridSegments({ bounds, xTicks, yTicks })).toHaveLength(2);
	});

	test("draws vertical rules when asked", () => {
		expect(gridSegments({ bounds, xTicks, yTicks, axis: "x" })).toEqual([
			[20, 0, 20, 200],
			[300, 0, 300, 200],
		]);
	});

	test("draws both", () => {
		expect(gridSegments({ bounds, xTicks, yTicks, axis: "both" })).toHaveLength(4);
	});

	test("skips a tick with no usable position rather than pinning it to zero", () => {
		const broken: ChartTick[] = [{ value: 0, position: Number.NaN }, ...yTicks];
		expect(gridSegments({ bounds, xTicks, yTicks: broken })).toHaveLength(2);
	});

	test("draws nothing when there are no ticks", () => {
		expect(gridSegments({ bounds, xTicks: [], yTicks: [], axis: "both" })).toEqual([]);
	});
});
