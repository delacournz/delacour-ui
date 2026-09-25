import { describe, expect, test } from "bun:test";
import { positionFor } from "./position";

describe("positionFor", () => {
	test("a closed attached sheet sits at the container's bottom edge", () => {
		expect(positionFor(800, 0, 0)).toBe(800);
	});

	test("height is measured up from the resting bottom line", () => {
		expect(positionFor(800, 0, 300)).toBe(500);
		expect(positionFor(800, 32, 300)).toBe(468);
	});

	test("a detached sheet closed is fully off-screen, resting line included", () => {
		expect(positionFor(800, 32, -32)).toBe(800);
	});

	test("filling the available height puts the top at zero", () => {
		expect(positionFor(800, 32, 768)).toBe(0);
	});
});
