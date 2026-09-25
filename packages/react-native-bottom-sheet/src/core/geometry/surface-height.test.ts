import { describe, expect, test } from "bun:test";
import { surfaceHeight } from "./surface-height";

describe("surfaceHeight", () => {
	test("between the detents the surface follows the height", () => {
		expect(surfaceHeight(300, 200, 400)).toBe(300);
		expect(surfaceHeight(200, 200, 400)).toBe(200);
		expect(surfaceHeight(400, 200, 400)).toBe(400);
	});

	test("below the first detent the surface keeps the detent's height, so a close slides the card rigidly", () => {
		expect(surfaceHeight(120, 200, 400)).toBe(200);
		expect(surfaceHeight(0, 200, 400)).toBe(200);
		expect(surfaceHeight(-50, 200, 400)).toBe(200);
	});

	test("above the last detent the surface keeps the detent's height, so an over-drag lifts the card rigidly", () => {
		expect(surfaceHeight(450, 200, 400)).toBe(400);
	});

	test("one detent is a rigid card at every height", () => {
		expect(surfaceHeight(10, 320, 320)).toBe(320);
		expect(surfaceHeight(500, 320, 320)).toBe(320);
	});

	test("no detents yet: never negative, never above zero", () => {
		expect(surfaceHeight(-16, 0, 0)).toBe(0);
		expect(surfaceHeight(-16, -16, -16)).toBe(0);
	});
});
