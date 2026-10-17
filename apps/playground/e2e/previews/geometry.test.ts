import { describe, expect, test } from "bun:test";
import { dragPath, parseBounds, toPoint, toTouchPath } from "./geometry";

describe("parseBounds", () => {
	test("reads the rect and the window out of the label", () => {
		const bounds = parseBounds(
			"preview-ready:switch/colours:dark:24,310,354,120:402x874",
			"preview-ready:switch/colours:dark:"
		);
		expect(bounds).toEqual({ height: 120, width: 354, windowHeight: 874, windowWidth: 402, x: 24, y: 310 });
	});

	test("is undefined for another demo's label, or a label with no geometry", () => {
		expect(
			parseBounds("preview-ready:switch/sizes:dark:0,0,1,1:402x874", "preview-ready:switch/colours:dark:")
		).toBeUndefined();
		expect(parseBounds("preview-ready:switch/colours:dark", "preview-ready:switch/colours:dark:")).toBeUndefined();
	});
});

describe("toTouchPath", () => {
	const window = { height: 874, width: 402 };

	test("scales fractions to points and accumulates the pauses into a timeline", () => {
		const path = toTouchPath(
			[
				{ type: "down", x: 0.5, y: 0.5 },
				{ type: "move", x: 0.5, y: 0.5, delayMs: 500 },
				{ type: "move", x: 0.75, y: 0.5, delayMs: 220 },
				{ type: "up", x: 0.75, y: 0.5, delayMs: 160 },
			],
			window
		);
		expect(path.points).toEqual([
			{ t: 0, x: 201, y: 437 },
			{ t: 500, x: 201, y: 437 },
			{ t: 720, x: 301.5, y: 437 },
			{ t: 880, x: 301.5, y: 437 },
		]);
	});

	test("ignores a pause on the down", () => {
		const path = toTouchPath(
			[
				{ type: "down", x: 0, y: 0, delayMs: 900 },
				{ type: "up", x: 0, y: 0, delayMs: 100 },
			],
			window
		);
		expect(path.points.map((p) => p.t)).toEqual([0, 100]);
	});

	test("refuses a path that does not start with a down and end with an up", () => {
		expect(() => toTouchPath([{ type: "move", x: 0, y: 0 }], window)).toThrow();
		expect(() => toTouchPath([{ type: "down", x: 0, y: 0 }], window)).toThrow();
	});
});

describe("toPoint", () => {
	test("rounds to a hundredth of a point", () => {
		expect(toPoint(1 / 3, 1 / 3, { height: 874, width: 402 })).toEqual({ x: 134, y: 291.33 });
	});
});

describe("dragPath", () => {
	const from = { x: 100, y: 400 };
	const to = { x: 100, y: 200 };

	test("eases out of the move and holds still before lifting", () => {
		const path = dragPath(from, to, { durationMs: 300, holdMs: 150 });
		const points = path.points;
		expect(points[0]).toEqual({ ...from, t: 0 });
		expect(points.at(-1)).toEqual({ ...to, t: 450 });
		expect(points.at(-2)).toEqual({ ...to, t: 300 });
		// ease-out: more than half the travel is done by half the time
		const half = points.find((p) => p.t >= 150);
		expect(half).toBeDefined();
		expect(half?.y ?? 400).toBeLessThan(300);
		// strictly monotonic in time, never past the end point
		for (let i = 1; i < points.length; i += 1) {
			const prev = points[i - 1];
			const next = points[i];
			if (!prev || !next) throw new Error("missing point");
			expect(next.t).toBeGreaterThanOrEqual(prev.t);
			expect(next.y).toBeLessThanOrEqual(prev.y);
			expect(next.y).toBeGreaterThanOrEqual(200);
		}
	});

	test("defaults to warden's 300 ms swipe and a 150 ms hold", () => {
		const path = dragPath(from, to);
		expect(path.points.at(-1)?.t).toBe(450);
	});
});
