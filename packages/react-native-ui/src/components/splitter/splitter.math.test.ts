import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	clamp,
	DEFAULT_DECELERATION_RATE,
	fractionToPercent,
	nearestSnapIndex,
	percentToFraction,
	projectSnap,
	snapToStep,
} from "./splitter.math";

const SOURCE = readFileSync(join(import.meta.dirname, "splitter.math.ts"), "utf-8");

describe("the module", () => {
	// SplitView imports this file as a leaf and calls it from the UI thread. A
	// React Native import would drag the renderer into `bun test` and into every
	// worklet that closes over it.
	test("imports nothing", () => {
		expect(SOURCE).not.toMatch(/^import /m);
	});

	// A function without the directive cannot be called from a gesture callback:
	// it throws on the UI thread, and only on a device.
	test("marks every exported function as a worklet", () => {
		const bodies = SOURCE.split(/^export function /m).slice(1);
		expect(bodies.length).toBeGreaterThan(0);
		for (const body of bodies) {
			const name = body.match(/^\w+/)?.[0];
			expect({ name, worklet: /\): [^{]+\{\n\t"worklet";/.test(body) }).toEqual({ name, worklet: true });
		}
	});
});

describe("clamp", () => {
	test("holds a value inside its bounds", () => {
		expect(clamp(5, 10, 20)).toBe(10);
		expect(clamp(15, 10, 20)).toBe(15);
		expect(clamp(25, 10, 20)).toBe(20);
	});

	test("reads NaN as the floor", () => {
		expect(clamp(Number.NaN, 0, 1)).toBe(0);
	});
});

describe("snapToStep", () => {
	test("rounds to the nearest step", () => {
		expect(snapToStep(37, 5)).toBe(35);
		expect(snapToStep(38, 5)).toBe(40);
	});

	test("rounds half up", () => {
		expect(snapToStep(37.5, 5)).toBe(40);
	});

	test("treats a step of zero as continuous", () => {
		expect(snapToStep(12, 0)).toBe(12);
		expect(snapToStep(12, -5)).toBe(12);
	});

	// 0.1 * 3 is 0.30000000000000004 — a step grid that leaks that into a layout
	// shows up as "30.000000000000004 percent" in a screen reader.
	test("does not leak float noise from a fractional step", () => {
		expect(snapToStep(0.31, 0.1)).toBe(0.3);
	});
});

describe("percentToFraction and fractionToPercent", () => {
	test("convert one to the other", () => {
		expect(percentToFraction(35)).toBe(0.35);
		expect(fractionToPercent(0.35)).toBeCloseTo(35, 9);
	});

	test("round-trip to identity", () => {
		for (const percent of [0, 12.5, 33.333, 50, 99.9, 100]) {
			expect(Math.abs(fractionToPercent(percentToFraction(percent)) - percent)).toBeLessThan(1e-9);
		}
	});
});

describe("nearestSnapIndex", () => {
	const points = [0, 0.5, 1];

	test("picks the closest point", () => {
		expect(nearestSnapIndex(0.4, points)).toBe(1);
		expect(nearestSnapIndex(0.24, points)).toBe(0);
		expect(nearestSnapIndex(0.9, points)).toBe(2);
	});

	test("breaks a tie toward the lower point", () => {
		expect(nearestSnapIndex(0.25, points)).toBe(0);
	});

	test("answers -1 when there is nothing to snap to", () => {
		expect(nearestSnapIndex(0.5, [])).toBe(-1);
	});
});

describe("projectSnap", () => {
	const points = [0, 0.5, 1];

	test("settles a slow release on the nearest point", () => {
		expect(projectSnap({ points, position: 0.52, velocity: 0 })).toBe(1);
		expect(projectSnap({ points, position: 0.45, velocity: 0 })).toBe(1);
	});

	test("carries a fast release past the nearest point", () => {
		expect(projectSnap({ points, position: 0.45, velocity: 2 })).toBe(2);
		expect(projectSnap({ points, position: 0.55, velocity: -2 })).toBe(0);
	});

	test("never answers outside the points", () => {
		for (const velocity of [-1000, -5, 0, 5, 1000]) {
			for (const position of [-3, 0, 0.5, 1, 4]) {
				const index = projectSnap({ points, position, velocity });
				expect(index).toBeGreaterThanOrEqual(0);
				expect(index).toBeLessThanOrEqual(points.length - 1);
			}
		}
	});

	test("projects further on a slower deceleration", () => {
		const fast = projectSnap({ decelerationRate: 0.99, points, position: 0.3, velocity: 1 });
		const slow = projectSnap({ decelerationRate: 0.998, points, position: 0.3, velocity: 1 });
		expect(fast).toBe(1);
		expect(slow).toBe(2);
	});

	test("defaults to a scroll view's normal deceleration", () => {
		expect(DEFAULT_DECELERATION_RATE).toBe(0.998);
	});
});
