import { describe, expect, test } from "bun:test";
import { crossedSnapPoint, snapPointUnder } from "./crossed-snap-point";

const snapPoints = [200, 400, 800];

describe("snapPointUnder", () => {
	test("the index of the highest snap point at or below the height, -1 below the first", () => {
		expect(snapPointUnder(100, snapPoints)).toBe(-1);
		expect(snapPointUnder(200, snapPoints)).toBe(0);
		expect(snapPointUnder(399, snapPoints)).toBe(0);
		expect(snapPointUnder(400, snapPoints)).toBe(1);
		expect(snapPointUnder(900, snapPoints)).toBe(2);
	});

	test("a hair below a snap point counts as on it, so a settled spring is not a phantom crossing", () => {
		expect(snapPointUnder(399.8, snapPoints)).toBe(1);
	});

	test("with no snap points nothing is ever under the sheet", () => {
		expect(snapPointUnder(300, [])).toBe(-1);
	});
});

describe("crossedSnapPoint", () => {
	test("true when the drag crosses a snap point in either direction", () => {
		expect(crossedSnapPoint(0, 401, snapPoints)).toBe(true);
		expect(crossedSnapPoint(1, 399, snapPoints)).toBe(true);
	});

	test("false while the drag stays between the same snap points", () => {
		expect(crossedSnapPoint(0, 250, snapPoints)).toBe(false);
		expect(crossedSnapPoint(0, 399, snapPoints)).toBe(false);
	});

	test("crossing the lowest snap point downward counts, so a haptic fires on the way to closed too", () => {
		expect(crossedSnapPoint(0, 150, snapPoints)).toBe(true);
	});

	test("a frame that skips a snap point is one crossing, and snapPointUnder says where it landed", () => {
		expect(crossedSnapPoint(-1, 850, snapPoints)).toBe(true);
		expect(snapPointUnder(850, snapPoints)).toBe(2);
	});
});
