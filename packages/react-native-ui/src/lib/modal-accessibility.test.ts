import { describe, expect, test } from "bun:test";
import { firstFocusTarget, resolveModalContainerAccessibility } from "./modal-accessibility";

describe("firstFocusTarget", () => {
	test("picks the first mounted candidate, in order", () => {
		const title = { name: "title" };
		const item = { name: "item" };
		expect(firstFocusTarget([title, item])).toBe(title);
		expect(firstFocusTarget([null, item])).toBe(item);
		expect(firstFocusTarget([undefined, null, item])).toBe(item);
	});

	test("is null when nothing is mounted", () => {
		expect(firstFocusTarget([])).toBeNull();
		expect(firstFocusTarget([null, undefined])).toBeNull();
	});
});

describe("resolveModalContainerAccessibility", () => {
	const onEscape = (): void => {};

	test("an open container on top is modal and escapes", () => {
		expect(resolveModalContainerAccessibility({ isOpen: true, isOnTop: true, onEscape })).toEqual({
			accessibilityViewIsModal: true,
			onAccessibilityEscape: onEscape,
		});
	});

	test("a non-dismissible container is modal but has no escape", () => {
		expect(resolveModalContainerAccessibility({ isOpen: true, isOnTop: true })).toEqual({
			accessibilityViewIsModal: true,
			onAccessibilityEscape: undefined,
		});
	});

	test("a closed or exiting container is neither", () => {
		expect(resolveModalContainerAccessibility({ isOpen: false, isOnTop: true, onEscape })).toEqual({
			accessibilityViewIsModal: false,
			onAccessibilityEscape: undefined,
		});
	});

	test("a container under another is neither", () => {
		expect(resolveModalContainerAccessibility({ isOpen: true, isOnTop: false, onEscape })).toEqual({
			accessibilityViewIsModal: false,
			onAccessibilityEscape: undefined,
		});
	});
});
