import { describe, expect, test } from "bun:test";
import { invertValue, scaleValue } from "./scale";
import type { ScaleDescriptor } from "./scale.types";

const linear: ScaleDescriptor = { kind: "linear", domain: [0, 100], range: [0, 300] };
const flipped: ScaleDescriptor = { kind: "linear", domain: [0, 100], range: [300, 0] };
const log: ScaleDescriptor = { kind: "log", domain: [1, 1000], range: [0, 300], base: 10 };

describe("scaleValue", () => {
	test("maps the domain onto the range", () => {
		expect(scaleValue(linear, 0)).toBe(0);
		expect(scaleValue(linear, 50)).toBe(150);
		expect(scaleValue(linear, 100)).toBe(300);
	});

	test("handles an inverted range, which is what a y axis is", () => {
		expect(scaleValue(flipped, 0)).toBe(300);
		expect(scaleValue(flipped, 100)).toBe(0);
	});

	test("extrapolates outside the domain rather than clamping", () => {
		// Clamping here would silently flatten an out-of-viewport point onto the
		// axis. Clipping is the renderer's job, not the scale's.
		expect(scaleValue(linear, 150)).toBe(450);
		expect(scaleValue(linear, -50)).toBe(-150);
	});

	test("returns the range midpoint for a zero-width domain", () => {
		const point: ScaleDescriptor = { kind: "linear", domain: [7, 7], range: [0, 300] };
		expect(scaleValue(point, 7)).toBe(150);
		expect(scaleValue(point, 999)).toBe(150);
	});

	test("places log decades evenly", () => {
		expect(scaleValue(log, 1)).toBeCloseTo(0, 9);
		expect(scaleValue(log, 10)).toBeCloseTo(100, 9);
		expect(scaleValue(log, 100)).toBeCloseTo(200, 9);
		expect(scaleValue(log, 1000)).toBeCloseTo(300, 9);
	});

	test("never returns NaN for a non-positive value on a log scale", () => {
		expect(Number.isFinite(scaleValue(log, 0))).toBe(true);
		expect(Number.isFinite(scaleValue(log, -5))).toBe(true);
	});

	test("returns the midpoint for a log scale whose domain reaches zero", () => {
		const broken: ScaleDescriptor = { kind: "log", domain: [0, 100], range: [0, 300], base: 10 };
		expect(scaleValue(broken, 10)).toBe(150);
	});

	test("reads a time domain as epoch milliseconds", () => {
		const day = 86_400_000;
		const time: ScaleDescriptor = { kind: "time", domain: [0, day], range: [0, 240] };
		expect(scaleValue(time, day / 2)).toBe(120);
	});
});

describe("invertValue", () => {
	test("round-trips every kind", () => {
		for (const scale of [linear, flipped, log]) {
			for (const value of [1, 2, 17, 99]) {
				expect(invertValue(scale, scaleValue(scale, value))).toBeCloseTo(value, 6);
			}
		}
	});

	test("returns the domain start for a zero-width range", () => {
		const collapsed: ScaleDescriptor = { kind: "linear", domain: [4, 9], range: [12, 12] };
		expect(invertValue(collapsed, 12)).toBe(4);
	});

	test("stays finite on a log scale whose domain reaches zero", () => {
		const broken: ScaleDescriptor = { kind: "log", domain: [0, 100], range: [0, 300], base: 10 };
		expect(Number.isFinite(invertValue(broken, 150))).toBe(true);
	});
});
