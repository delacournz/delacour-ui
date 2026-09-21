import { describe, expect, test } from "bun:test";
import { sliceLabelPosition } from "./label-position";
import type { PieSliceData } from "./polar.types";

const slice: PieSliceData = {
	index: 0,
	label: "a",
	value: 1,
	fraction: 0.25,
	startAngle: 0,
	endAngle: 90,
	sweepAngle: 90,
	center: { x: 100, y: 100 },
	radius: 80,
	innerRadius: 40,
	sliceIsEntireCircle: false,
};

describe("sliceLabelPosition", () => {
	test("sits on the slice's bisector, halfway across the annulus by default", () => {
		const point = sliceLabelPosition(slice);
		// 45°, at radius 60.
		expect(point.x).toBeCloseTo(100 + 60 * Math.SQRT1_2);
		expect(point.y).toBeCloseTo(100 - 60 * Math.SQRT1_2);
	});

	test("0 is the inner edge and 1 the outer", () => {
		expect(Math.hypot(sliceLabelPosition(slice, 0).x - 100, sliceLabelPosition(slice, 0).y - 100)).toBeCloseTo(40);
		expect(Math.hypot(sliceLabelPosition(slice, 1).x - 100, sliceLabelPosition(slice, 1).y - 100)).toBeCloseTo(80);
	});

	test("more than 1 sits outside the circle", () => {
		const point = sliceLabelPosition(slice, 1.25);
		expect(Math.hypot(point.x - 100, point.y - 100)).toBeCloseTo(90);
	});

	test("a pie with no hole measures from the centre", () => {
		const point = sliceLabelPosition({ ...slice, innerRadius: 0 }, 0.5);
		expect(Math.hypot(point.x - 100, point.y - 100)).toBeCloseTo(40);
	});
});
