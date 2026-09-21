import { describe, expect, test } from "bun:test";
import { closestIndex } from "./closest-index";

const xs = [0, 10, 20, 30, 40];

describe("closestIndex", () => {
	test("finds an exact hit", () => {
		expect(closestIndex(xs, 20)).toBe(2);
	});

	test("picks the nearer neighbour", () => {
		expect(closestIndex(xs, 21)).toBe(2);
		expect(closestIndex(xs, 29)).toBe(3);
	});

	test("clamps outside the range", () => {
		expect(closestIndex(xs, -100)).toBe(0);
		expect(closestIndex(xs, 1000)).toBe(4);
	});

	test("degenerates safely", () => {
		expect(closestIndex([], 5)).toBe(-1);
		expect(closestIndex([7], 1000)).toBe(0);
	});

	test("agrees with a linear scan over a large series", () => {
		const many = Array.from({ length: 500 }, (_, index) => index * 3);
		for (const probe of [0, 1, 2, 700, 748, 749.9, 1497]) {
			let best = 0;
			for (let index = 1; index < many.length; index += 1) {
				if (Math.abs((many[index] as number) - probe) < Math.abs((many[best] as number) - probe)) best = index;
			}
			expect(closestIndex(many, probe)).toBe(best);
		}
	});
});
