import { describe, expect, test } from "bun:test";
import { selectSnapHeight } from "./select-snap-height";

const detents = [200, 400, 800];
const at = (height: number, velocity = 0, closedHeight: number | null = 0) =>
	selectSnapHeight({ height, velocity, detents, closedHeight, projection: 0.2 });

describe("selectSnapHeight", () => {
	test("at rest, the nearest detent wins", () => {
		expect(at(250)).toBe(200);
		expect(at(350)).toBe(400);
		expect(at(700)).toBe(800);
	});

	test("velocity projects the release point — a flick upward reaches the next detent", () => {
		expect(at(250, 1000)).toBe(400);
	});

	test("a flick downward from just above a detent falls through it", () => {
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

	test("a projection past the highest detent still lands on it", () => {
		expect(at(700, 5000)).toBe(800);
	});

	test("exactly between two detents, the lower one wins", () => {
		expect(at(300)).toBe(200);
	});

	test("with nothing to snap to, the height is left where it is", () => {
		expect(selectSnapHeight({ height: 123, velocity: 0, detents: [], closedHeight: null, projection: 0.2 })).toBe(123);
	});

	test("a NaN velocity is treated as rest rather than poisoning the target", () => {
		expect(at(350, Number.NaN)).toBe(400);
	});
});
