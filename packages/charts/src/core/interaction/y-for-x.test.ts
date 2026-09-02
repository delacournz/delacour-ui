import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildLinePath } from "../curve/build-line";
import { toCurvePath } from "./path-segments";
import { getYForX } from "./y-for-x";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

/**
 * The analytic cubic root, as an oracle.
 *
 * This is the implementation `getYForX` deliberately does not ship — it is
 * three functions calling each other, which the flat-worklet rule forbids. It
 * lives here so bisection has something exact to be checked against.
 */
function cuberoot(x: number): number {
	const y = Math.abs(x) ** (1 / 3);
	return x < 0 ? -y : y;
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
	if (Math.abs(a) < 1e-8) {
		if (Math.abs(b) < 1e-8) return Math.abs(c) < 1e-8 ? [] : [-d / c];
		const disc = c * c - 4 * b * d;
		if (disc < 0) return [];
		return [(-c + Math.sqrt(disc)) / (2 * b), (-c - Math.sqrt(disc)) / (2 * b)];
	}
	const p = (3 * a * c - b * b) / (3 * a * a);
	const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
	let roots: number[];
	if (Math.abs(p) < 1e-12) roots = [cuberoot(-q)];
	else if (Math.abs(q) < 1e-12) roots = p < 0 ? [0, Math.sqrt(-p), -Math.sqrt(-p)] : [0];
	else {
		const disc = (q * q) / 4 + (p * p * p) / 27;
		if (Math.abs(disc) < 1e-12) roots = [(-1.5 * q) / p, (3 * q) / p];
		else if (disc > 0) {
			const u = cuberoot(-q / 2 - Math.sqrt(disc));
			roots = [u - p / (3 * u)];
		} else {
			const u = 2 * Math.sqrt(-p / 3);
			const t = Math.acos(((3 * q) / p / u) * 1) / 3;
			const k = (2 * Math.PI) / 3;
			roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
		}
	}
	return roots.map((root) => root - b / (3 * a));
}

function bezier(p0: number, c1: number, c2: number, p1: number, t: number): number {
	const mt = 1 - t;
	return mt * mt * mt * p0 + 3 * mt * mt * t * c1 + 3 * mt * t * t * c2 + t * t * t * p1;
}

/** `y` at `x` on one cubic, solved exactly. */
function oracleY(run: readonly number[], x: number): number {
	const [p0x, p0y, c1x, c1y, c2x, c2y, p1x, p1y] = run as number[];
	const a = -(p0x as number) + 3 * (c1x as number) - 3 * (c2x as number) + (p1x as number);
	const b = 3 * (p0x as number) - 6 * (c1x as number) + 3 * (c2x as number);
	const c = -3 * (p0x as number) + 3 * (c1x as number);
	const d = (p0x as number) - x;
	for (const root of solveCubic(a, b, c, d)) {
		if (root >= -1e-9 && root <= 1 + 1e-9) {
			return bezier(p0y as number, c1y as number, c2y as number, p1y as number, Math.min(1, Math.max(0, root)));
		}
	}
	return Number.NaN;
}

describe("getYForX", () => {
	test("rides a straight line exactly", () => {
		const path = toCurvePath(buildLinePath([at(0, 0), at(100, 100)]));
		expect(getYForX(path, 25)).toBeCloseTo(25, 6);
		expect(getYForX(path, 73.5)).toBeCloseTo(73.5, 6);
	});

	test("passes through every data point on an interpolating curve", () => {
		const points = [at(0, 40), at(50, 10), at(100, 90), at(150, 30)];
		const path = toCurvePath(buildLinePath(points, { curve: "monotone" }));
		for (const point of points) {
			expect(getYForX(path, point.x)).toBeCloseTo(point.y as number, 6);
		}
	});

	test("clamps to the ends outside the path", () => {
		const path = toCurvePath(buildLinePath([at(10, 5), at(90, 45)]));
		expect(getYForX(path, -50)).toBe(5);
		expect(getYForX(path, 500)).toBe(45);
	});

	test("returns NaN inside a gap so the caller can fall back to a datum", () => {
		const path = toCurvePath(buildLinePath([at(0, 1), at(10, 2), at(20, null), at(30, 4), at(40, 5)]));
		expect(getYForX(path, 20)).toBeNaN();
		expect(Number.isFinite(getYForX(path, 5))).toBe(true);
		expect(Number.isFinite(getYForX(path, 35))).toBe(true);
	});

	test("degenerates safely", () => {
		expect(getYForX([], 5)).toBeNaN();
		expect(getYForX(toCurvePath(buildLinePath([at(0, 1)])), 0)).toBeNaN();
		expect(getYForX(toCurvePath(buildLinePath([at(0, 0), at(10, 10)])), Number.NaN)).toBeNaN();
	});

	test("resolves a vertical step segment to the value after the step", () => {
		const path = toCurvePath(buildLinePath([at(0, 0), at(10, 100)], { curve: "stepBefore" }));
		expect(Number.isFinite(getYForX(path, 0))).toBe(true);
		expect(getYForX(path, 10)).toBeCloseTo(100, 6);
	});

	test("agrees with the analytic solver across a thousand random curves", () => {
		let checked = 0;
		let seed = 20260902;
		const random = (): number => {
			seed = (seed * 1103515245 + 12345) % 2147483648;
			return seed / 2147483648;
		};

		for (let trial = 0; trial < 1000; trial += 1) {
			const points = Array.from({ length: 5 }, (_, index) => at(index * 40, random() * 200));
			const path = toCurvePath(buildLinePath(points, { curve: "monotone" }));
			const x = random() * 160;
			const actual = getYForX(path, x);
			if (!Number.isFinite(actual)) continue;

			const run = path[0] as readonly number[];
			const segment = Math.min(Math.floor(x / 40), (run.length - 2) / 6 - 1);
			const expected = oracleY(run.slice(segment * 6, segment * 6 + 8), x);
			if (!Number.isFinite(expected)) continue;

			expect(actual).toBeCloseTo(expected, 6);
			checked += 1;
		}

		expect(checked).toBeGreaterThan(800);
	});
});
