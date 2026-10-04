import { describe, expect, test } from "bun:test";
import { selectSnapHeight } from "./select-snap-height";

const snapPoints = [200, 400, 800];
const at = (height: number, velocity = 0, closedHeight: number | null = 0) =>
	selectSnapHeight({ height, velocity, snapPoints, closedHeight, projection: 0.2 });

describe("selectSnapHeight", () => {
	test("at rest, the nearest snap point wins", () => {
		expect(at(250)).toBe(200);
		expect(at(350)).toBe(400);
		expect(at(700)).toBe(800);
	});

	test("velocity projects the release point — a flick upward reaches the next snap point", () => {
		expect(at(250, 1000)).toBe(400);
	});

	test("a flick downward from just above a snap point falls through it", () => {
		expect(at(420, -1500)).toBe(200);
	});

	test("closes only when a closed height is offered", () => {
		expect(at(50)).toBe(0);
		expect(at(50, 0, null)).toBe(200);
	});

	test("a detached closed height is a real candidate, resting line included", () => {
		expect(at(-20, 0, -32)).toBe(-32);
	});

	test("a hard downward flick closes when it can", () => {
		expect(at(700, -4000)).toBe(0);
		expect(at(700, -4000, null)).toBe(200);
	});

	test("a projection past the highest snap point still lands on it", () => {
		expect(at(700, 5000)).toBe(800);
	});

	test("exactly between two snap points, the lower one wins", () => {
		expect(at(300)).toBe(200);
	});

	test("with nothing to snap to, the height is left where it is", () => {
		expect(selectSnapHeight({ height: 123, velocity: 0, snapPoints: [], closedHeight: null, projection: 0.2 })).toBe(
			123
		);
	});

	test("a NaN velocity is treated as rest rather than poisoning the target", () => {
		expect(at(350, Number.NaN)).toBe(400);
	});
});
