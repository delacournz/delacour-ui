import { describe, expect, test } from "bun:test";
import { acceptContainerLayout } from "./container-layout-guard";

describe("acceptContainerLayout", () => {
	test("the first measurement is always accepted", () => {
		expect(acceptContainerLayout({ prev: -1, next: 800, keyboardHeight: 336, progress: 1 })).toBe(true);
	});

	test("growth is always accepted", () => {
		expect(acceptContainerLayout({ prev: 800, next: 900, keyboardHeight: 336, progress: 1 })).toBe(true);
	});

	test("a shrink with no keyboard in play is a real resize", () => {
		expect(acceptContainerLayout({ prev: 800, next: 600, keyboardHeight: 0, progress: 0 })).toBe(true);
	});

	test("a shrink by the keyboard's height while it is up is adjustResize double-counting, and is refused", () => {
		expect(acceptContainerLayout({ prev: 800, next: 464, keyboardHeight: 336, progress: 1 })).toBe(false);
	});

	test("a shrink smaller than the keyboard mid-animation is refused too — the frame is chasing the keyboard", () => {
		expect(acceptContainerLayout({ prev: 800, next: 700, keyboardHeight: 336, progress: 0.4 })).toBe(false);
	});

	test("a shrink larger than the keyboard is a rotation or a split view, keyboard or not", () => {
		expect(acceptContainerLayout({ prev: 800, next: 400, keyboardHeight: 336, progress: 1 })).toBe(true);
	});

	test("the same value is accepted, so a re-layout to the same size is not a phantom refusal", () => {
		expect(acceptContainerLayout({ prev: 800, next: 800, keyboardHeight: 336, progress: 1 })).toBe(true);
	});
});
