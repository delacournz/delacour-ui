import { describe, expect, test } from "bun:test";
import { shouldResetKeyboardAnimation } from "./keyboard-animation";

describe("shouldResetKeyboardAnimation", () => {
	test("leaves a genuinely focused keyboard alone", () => {
		// The guard must never fight a real keyboard. Every open-looking state is
		// legitimate while an input holds focus, including a mid-animation one.
		for (const [progress, height] of [
			[0, 0],
			[0.5, -160],
			[1, -336],
		] as const) {
			expect(shouldResetKeyboardAnimation({ hasFocusedInput: true, height, progress })).toBe(false);
		}
	});

	test("repairs an open state with nothing focused", () => {
		expect(shouldResetKeyboardAnimation({ hasFocusedInput: false, height: -336, progress: 1 })).toBe(true);
	});

	test("repairs a half-open state, which is what an interrupted dismiss leaves behind", () => {
		expect(shouldResetKeyboardAnimation({ hasFocusedInput: false, height: -160, progress: 0.5 })).toBe(true);
	});

	test("repairs either value on its own — the two are written separately", () => {
		expect(shouldResetKeyboardAnimation({ hasFocusedInput: false, height: 0, progress: 1 })).toBe(true);
		expect(shouldResetKeyboardAnimation({ hasFocusedInput: false, height: -336, progress: 0 })).toBe(true);
	});

	test("is a no-op on an already-closed state, so mounting never schedules a pointless write", () => {
		expect(shouldResetKeyboardAnimation({ hasFocusedInput: false, height: 0, progress: 0 })).toBe(false);
	});
});
