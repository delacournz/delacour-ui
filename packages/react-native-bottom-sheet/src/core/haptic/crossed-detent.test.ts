import { describe, expect, test } from "bun:test";
import { crossedDetent, detentUnder } from "./crossed-detent";

const detents = [200, 400, 800];

describe("detentUnder", () => {
	test("the index of the highest detent at or below the height, -1 below the first", () => {
		expect(detentUnder(100, detents)).toBe(-1);
		expect(detentUnder(200, detents)).toBe(0);
		expect(detentUnder(399, detents)).toBe(0);
		expect(detentUnder(400, detents)).toBe(1);
		expect(detentUnder(900, detents)).toBe(2);
	});

	test("a hair below a detent counts as on it, so a settled spring is not a phantom crossing", () => {
		expect(detentUnder(399.8, detents)).toBe(1);
	});

	test("with no detents nothing is ever under the sheet", () => {
		expect(detentUnder(300, [])).toBe(-1);
	});
});

describe("crossedDetent", () => {
	test("true when the drag crosses a detent in either direction", () => {
		expect(crossedDetent(0, 401, detents)).toBe(true);
		expect(crossedDetent(1, 399, detents)).toBe(true);
	});

	test("false while the drag stays between the same detents", () => {
		expect(crossedDetent(0, 250, detents)).toBe(false);
		expect(crossedDetent(0, 399, detents)).toBe(false);
	});

	test("crossing the lowest detent downward counts, so a haptic fires on the way to closed too", () => {
		expect(crossedDetent(0, 150, detents)).toBe(true);
	});

	test("a frame that skips a detent is one crossing, and detentUnder says where it landed", () => {
		expect(crossedDetent(-1, 850, detents)).toBe(true);
		expect(detentUnder(850, detents)).toBe(2);
	});
});
