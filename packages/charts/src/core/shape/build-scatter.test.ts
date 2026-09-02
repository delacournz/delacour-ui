import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildScatterPath } from "./build-scatter";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

function numbers(path: string): number[] {
	return (path.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/g) ?? []).map(Number);
}

describe("buildScatterPath", () => {
	test("a circle is a move and four cubics, closed", () => {
		expect(commands(buildScatterPath([at(10, 10)], { radius: 4, baseline: 100 }))).toBe("MCCCCZ");
	});

	test("a square is a move and three lines, closed", () => {
		expect(commands(buildScatterPath([at(10, 10)], { radius: 4, shape: "square", baseline: 100 }))).toBe("MLLLZ");
	});

	test("a star is a move and nine lines, closed", () => {
		expect(commands(buildScatterPath([at(10, 10)], { radius: 4, shape: "star", baseline: 100 }))).toBe("MLLLLLLLLLZ");
	});

	test("one shape's worth of verbs per point", () => {
		const points = [at(10, 10), at(20, 20), at(30, 30)];
		expect(commands(buildScatterPath(points, { radius: 4, baseline: 100 }))).toBe("MCCCCZ".repeat(3));
		expect(commands(buildScatterPath(points, { radius: 4, shape: "square", baseline: 100 }))).toBe("MLLLZ".repeat(3));
	});

	test("a square's corners are a radius from the centre on each axis", () => {
		const path = buildScatterPath([at(10, 20)], { radius: 4, shape: "square", baseline: 100 });
		expect(numbers(path)).toEqual([6, 16, 14, 16, 14, 24, 6, 24]);
	});

	test("a circle's cubics start at the top and pass through the four compass points", () => {
		const path = buildScatterPath([at(10, 20)], { radius: 4, baseline: 100 });
		expect(path.startsWith("M10,16")).toBe(true);
		const values = numbers(path);
		// Each cubic's end point is every sixth pair after the move.
		expect([values[6], values[7]]).toEqual([14, 20]);
		expect([values[12], values[13]]).toEqual([10, 24]);
		expect([values[18], values[19]]).toEqual([6, 20]);
	});

	test("a star alternates outer and inner vertices, the inner at 0.382 of the radius", () => {
		const values = numbers(buildScatterPath([at(0, 0)], { radius: 10, shape: "star", baseline: 100 }));
		const distances: number[] = [];
		for (let index = 0; index < values.length; index += 2) {
			distances.push(Math.hypot(values[index] as number, values[index + 1] as number));
		}
		expect(distances).toHaveLength(10);
		for (let index = 0; index < distances.length; index += 1) {
			expect(distances[index]).toBeCloseTo(index % 2 === 0 ? 10 : 3.82, 5);
		}
		// The first vertex points straight up.
		expect(values[0]).toBeCloseTo(0, 10);
		expect(values[1]).toBeCloseTo(-10, 10);
	});

	test("a radius function receives the point and its index", () => {
		const seen: [number, number][] = [];
		buildScatterPath([at(1, 1), at(2, 2)], {
			radius: (point, index) => {
				seen.push([point.x, index]);
				return 3;
			},
			baseline: 100,
		});
		expect(seen).toEqual([
			[1, 0],
			[2, 1],
		]);
	});

	test("a gap keeps its verbs as a zero-radius shape at the baseline", () => {
		// The animation invariant again: a datum that gains a value morphs out
		// of the baseline rather than the whole series snapping.
		const path = buildScatterPath([at(10, 10), at(20, null), at(30, 30)], { radius: 4, baseline: 100 });
		expect(commands(path)).toBe("MCCCCZ".repeat(3));
		expect(path).toContain("M20,100");
	});

	test("a non-finite radius collapses the shape at its own point", () => {
		const path = buildScatterPath([at(10, 10)], { radius: () => Number.NaN, baseline: 100 });
		expect(commands(path)).toBe("MCCCCZ");
		expect(path.startsWith("M10,10")).toBe(true);
	});

	test("is empty for no points", () => {
		expect(buildScatterPath([], { radius: 4, baseline: 100 })).toBe("");
	});

	test("a horizontal gap collapses at the baseline x, keeping its category y", () => {
		const gap: ChartPoint = { x: Number.NaN, y: 40, xValue: 1, yValue: null };
		const path = buildScatterPath([gap], { radius: 4, baseline: 7, orientation: "horizontal" });
		expect(commands(path)).toBe("MCCCCZ");
		expect(path.startsWith("M7,40")).toBe(true);
	});
});
