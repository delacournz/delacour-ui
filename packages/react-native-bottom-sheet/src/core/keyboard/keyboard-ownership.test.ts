import { describe, expect, test } from "bun:test";
import { resolveKeyboardOwner } from "./keyboard-ownership";

const idle = {
	registeredFocused: false,
	inputInside: false,
	inputFocused: false,
	progress: 0,
	previousOwned: false,
} as const;

describe("resolveKeyboardOwner", () => {
	test("registered scope counts only a registered input", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "registered", registeredFocused: true })).toBe(true);
		expect(resolveKeyboardOwner({ ...idle, scope: "registered", inputInside: true })).toBe(false);
	});

	test("inside scope counts a registered input or one whose frame lies in the sheet", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "inside", registeredFocused: true })).toBe(true);
		expect(resolveKeyboardOwner({ ...idle, scope: "inside", inputInside: true })).toBe(true);
		expect(resolveKeyboardOwner({ ...idle, scope: "inside" })).toBe(false);
	});

	test("always scope claims every keyboard, focused input or not", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "always" })).toBe(true);
		expect(resolveKeyboardOwner({ ...idle, scope: "always", progress: 1 })).toBe(true);
	});

	// Risk 2: the focused-input layout can lag `progress` by a frame, and it
	// goes null before a hide finishes. Once owned, the keyboard stays owned
	// until it is fully down.
	test("an owned keyboard stays owned for the rest of its transition after the candidate goes away", () => {
		for (const progress of [1, 0.6, 0.01]) {
			expect(resolveKeyboardOwner({ ...idle, scope: "inside", progress, previousOwned: true })).toBe(true);
			expect(resolveKeyboardOwner({ ...idle, scope: "registered", progress, previousOwned: true })).toBe(true);
		}
	});

	test("ownership is released once the keyboard is down and nothing claims it", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "inside", progress: 0, previousOwned: true })).toBe(false);
	});

	test("a candidate claims a keyboard that is already up — focus moved from the screen into the sheet", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "inside", progress: 1, inputInside: true })).toBe(true);
	});

	test("focus moving to a field outside the sheet releases the keyboard while it is still up", () => {
		expect(
			resolveKeyboardOwner({ ...idle, scope: "inside", progress: 1, previousOwned: true, inputFocused: true })
		).toBe(false);
	});

	test("under registered scope an unregistered field inside the sheet is someone else's too", () => {
		expect(
			resolveKeyboardOwner({
				...idle,
				scope: "registered",
				progress: 1,
				previousOwned: true,
				inputFocused: true,
				inputInside: true,
			})
		).toBe(false);
	});

	test("a keyboard never owned is not claimed mid-transition by stickiness alone", () => {
		expect(resolveKeyboardOwner({ ...idle, scope: "inside", progress: 0.5 })).toBe(false);
	});
});
