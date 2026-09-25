import { describe, expect, test } from "bun:test";
import { resistOverDrag } from "./over-drag";

describe("resistOverDrag", () => {
	test("inside the range the height passes through untouched", () => {
		expect(resistOverDrag(300, 0, 800, 2.5)).toBe(300);
		expect(resistOverDrag(0, 0, 800, 2.5)).toBe(0);
		expect(resistOverDrag(800, 0, 800, 2.5)).toBe(800);
	});

	test("is continuous at the boundary", () => {
		expect(resistOverDrag(800.001, 0, 800, 2.5)).toBeCloseTo(800, 2);
		expect(resistOverDrag(-0.001, 0, 800, 2.5)).toBeCloseTo(0, 2);
	});

	test("beyond the top it is monotone and sub-linear", () => {
		let previous = 800;
		let previousGain = Number.POSITIVE_INFINITY;
		for (let over = 10; over <= 400; over += 10) {
			const value = resistOverDrag(800 + over, 0, 800, 2.5);
			expect(value).toBeGreaterThan(previous);
			expect(value - 800).toBeLessThan(over);
			const gain = value - previous;
			expect(gain).toBeLessThanOrEqual(previousGain);
			previous = value;
			previousGain = gain;
		}
	});

	test("beyond the bottom it resists symmetrically", () => {
		expect(resistOverDrag(-100, 0, 800, 2.5)).toBeCloseTo(-(resistOverDrag(900, 0, 800, 2.5) - 800));
	});

	test("a factor of zero is a hard clamp", () => {
		expect(resistOverDrag(900, 0, 800, 0)).toBe(800);
		expect(resistOverDrag(-100, 0, 800, 0)).toBe(0);
	});

	test("a larger factor gives more travel for the same over-drag", () => {
		expect(resistOverDrag(900, 0, 800, 4)).toBeGreaterThan(resistOverDrag(900, 0, 800, 2));
	});

	test("an inverted range collapses to its minimum rather than oscillating", () => {
		expect(resistOverDrag(500, 800, 200, 2.5)).toBe(800);
	});
});
