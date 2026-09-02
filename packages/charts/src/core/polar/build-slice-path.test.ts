import { describe, expect, test } from "bun:test";
import { ARC_SEGMENTS, buildSliceEdgePath, buildSlicePath } from "./build-slice-path";
import type { PieSliceData, PolarPoint } from "./polar.types";
import { polarToCartesian } from "./polar-point";

const center: PolarPoint = { x: 100, y: 100 };

function slice(sweep: number, innerRadius = 0, startAngle = 0, radius = 80): PieSliceData {
	return {
		index: 0,
		label: "",
		value: sweep,
		fraction: sweep / 360,
		startAngle,
		endAngle: startAngle + sweep,
		sweepAngle: sweep,
		center,
		radius,
		innerRadius,
		sliceIsEntireCircle: sweep === 360,
	};
}

/** The command letters of a path, which is what `isInterpolatable` compares. */
function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

/** Every number in a path, in order. */
function numbers(path: string): number[] {
	return (path.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);
}

/** The cubic segments of a path as `[p0, c1, c2, p1]` tuples, walking the current point. */
function cubics(path: string): PolarPoint[][] {
	const found: PolarPoint[][] = [];
	let current: PolarPoint = { x: 0, y: 0 };
	const tokens = path.match(/[A-Za-z][^A-Za-z]*/g) ?? [];
	for (const token of tokens) {
		const verb = token[0];
		const values = numbers(token.slice(1));
		if (verb === "M" || verb === "L") {
			current = { x: values[0] as number, y: values[1] as number };
		} else if (verb === "C") {
			const c1 = { x: values[0] as number, y: values[1] as number };
			const c2 = { x: values[2] as number, y: values[3] as number };
			const p1 = { x: values[4] as number, y: values[5] as number };
			found.push([current, c1, c2, p1]);
			current = p1;
		}
	}
	return found;
}

/** A point on a cubic Bézier at parameter `t` — the oracle. */
function bezierAt([p0, c1, c2, p1]: PolarPoint[], t: number): PolarPoint {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return {
		x: a * (p0 as PolarPoint).x + b * (c1 as PolarPoint).x + c * (c2 as PolarPoint).x + d * (p1 as PolarPoint).x,
		y: a * (p0 as PolarPoint).y + b * (c1 as PolarPoint).y + c * (c2 as PolarPoint).y + d * (p1 as PolarPoint).y,
	};
}

function distance(a: PolarPoint, b: PolarPoint): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("buildSlicePath", () => {
	test("emits four cubics per arc", () => {
		expect(ARC_SEGMENTS).toBe(4);
	});

	test("always has the same eleven verbs, whatever the sweep or the hole", () => {
		for (const sweep of [0, 1, 90, 180, 270, 360]) {
			for (const inner of [0, 40]) {
				expect(commands(buildSlicePath(slice(sweep, inner)))).toBe("MCCCCLCCCCZ");
			}
		}
	});

	test("starts at the outer start point and lines to the inner end point", () => {
		const path = buildSlicePath(slice(90, 40));
		const values = numbers(path);
		const outerStart = polarToCartesian(center, 80, 0);
		expect(values[0]).toBeCloseTo(outerStart.x, 2);
		expect(values[1]).toBeCloseTo(outerStart.y, 2);

		const segments = cubics(path);
		const outerEnd = polarToCartesian(center, 80, 90);
		expect(segments[3]?.[3]?.x).toBeCloseTo(outerEnd.x, 2);
		expect(segments[3]?.[3]?.y).toBeCloseTo(outerEnd.y, 2);

		const innerEnd = polarToCartesian(center, 40, 90);
		expect(segments[4]?.[0]?.x).toBeCloseTo(innerEnd.x, 2);
		expect(segments[4]?.[0]?.y).toBeCloseTo(innerEnd.y, 2);

		const innerStart = polarToCartesian(center, 40, 0);
		expect(segments[7]?.[3]?.x).toBeCloseTo(innerStart.x, 2);
		expect(segments[7]?.[3]?.y).toBeCloseTo(innerStart.y, 2);
	});

	test("stays within 0.05% of the radius along every arc", () => {
		for (const sweep of [30, 90, 180, 270, 360]) {
			const segments = cubics(buildSlicePath(slice(sweep, 40, 15)));
			segments.forEach((segment, index) => {
				const radius = index < ARC_SEGMENTS ? 80 : 40;
				for (let step = 0; step <= 10; step += 1) {
					const point = bezierAt(segment, step / 10);
					expect(Math.abs(distance(point, center) - radius) / radius).toBeLessThan(0.0005);
				}
			});
		}
	});

	test("a full circle with a hole closes into a ring, not a disc", () => {
		// Outer arc clockwise, inner arc counter-clockwise: opposite winding is
		// what leaves the hole empty under nonzero winding.
		const segments = cubics(buildSlicePath(slice(360, 40)));
		const outerFirst = segments[0] as PolarPoint[];
		const innerFirst = segments[4] as PolarPoint[];
		const outerEnd = bezierAt(outerFirst, 1);
		const innerEnd = bezierAt(innerFirst, 1);
		// Both arcs start at 12 o'clock. Clockwise moves right; counter-clockwise moves left.
		expect(outerEnd.x).toBeGreaterThan(center.x);
		expect(innerEnd.x).toBeLessThan(center.x);
		// And both come back to where they began.
		const lastOuter = bezierAt(segments[3] as PolarPoint[], 1);
		expect(lastOuter.x).toBeCloseTo(center.x, 2);
		expect(lastOuter.y).toBeCloseTo(center.y - 80, 2);
	});

	test("a slice at radius 0 collapses to the centre and keeps its verbs", () => {
		const path = buildSlicePath(slice(90, 0, 0, 0));
		expect(commands(path)).toBe("MCCCCLCCCCZ");
		for (const value of numbers(path)) expect(value).toBe(100);
	});

	test("emits no NaN for any degenerate input", () => {
		for (const path of [
			buildSlicePath(slice(0, 0)),
			buildSlicePath(slice(0, 40)),
			buildSlicePath(slice(Number.NaN, 0)),
			buildSlicePath({ ...slice(90), startAngle: Number.NaN }),
		]) {
			expect(path).not.toContain("NaN");
			expect(commands(path)).toBe("MCCCCLCCCCZ");
		}
	});
});

describe("buildSliceEdgePath", () => {
	test("is a single line from the inner edge to the outer edge", () => {
		const path = buildSliceEdgePath(slice(90, 40), "start");
		expect(commands(path)).toBe("ML");
		const values = numbers(path);
		expect(values[0]).toBeCloseTo(100, 2);
		expect(values[1]).toBeCloseTo(60, 2);
		expect(values[2]).toBeCloseTo(100, 2);
		expect(values[3]).toBeCloseTo(20, 2);
	});

	test("the end edge sits at the end angle", () => {
		const values = numbers(buildSliceEdgePath(slice(90, 0), "end"));
		expect(values[0]).toBeCloseTo(100, 2);
		expect(values[1]).toBeCloseTo(100, 2);
		expect(values[2]).toBeCloseTo(180, 2);
		expect(values[3]).toBeCloseTo(100, 2);
	});
});
