import { describe, expect, test } from "bun:test";
import {
	resolveFadeBand,
	resolveFadeEdges,
	resolveFadeGradient,
	resolveKeyboardLift,
	SCROLL_EDGES,
	type ScrollEdges,
} from "./scroll-edges";

describe("resolveFadeEdges", () => {
	const EXPECTED: Record<ScrollEdges, { start: boolean; end: boolean }> = {
		both: { start: true, end: true },
		start: { start: true, end: false },
		end: { start: false, end: true },
		none: { start: false, end: false },
	};

	for (const edges of SCROLL_EDGES) {
		test(`${edges} draws ${JSON.stringify(EXPECTED[edges])}`, () => {
			expect(resolveFadeEdges(edges)).toEqual(EXPECTED[edges]);
		});
	}
});

describe("resolveFadeBand", () => {
	test("a vertical start band holds its inset from the top", () => {
		expect(resolveFadeBand({ orientation: "vertical", edge: "start", size: 48, inset: 10 })).toStrictEqual({
			top: 10,
			height: 48,
		});
	});

	test("a vertical end band sits on the bottom", () => {
		expect(resolveFadeBand({ orientation: "vertical", edge: "end", size: 48, inset: 0 })).toStrictEqual({
			bottom: 0,
			height: 48,
		});
	});

	test("a horizontal start band sits on the left", () => {
		expect(resolveFadeBand({ orientation: "horizontal", edge: "start", size: 48, inset: 0 })).toStrictEqual({
			left: 0,
			width: 48,
		});
	});

	test("a horizontal end band holds its inset from the right", () => {
		expect(resolveFadeBand({ orientation: "horizontal", edge: "end", size: 48, inset: 6 })).toStrictEqual({
			right: 6,
			width: 48,
		});
	});
});

describe("resolveFadeGradient", () => {
	test("vertical start runs top to bottom", () => {
		expect(resolveFadeGradient({ orientation: "vertical", edge: "start" })).toEqual({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
		});
	});

	test("vertical end runs bottom to top", () => {
		expect(resolveFadeGradient({ orientation: "vertical", edge: "end" })).toEqual({
			start: { x: 0, y: 1 },
			end: { x: 0, y: 0 },
		});
	});

	test("horizontal start runs left to right", () => {
		expect(resolveFadeGradient({ orientation: "horizontal", edge: "start" })).toEqual({
			start: { x: 0, y: 0 },
			end: { x: 1, y: 0 },
		});
	});

	test("horizontal end runs right to left", () => {
		expect(resolveFadeGradient({ orientation: "horizontal", edge: "end" })).toEqual({
			start: { x: 1, y: 0 },
			end: { x: 0, y: 0 },
		});
	});
});

describe("resolveKeyboardLift", () => {
	const open = { orientation: "vertical", edge: "end", safeAreaBottom: 34 } as const;

	test("lifts a vertical end band by the keyboard less the safe-area band it covers", () => {
		expect(resolveKeyboardLift({ ...open, keyboardHeight: 336 })).toBe(302);
	});

	test("reads keyboard-controller's negative height the same as a positive one", () => {
		expect(resolveKeyboardLift({ ...open, keyboardHeight: -336 })).toBe(302);
	});

	test("does not lift with the keyboard closed", () => {
		expect(resolveKeyboardLift({ ...open, keyboardHeight: 0 })).toBe(0);
	});

	test("never lifts below zero while the keyboard is shorter than the safe area", () => {
		expect(resolveKeyboardLift({ ...open, keyboardHeight: 20 })).toBe(0);
	});

	test("leaves a start band in place", () => {
		expect(resolveKeyboardLift({ ...open, edge: "start", keyboardHeight: 336 })).toBe(0);
	});

	test("leaves a horizontal band in place", () => {
		expect(resolveKeyboardLift({ ...open, orientation: "horizontal", keyboardHeight: 336 })).toBe(0);
	});
});
