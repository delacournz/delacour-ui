import { describe, expect, test } from "bun:test";
import { firstFocusTarget, isModalOnTop, resolveModalContainerAccessibility } from "./modal-accessibility";
import { INITIAL_OVERLAY_REGISTRY, type OverlayRegistryState, reduceOverlayRegistry } from "./overlay-registry";

function apply(...actions: Parameters<typeof reduceOverlayRegistry>[1][]): OverlayRegistryState {
	return actions.reduce(reduceOverlayRegistry, INITIAL_OVERLAY_REGISTRY);
}

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

describe("isModalOnTop", () => {
	test("is true with no registry or no id: the container is its own top", () => {
		expect(isModalOnTop(null, "a")).toBe(true);
		expect(isModalOnTop(INITIAL_OVERLAY_REGISTRY, undefined)).toBe(true);
	});

	test("is true for an id the registry has not heard of yet", () => {
		expect(isModalOnTop(INITIAL_OVERLAY_REGISTRY, "a")).toBe(true);
	});

	test("is true for the top modal and false for one under it", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" }, { type: "open", id: "b", layer: "modal" });
		expect(isModalOnTop(state, "b")).toBe(true);
		expect(isModalOnTop(state, "a")).toBe(false);
	});

	test("an anchored overlay over a dialog is the top, and the dialog is not", () => {
		const state = apply(
			{ type: "open", id: "dialog", layer: "modal" },
			{ type: "open", id: "menu", layer: "anchored" }
		);
		expect(isModalOnTop(state, "menu")).toBe(true);
		expect(isModalOnTop(state, "dialog")).toBe(false);
	});

	test("an exiting overlay is not on top, and the one under it is again", () => {
		const state = apply(
			{ type: "open", id: "a", layer: "modal" },
			{ type: "open", id: "b", layer: "modal" },
			{ type: "exiting", id: "b", isExiting: true }
		);
		expect(isModalOnTop(state, "b")).toBe(false);
		expect(isModalOnTop(state, "a")).toBe(true);
	});

	test("a toast above a dialog does not take the top from it", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal" }, { type: "open", id: "toast", layer: "toast" });
		expect(isModalOnTop(state, "dialog")).toBe(true);
		expect(isModalOnTop(state, "toast")).toBe(false);
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
