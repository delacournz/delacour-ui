import { describe, expect, test } from "bun:test";
import { groupLayout, resolveBand } from "./band";

describe("resolveBand", () => {
	test("the step is the smallest gap between neighbouring positions", () => {
		expect(resolveBand({ xPositions: [0, 50, 100, 150], plotWidth: 200 }).step).toBe(50);
		expect(resolveBand({ xPositions: [0, 50, 75, 150], plotWidth: 200 }).step).toBe(25);
	});

	test("the bandwidth is the step less the inner padding", () => {
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100 }).bandwidth).toBe(40);
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, innerPadding: 0.5 }).bandwidth).toBe(25);
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, innerPadding: 0 }).bandwidth).toBe(50);
	});

	test("a bar count divides the plot instead of measuring the positions", () => {
		// The way to keep bars the same width across charts with different row counts.
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, barCount: 10 }).step).toBe(10);
	});

	test("an explicit bar width wins over the padding", () => {
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, barWidth: 12 }).bandwidth).toBe(12);
	});

	test("clamps the inner padding to [0, 1) so a bar never inverts or vanishes", () => {
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, innerPadding: 1 }).bandwidth).toBeGreaterThan(0);
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, innerPadding: -1 }).bandwidth).toBe(50);
		expect(resolveBand({ xPositions: [0, 50], plotWidth: 100, innerPadding: Number.NaN }).bandwidth).toBe(40);
	});

	test("a lone bar takes the whole plot as its step", () => {
		expect(resolveBand({ xPositions: [50], plotWidth: 100 }).step).toBe(100);
		expect(resolveBand({ xPositions: [], plotWidth: 100 }).step).toBe(100);
	});

	test("ignores non-finite positions and duplicates", () => {
		expect(resolveBand({ xPositions: [0, 0, Number.NaN, 50], plotWidth: 100 }).step).toBe(50);
	});

	test("a collapsed plot yields zero, never NaN", () => {
		const band = resolveBand({ xPositions: [], plotWidth: 0 });
		expect(band.step).toBe(0);
		expect(band.bandwidth).toBe(0);
	});
});

describe("groupLayout", () => {
	test("splits the group's share of the step evenly, centred on the datum", () => {
		const layout = groupLayout({ step: 100, seriesCount: 2, betweenGroupPadding: 0.2, withinGroupPadding: 0 });
		// 80 for the group, 40 per slot, centres at ±20.
		expect(layout.bandwidth).toBe(40);
		expect(layout.offsets).toEqual([-20, 20]);
	});

	test("offsets are symmetric about zero for an odd count too", () => {
		const layout = groupLayout({ step: 100, seriesCount: 3, betweenGroupPadding: 0.1, withinGroupPadding: 0 });
		expect(layout.offsets).toEqual([-30, 0, 30]);
	});

	test("within-group padding narrows each bar but not its slot", () => {
		const layout = groupLayout({ step: 100, seriesCount: 2, betweenGroupPadding: 0.2, withinGroupPadding: 0.5 });
		expect(layout.bandwidth).toBe(20);
		expect(layout.offsets).toEqual([-20, 20]);
	});

	test("an explicit bar width wins over the padding", () => {
		expect(groupLayout({ step: 100, seriesCount: 2, barWidth: 7 }).bandwidth).toBe(7);
	});

	test("defaults both paddings to a fifth", () => {
		const layout = groupLayout({ step: 100, seriesCount: 1 });
		expect(layout.bandwidth).toBe(64);
		expect(layout.offsets).toEqual([0]);
	});

	test("no series is no offsets and no width", () => {
		expect(groupLayout({ step: 100, seriesCount: 0 })).toEqual({ bandwidth: 0, offsets: [] });
	});
});
