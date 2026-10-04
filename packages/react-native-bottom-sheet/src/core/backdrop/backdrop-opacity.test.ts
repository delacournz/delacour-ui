import { describe, expect, test } from "bun:test";
import { backdropInteractive, backdropOpacity } from "./backdrop-opacity";

describe("backdropOpacity", () => {
	test("closed is transparent, the appearing index is fully opaque", () => {
		expect(backdropOpacity(-1, -1, 0, 1)).toBe(0);
		expect(backdropOpacity(0, -1, 0, 1)).toBe(1);
	});

	test("fades in between the disappearing and appearing indices", () => {
		expect(backdropOpacity(-0.5, -1, 0, 1)).toBeCloseTo(0.5);
		expect(backdropOpacity(-0.25, -1, 0, 0.6)).toBeCloseTo(0.45);
	});

	test("plateaus above the appearing index — a higher snap point is no darker", () => {
		expect(backdropOpacity(1, -1, 0, 1)).toBe(1);
		expect(backdropOpacity(2.5, -1, 0, 0.7)).toBe(0.7);
	});

	test("stays transparent up to the disappearing index when it is above closed", () => {
		expect(backdropOpacity(-1, 0, 1, 1)).toBe(0);
		expect(backdropOpacity(0, 0, 1, 1)).toBe(0);
		expect(backdropOpacity(0.5, 0, 1, 1)).toBeCloseTo(0.5);
		expect(backdropOpacity(1, 0, 1, 1)).toBe(1);
	});

	test("an appearing index at or below the disappearing one is a step, not a division by zero", () => {
		expect(backdropOpacity(-1, 0, 0, 1)).toBe(0);
		expect(backdropOpacity(0, 0, 0, 1)).toBe(1);
		expect(Number.isFinite(backdropOpacity(0, 1, 0, 1))).toBe(true);
	});

	test("an over-drag below closed never goes negative", () => {
		expect(backdropOpacity(-1.3, -1, 0, 1)).toBe(0);
	});
});

describe("backdropInteractive", () => {
	test("the backdrop takes taps once the sheet is past the index it disappears at", () => {
		expect(backdropInteractive(-1, -1)).toBe(false);
		expect(backdropInteractive(-0.5, -1)).toBe(true);
		expect(backdropInteractive(0, -1)).toBe(true);
	});

	test("with a higher disappearing index the lowest snap point leaves the app tappable", () => {
		expect(backdropInteractive(0, 0)).toBe(false);
		expect(backdropInteractive(1, 0)).toBe(true);
	});
});
