import { describe, expect, test } from "bun:test";
import type { KeyboardBehavior } from "../sheet.types";
import { keyboardCeiling, keyboardInContainer, keyboardLift } from "./keyboard-lift";

describe("keyboardInContainer", () => {
	test("keyboard-controller's height is negative; the container's share is positive", () => {
		expect(keyboardInContainer(-336, 0)).toBe(336);
	});

	test("a container ending above the window bottom is overlapped by less of the keyboard", () => {
		expect(keyboardInContainer(-336, 80)).toBe(256);
	});

	test("a container the keyboard never reaches sees zero", () => {
		expect(keyboardInContainer(-100, 200)).toBe(0);
		expect(keyboardInContainer(0, 0)).toBe(0);
	});

	test("an unmeasured offset counts as zero rather than inflating the keyboard", () => {
		expect(keyboardInContainer(-336, -1)).toBe(336);
	});
});

describe("keyboardLift", () => {
	const input = { keyboardHeight: 336, progress: 1, band: 34, gapBelow: 0 };

	test("interactive and extend lift by the keyboard less the collapsed safe-area band", () => {
		for (const behavior of ["interactive", "extend"] as const satisfies KeyboardBehavior[]) {
			expect(keyboardLift({ ...input, behavior })).toBe(336 - 34);
		}
	});

	test("the band collapses in step with the keyboard's progress", () => {
		expect(keyboardLift({ ...input, behavior: "interactive", progress: 0.5, keyboardHeight: 168 })).toBe(168 - 17);
	});

	test("fillParent and none never lift — fill grows the sheet, none ignores the keyboard", () => {
		for (const behavior of ["fillParent", "none"] as const satisfies KeyboardBehavior[]) {
			expect(keyboardLift({ ...input, behavior })).toBe(0);
		}
	});

	test("a detached sheet already floats above the bottom, so its gap comes off the lift", () => {
		expect(keyboardLift({ ...input, band: 0, gapBelow: 50, behavior: "interactive" })).toBe(336 - 50);
	});

	test("never negative — a keyboard shorter than the gap leaves the sheet alone", () => {
		expect(keyboardLift({ ...input, keyboardHeight: 20, band: 0, gapBelow: 50, behavior: "interactive" })).toBe(0);
	});

	test("no keyboard, no lift, whatever the behaviour", () => {
		expect(keyboardLift({ ...input, keyboardHeight: 0, progress: 0, behavior: "interactive" })).toBe(0);
	});
});

describe("keyboardLift under a ceiling", () => {
	const input = { keyboardHeight: 336, progress: 1, band: 0, gapBelow: 0, behavior: "interactive" as const };

	test("a short sheet lifts until its top reaches the ceiling, and no further", () => {
		expect(keyboardLift({ ...input, base: 600, ceiling: 724 })).toBe(124);
	});

	test("a sheet already at the ceiling stays where it is; the keyboard covers its bottom", () => {
		expect(keyboardLift({ ...input, base: 724, ceiling: 724 })).toBe(0);
	});

	test("a snap point above the ceiling is never pulled down — the lift is zero, not negative", () => {
		expect(keyboardLift({ ...input, base: 800, ceiling: 724 })).toBe(0);
	});

	test("a ceiling the lift never reaches changes nothing", () => {
		expect(keyboardLift({ ...input, base: 200, ceiling: 724 })).toBe(336);
	});

	test("without a ceiling the lift is the keyboard's", () => {
		expect(keyboardLift({ ...input, base: 724 })).toBe(336);
	});
});

describe("keyboardCeiling", () => {
	const capped = { limit: "maxDynamicContentSize", dynamicSizing: true, maxHeight: 852 } as const;

	test("a dynamic sheet with a cap is lifted no higher than the cap", () => {
		expect(keyboardCeiling({ ...capped, maxDynamicContentSize: 724 })).toBe(724);
	});

	test("a cap above the container changes nothing", () => {
		expect(keyboardCeiling({ ...capped, maxDynamicContentSize: 900 })).toBe(852);
	});

	test("no cap, or explicit snap points, leave the container as the ceiling", () => {
		expect(keyboardCeiling({ ...capped, maxDynamicContentSize: undefined })).toBe(852);
		expect(keyboardCeiling({ ...capped, dynamicSizing: false, maxDynamicContentSize: 724 })).toBe(852);
	});

	test("the default limit is the container, cap or no cap", () => {
		expect(keyboardCeiling({ ...capped, limit: "container", maxDynamicContentSize: 724 })).toBe(852);
	});
});
