import { describe, expect, test } from "bun:test";
import { readScrollEvent, type ScrollEdge, scrollEdgeOpacity, scrollProgress } from "./scroll-maths";

type EdgeCase = {
	edge: ScrollEdge;
	offset: number;
	contentSize: number;
	layoutSize: number;
	fadeInDistance: number;
	expected: number;
	why: string;
};

const EDGE_CASES: readonly EdgeCase[] = [
	{ edge: "start", offset: 0, contentSize: 1000, layoutSize: 600, fadeInDistance: 24, expected: 0, why: "at rest" },
	{
		edge: "start",
		offset: 12,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 24,
		expected: 0.5,
		why: "halfway in",
	},
	{ edge: "start", offset: 100, contentSize: 1000, layoutSize: 600, fadeInDistance: 24, expected: 1, why: "fully in" },
	{
		edge: "start",
		offset: -30,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 24,
		expected: 0,
		why: "rubber-banding past the start",
	},
	{ edge: "end", offset: 0, contentSize: 1000, layoutSize: 600, fadeInDistance: 24, expected: 1, why: "at rest" },
	{
		edge: "end",
		offset: 388,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 24,
		expected: 0.5,
		why: "halfway out",
	},
	{ edge: "end", offset: 400, contentSize: 1000, layoutSize: 600, fadeInDistance: 24, expected: 0, why: "at the end" },
	{
		edge: "end",
		offset: 430,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 24,
		expected: 0,
		why: "bouncing past the end",
	},
	{
		edge: "start",
		offset: 50,
		contentSize: 300,
		layoutSize: 600,
		fadeInDistance: 24,
		expected: 0,
		why: "short content",
	},
	{ edge: "end", offset: 50, contentSize: 300, layoutSize: 600, fadeInDistance: 24, expected: 0, why: "short content" },
	{ edge: "start", offset: 0, contentSize: 0, layoutSize: 0, fadeInDistance: 24, expected: 0, why: "unmeasured" },
	{ edge: "end", offset: 0, contentSize: 0, layoutSize: 0, fadeInDistance: 24, expected: 1, why: "unmeasured" },
	{
		edge: "start",
		offset: 0.5,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 0,
		expected: 1,
		why: "a step, moved",
	},
	{
		edge: "start",
		offset: 0,
		contentSize: 1000,
		layoutSize: 600,
		fadeInDistance: 0,
		expected: 0,
		why: "a step, at rest",
	},
];

describe("scrollEdgeOpacity", () => {
	for (const { expected, why, ...state } of EDGE_CASES) {
		test(`${state.edge} at ${state.offset} (${why}) is ${expected}`, () => {
			expect(scrollEdgeOpacity(state)).toBeCloseTo(expected, 6);
		});
	}

	// A Screen's source only learns its sizes from a scroll event, so a tall
	// list must show its end fade at rest — while the start still follows the
	// finger, since the offset is real even before the sizes are.
	test("an unmeasured start still follows the offset", () => {
		expect(scrollEdgeOpacity({ edge: "start", offset: 12, contentSize: 0, layoutSize: 0, fadeInDistance: 24 })).toBe(
			0.5
		);
		expect(scrollEdgeOpacity({ edge: "end", offset: 12, contentSize: 800, layoutSize: 0, fadeInDistance: 24 })).toBe(1);
	});

	test("a step at the end is in until the last point", () => {
		const base = { edge: "end", contentSize: 1000, layoutSize: 600, fadeInDistance: 0 } as const;
		expect(scrollEdgeOpacity({ ...base, offset: 399.5 })).toBe(1);
		expect(scrollEdgeOpacity({ ...base, offset: 400 })).toBe(0);
	});

	test("content exactly the viewport's size fades neither edge", () => {
		const base = { offset: 0, contentSize: 600, layoutSize: 600, fadeInDistance: 24 } as const;
		expect(scrollEdgeOpacity({ ...base, edge: "start" })).toBe(0);
		expect(scrollEdgeOpacity({ ...base, edge: "end" })).toBe(0);
	});
});

describe("scrollProgress", () => {
	test.each([
		[5, 0, 10, 0.5],
		[-5, 0, 10, 0],
		[15, 0, 10, 1],
		[3, 10, 0, 0.7],
		[5, 5, 5, 1],
		[4, 5, 5, 0],
	])("(%p, %p, %p) is %p", (value, from, to, expected) => {
		expect(scrollProgress(value, from, to)).toBeCloseTo(expected, 6);
	});
});

describe("readScrollEvent", () => {
	const event = {
		contentOffset: { x: 30, y: -12 },
		contentSize: { width: 900, height: 1400 },
		layoutMeasurement: { width: 390, height: 700 },
	};

	test("reads y and heights on a vertical scroller", () => {
		expect(readScrollEvent(event, "vertical")).toEqual({ offset: -12, contentSize: 1400, layoutSize: 700 });
	});

	test("reads x and widths on a horizontal scroller", () => {
		expect(readScrollEvent(event, "horizontal")).toEqual({ offset: 30, contentSize: 900, layoutSize: 390 });
	});

	test("passes a negative offset through", () => {
		const bounce = { ...event, contentOffset: { x: -40, y: 0 } };
		expect(readScrollEvent(bounce, "horizontal").offset).toBe(-40);
	});
});

describe("scrollEdgeOpacity with a covered end", () => {
	// A 600pt frame holding 500pt of form, with 300pt of keyboard over its end.
	// KeyboardAwareScrollView makes room with a content inset, which the scroll
	// event leaves out of contentSize.
	const base = { edge: "end", contentSize: 500, layoutSize: 600, fadeInDistance: 24 } as const;

	test("clears the end of content that fits the uncovered frame", () => {
		expect(scrollEdgeOpacity({ ...base, offset: 0 })).toBe(0);
	});

	test("draws the end while content runs on under the covered band", () => {
		expect(scrollEdgeOpacity({ ...base, offset: 0, coveredEnd: 300 })).toBe(1);
	});

	test("clears the end once the last content is scrolled above the covered band", () => {
		expect(scrollEdgeOpacity({ ...base, offset: 200, coveredEnd: 300 })).toBe(0);
	});

	test("fades the end over the last fadeInDistance points above the covered band", () => {
		expect(scrollEdgeOpacity({ ...base, offset: 188, coveredEnd: 300 })).toBe(0.5);
	});

	test("leaves the start edge reading the offset alone", () => {
		expect(scrollEdgeOpacity({ ...base, edge: "start", offset: 12, coveredEnd: 300 })).toBe(0.5);
	});
});
