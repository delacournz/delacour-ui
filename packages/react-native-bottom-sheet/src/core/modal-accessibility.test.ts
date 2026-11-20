import { describe, expect, test } from "bun:test";
import { firstFocusTarget, resolveSheetModalAccessibility } from "./modal-accessibility";

describe("resolveSheetModalAccessibility", () => {
	const base = { isOpen: true, modal: true, overlay: "none" as const, isTop: true, dismissible: true };

	test("an open, modal, top, dismissible sheet holds the screen reader and closes on escape", () => {
		expect(resolveSheetModalAccessibility(base)).toEqual({ isModal: true, canEscape: true });
	});

	test("a closed sheet holds nothing", () => {
		expect(resolveSheetModalAccessibility({ ...base, isOpen: false })).toEqual({ isModal: false, canEscape: false });
	});

	test("a sheet under another does not hold the screen reader", () => {
		expect(resolveSheetModalAccessibility({ ...base, isTop: false })).toEqual({ isModal: false, canEscape: false });
	});

	test("a non-modal sheet leaves the app reachable and does not claim escape", () => {
		expect(resolveSheetModalAccessibility({ ...base, modal: false })).toEqual({ isModal: false, canEscape: false });
	});

	test("a blocking overlay keeps it modal", () => {
		expect(resolveSheetModalAccessibility({ ...base, overlay: "blocking" })).toEqual({
			isModal: true,
			canEscape: true,
		});
	});

	test("a touch-through overlay makes it non-modal, whatever modal says", () => {
		expect(resolveSheetModalAccessibility({ ...base, overlay: "touch-through" })).toEqual({
			isModal: false,
			canEscape: false,
		});
	});

	test("a sheet that cannot be dismissed stays modal but ignores escape", () => {
		expect(resolveSheetModalAccessibility({ ...base, dismissible: false })).toEqual({
			isModal: true,
			canEscape: false,
		});
	});
});

describe("firstFocusTarget", () => {
	test("takes the first mounted candidate", () => {
		const title = {};
		const container = {};
		expect(firstFocusTarget([null, title, container])).toBe(title);
		expect(firstFocusTarget([undefined, null, container])).toBe(container);
	});

	test("is null when nothing is mounted", () => {
		expect(firstFocusTarget([null, undefined])).toBeNull();
		expect(firstFocusTarget([])).toBeNull();
	});
});
