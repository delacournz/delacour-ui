import { describe, expect, test } from "bun:test";
import type { KeyboardBehavior } from "../sheet.types";
import { keyboardInContainer, keyboardLift } from "./keyboard-lift";

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
