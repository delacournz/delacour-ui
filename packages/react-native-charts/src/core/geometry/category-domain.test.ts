import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import type { ScaleDescriptor } from "../scale/scale.types";
import { categoryDomainCovers } from "./category-domain";

const at = (xValue: number): ChartPoint => ({ x: 0, y: 0, xValue, yValue: 1 });
const linear = (domain: readonly [number, number]): ScaleDescriptor => ({ kind: "linear", domain, range: [0, 100] });

describe("categoryDomainCovers", () => {
	test("holds when the domain reaches half a step past the outermost categories", () => {
		expect(categoryDomainCovers([at(0), at(1), at(2)], linear([-0.5, 2.5]), 1)).toBe(true);
		expect(categoryDomainCovers([at(0), at(1), at(2)], linear([-1, 3]), 1)).toBe(true);
	});

	test("fails when a bar would straddle the plot's edge", () => {
		expect(categoryDomainCovers([at(0), at(1), at(2)], linear([0, 2]), 1)).toBe(false);
		expect(categoryDomainCovers([at(0), at(1), at(2)], linear([-0.5, 2]), 1)).toBe(false);
	});

	test("reads the categories from xValue, which is the category whichever axis it lies on", () => {
		// A horizontal point has its value on x and its category on y; xValue is still the category.
		const horizontal: ChartPoint[] = [
			{ x: 40, y: 10, xValue: 0, yValue: 4 },
			{ x: 80, y: 90, xValue: 1, yValue: 8 },
		];
		expect(categoryDomainCovers(horizontal, linear([-0.5, 1.5]), 1)).toBe(true);
		expect(categoryDomainCovers(horizontal, linear([0, 1]), 1)).toBe(false);
	});

	test("an empty series is covered — there is nothing to warn about", () => {
		expect(categoryDomainCovers([], linear([0, 1]), 1)).toBe(true);
	});
});
