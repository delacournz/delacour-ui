import { describe, expect, test } from "bun:test";
import { chooseMorphStrategy } from "./morph-strategy";

describe("chooseMorphStrategy", () => {
	test("does nothing when the counts already match", () => {
		expect(chooseMorphStrategy([0, 1, 2], [0, 1, 2])).toBe("none");
		expect(chooseMorphStrategy([0, 1, 2], [9, 8, 7])).toBe("none");
	});

	test("pads the end when points were appended — the streaming case", () => {
		expect(chooseMorphStrategy([0, 1, 2], [0, 1, 2, 3, 4])).toBe("pad-end");
	});

	test("pads the end when points were dropped from the end", () => {
		expect(chooseMorphStrategy([0, 1, 2, 3, 4], [0, 1, 2])).toBe("pad-end");
	});

	test("pads the start when the head was dropped — a rolling window", () => {
		expect(chooseMorphStrategy([0, 1, 2, 3, 4], [2, 3, 4])).toBe("pad-start");
	});

	test("pads the start when points were prepended", () => {
		expect(chooseMorphStrategy([2, 3, 4], [0, 1, 2, 3, 4])).toBe("pad-start");
	});

	test("resamples when the two series are not versions of each other", () => {
		expect(chooseMorphStrategy([0, 1, 2], [10, 20, 30, 40])).toBe("resample");
	});

	test("resamples when either series is empty", () => {
		expect(chooseMorphStrategy([], [0, 1])).toBe("resample");
		expect(chooseMorphStrategy([0, 1], [])).toBe("resample");
	});

	test("tolerates floating-point drift in the x values", () => {
		expect(chooseMorphStrategy([0, 1, 2], [1e-9, 1 + 1e-9, 2, 3])).toBe("pad-end");
	});
});
