import { describe, expect, test } from "bun:test";
import type { ScaleDescriptor } from "../scale/scale.types";
import { collectYValues, transformInputData } from "./transform-input-data";

const xScale: ScaleDescriptor = { kind: "linear", domain: [0, 2], range: [0, 200] };
const yScale: ScaleDescriptor = { kind: "linear", domain: [0, 100], range: [100, 0] };

const data = [
	{ m: "Jan", sales: 0, cost: 50 },
	{ m: "Feb", sales: 50, cost: null },
	{ m: "Mar", sales: 100, cost: 25 },
];

describe("transformInputData", () => {
	test("carries canvas and domain coordinates on the same point", () => {
		const { points } = transformInputData({ data, yKeys: ["sales"], xValues: [0, 1, 2], xScale, yScale });
		expect(points.sales?.[0]).toEqual({ x: 0, y: 100, xValue: 0, yValue: 0 });
		expect(points.sales?.[2]).toEqual({ x: 200, y: 0, xValue: 2, yValue: 100 });
	});

	test("keeps one point per row, marking a missing value as a gap", () => {
		// Dropping the row would shift every later point one place left against
		// the x positions, and the line would draw the wrong shape.
		const { points } = transformInputData({ data, yKeys: ["cost"], xValues: [0, 1, 2], xScale, yScale });
		expect(points.cost).toHaveLength(3);
		expect(points.cost?.[1]?.y).toBeNull();
		expect(points.cost?.[1]?.yValue).toBeNull();
		expect(points.cost?.[1]?.x).toBe(100);
	});

	test("shares one set of x positions across every series", () => {
		const result = transformInputData({ data, yKeys: ["sales", "cost"], xValues: [0, 1, 2], xScale, yScale });
		expect(result.xPositions).toEqual([0, 100, 200]);
		for (const key of ["sales", "cost"]) {
			expect(result.points[key]?.map((point) => point.x)).toEqual([...result.xPositions]);
		}
	});

	test("handles an empty dataset", () => {
		const result = transformInputData({ data: [], yKeys: ["sales"], xValues: [], xScale, yScale });
		expect(result.points.sales).toEqual([]);
		expect(result.xPositions).toEqual([]);
	});

	test("treats an absent key as a series of gaps rather than throwing", () => {
		const { points } = transformInputData({ data, yKeys: ["missing"], xValues: [0, 1, 2], xScale, yScale });
		expect(points.missing?.every((point) => point.y === null)).toBe(true);
	});
});

describe("collectYValues", () => {
	test("gathers every finite value across every series", () => {
		expect(collectYValues(data, ["sales", "cost"]).sort((a, b) => a - b)).toEqual([0, 25, 50, 50, 100]);
	});

	test("skips gaps", () => {
		expect(collectYValues(data, ["cost"])).toEqual([50, 25]);
	});
});
