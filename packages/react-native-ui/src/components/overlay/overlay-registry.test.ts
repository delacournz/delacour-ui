import { describe, expect, test } from "bun:test";
import {
	hasModalOverlay,
	hidesAppContent,
	INITIAL_OVERLAY_REGISTRY,
	isBelowTopModal,
	isModalOnTop,
	isTopOverlay,
	OVERLAY_LAYER_BASE,
	type OverlayRegistryState,
	reduceOverlayRegistry,
	topModalOverlay,
	topOverlay,
	zIndexOfOverlay,
} from "./overlay-registry";

function apply(...actions: Parameters<typeof reduceOverlayRegistry>[1][]): OverlayRegistryState {
	return actions.reduce(reduceOverlayRegistry, INITIAL_OVERLAY_REGISTRY);
}

describe("OVERLAY_LAYER_BASE", () => {
	test("orders modal under anchored under toast, all above the sheet engine's 1-up stamps", () => {
		expect(OVERLAY_LAYER_BASE.modal).toBeGreaterThanOrEqual(1000);
		expect(OVERLAY_LAYER_BASE.anchored).toBeGreaterThan(OVERLAY_LAYER_BASE.modal);
		expect(OVERLAY_LAYER_BASE.toast).toBeGreaterThan(OVERLAY_LAYER_BASE.anchored);
	});
});

describe("reduceOverlayRegistry", () => {
	test("an open overlay draws above its layer's base", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" });
		expect(zIndexOfOverlay(state, "a")).toBe(OVERLAY_LAYER_BASE.modal + 1);
	});

	test("a later open in the same layer draws above the earlier one", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" }, { type: "open", id: "b", layer: "modal" });
		expect(zIndexOfOverlay(state, "b")).toBeGreaterThan(zIndexOfOverlay(state, "a"));
	});

	test("the layer wins over open order", () => {
		const state = apply({ type: "open", id: "toast", layer: "toast" }, { type: "open", id: "dialog", layer: "modal" });
		expect(zIndexOfOverlay(state, "toast")).toBeGreaterThan(zIndexOfOverlay(state, "dialog"));
	});

	test("re-opening brings an overlay forward instead of duplicating it", () => {
		const state = apply(
			{ type: "open", id: "a", layer: "modal" },
			{ type: "open", id: "b", layer: "modal" },
			{ type: "open", id: "a", layer: "modal" }
		);
		expect(state.open.filter((entry) => entry.id === "a")).toHaveLength(1);
		expect(zIndexOfOverlay(state, "a")).toBeGreaterThan(zIndexOfOverlay(state, "b"));
	});

	test("a z never leaves its layer's band, however many opens came before", () => {
		let state = INITIAL_OVERLAY_REGISTRY;
		for (let i = 0; i < 5000; i++) {
			state = reduceOverlayRegistry(state, { type: "open", id: `m${i}`, layer: "modal" });
			state = reduceOverlayRegistry(state, { type: "close", id: `m${i}` });
		}
		state = reduceOverlayRegistry(state, { type: "open", id: "last", layer: "modal" });
		expect(zIndexOfOverlay(state, "last")).toBeLessThan(OVERLAY_LAYER_BASE.anchored);
	});

	test("closing an overlay that is not open returns the same state", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" });
		expect(reduceOverlayRegistry(state, { type: "close", id: "nope" })).toBe(state);
	});

	test("an exiting overlay keeps its place in the z-order", () => {
		const open = apply({ type: "open", id: "a", layer: "modal" }, { type: "open", id: "b", layer: "modal" });
		const state = reduceOverlayRegistry(open, { type: "exiting", id: "a", isExiting: true });
		expect(zIndexOfOverlay(state, "a")).toBe(zIndexOfOverlay(open, "a"));
		expect(state.nextSeq).toBe(open.nextSeq);
	});

	test("re-stamping an exiting overlay keeps it exiting", () => {
		const state = apply(
			{ type: "open", id: "a", layer: "modal" },
			{ type: "exiting", id: "a", isExiting: true },
			{ type: "open", id: "a", layer: "anchored" }
		);
		expect(state.open).toEqual([expect.objectContaining({ id: "a", layer: "anchored", isExiting: true })]);
	});

	test("an exiting that changes nothing returns the same state", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" });
		expect(reduceOverlayRegistry(state, { type: "exiting", id: "a", isExiting: false })).toBe(state);
		expect(reduceOverlayRegistry(state, { type: "exiting", id: "nope", isExiting: true })).toBe(state);
	});

	test("a closed overlay has no z", () => {
		const state = apply({ type: "open", id: "a", layer: "modal" }, { type: "close", id: "a" });
		expect(zIndexOfOverlay(state, "a")).toBe(0);
	});
});

describe("topOverlay / isTopOverlay", () => {
	test("is null with nothing open", () => {
		expect(topOverlay(INITIAL_OVERLAY_REGISTRY)).toBeNull();
	});

	test("an anchored overlay over a dialog is the top", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal" }, { type: "open", id: "pop", layer: "anchored" });
		expect(topOverlay(state)).toBe("pop");
		expect(isTopOverlay(state, "dialog")).toBe(false);
	});

	test("a toast never captures the back button", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal" }, { type: "open", id: "toast", layer: "toast" });
		expect(topOverlay(state)).toBe("dialog");
		expect(isTopOverlay(state, "toast")).toBe(false);
	});

	test("closing the top hands it to the one beneath", () => {
		const state = apply(
			{ type: "open", id: "a", layer: "modal" },
			{ type: "open", id: "b", layer: "modal" },
			{ type: "close", id: "b" }
		);
		expect(isTopOverlay(state, "a")).toBe(true);
	});
});

describe("hasModalOverlay", () => {
	test("is false when nothing is presented", () => {
		expect(hasModalOverlay(INITIAL_OVERLAY_REGISTRY)).toBe(false);
	});

	test("is true while a modal overlay is presented", () => {
		const state = reduceOverlayRegistry(INITIAL_OVERLAY_REGISTRY, { type: "open", id: "dialog", layer: "modal" });
		expect(hasModalOverlay(state)).toBe(true);
	});

	test("ignores anchored overlays and toasts", () => {
		let state = reduceOverlayRegistry(INITIAL_OVERLAY_REGISTRY, { type: "open", id: "popover", layer: "anchored" });
		state = reduceOverlayRegistry(state, { type: "open", id: "toast", layer: "toast" });
		expect(hasModalOverlay(state)).toBe(false);
	});

	test("is false while the only modal overlay is exiting, so focus can return to its trigger", () => {
		const state = apply(
			{ type: "open", id: "dialog", layer: "modal" },
			{ type: "exiting", id: "dialog", isExiting: true }
		);
		expect(hasModalOverlay(state)).toBe(false);
	});

	test("is true again when an exiting modal reopens", () => {
		const state = apply(
			{ type: "open", id: "dialog", layer: "modal" },
			{ type: "exiting", id: "dialog", isExiting: true },
			{ type: "exiting", id: "dialog", isExiting: false }
		);
		expect(hasModalOverlay(state)).toBe(true);
	});

	test("stays true while another modal overlay is still open", () => {
		const state = apply(
			{ type: "open", id: "lower", layer: "modal" },
			{ type: "open", id: "upper", layer: "modal" },
			{ type: "exiting", id: "upper", isExiting: true }
		);
		expect(hasModalOverlay(state)).toBe(true);
	});

	test("is false again once the last modal overlay closes", () => {
		let state = reduceOverlayRegistry(INITIAL_OVERLAY_REGISTRY, { type: "open", id: "dialog", layer: "modal" });
		state = reduceOverlayRegistry(state, { type: "close", id: "dialog" });
		expect(hasModalOverlay(state)).toBe(false);
	});
});

describe("hidesAppContent", () => {
	test("is true while a teleported modal is open", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal", isInApp: false });
		expect(hidesAppContent(state)).toBe(true);
	});

	test("is false while the only open modal draws inside the app content", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal", isInApp: true });
		expect(hidesAppContent(state)).toBe(false);
	});

	test("is true when a teleported modal is open beside one drawn in the app", () => {
		const state = apply(
			{ type: "open", id: "inline", layer: "modal", isInApp: true },
			{ type: "open", id: "teleported", layer: "modal", isInApp: false }
		);
		expect(hidesAppContent(state)).toBe(true);
	});

	test("is false while the only teleported modal is exiting", () => {
		const state = apply(
			{ type: "open", id: "dialog", layer: "modal", isInApp: false },
			{ type: "exiting", id: "dialog", isExiting: true }
		);
		expect(hidesAppContent(state)).toBe(false);
	});

	test("ignores anchored overlays and toasts", () => {
		const state = apply(
			{ type: "open", id: "pop", layer: "anchored", isInApp: false },
			{ type: "open", id: "toast", layer: "toast", isInApp: false }
		);
		expect(hidesAppContent(state)).toBe(false);
	});

	test("a modal drawn in the app still stacks as the top modal", () => {
		const state = apply(
			{ type: "open", id: "lower", layer: "modal", isInApp: false },
			{ type: "open", id: "upper", layer: "modal", isInApp: true }
		);
		expect(topModalOverlay(state)).toBe("upper");
		expect(isBelowTopModal(state, "lower")).toBe(true);
	});
});

describe("topModalOverlay / isBelowTopModal", () => {
	test("is null with no modal open", () => {
		const state = apply({ type: "open", id: "pop", layer: "anchored" });
		expect(topModalOverlay(state)).toBeNull();
		expect(isBelowTopModal(state, "pop")).toBe(false);
	});

	test("hides a dialog under another dialog, never the top one", () => {
		const state = apply({ type: "open", id: "lower", layer: "modal" }, { type: "open", id: "upper", layer: "modal" });
		expect(topModalOverlay(state)).toBe("upper");
		expect(isBelowTopModal(state, "lower")).toBe(true);
		expect(isBelowTopModal(state, "upper")).toBe(false);
	});

	test("leaves a popover or toast above the top dialog reachable", () => {
		const state = apply(
			{ type: "open", id: "dialog", layer: "modal" },
			{ type: "open", id: "pop", layer: "anchored" },
			{ type: "open", id: "toast", layer: "toast" }
		);
		expect(isBelowTopModal(state, "pop")).toBe(false);
		expect(isBelowTopModal(state, "toast")).toBe(false);
	});

	test("an exiting top dialog hands screen readers to the one under it", () => {
		const state = apply(
			{ type: "open", id: "lower", layer: "modal" },
			{ type: "open", id: "upper", layer: "modal" },
			{ type: "exiting", id: "upper", isExiting: true }
		);
		expect(topModalOverlay(state)).toBe("lower");
		expect(isBelowTopModal(state, "lower")).toBe(false);
		expect(isBelowTopModal(state, "upper")).toBe(false);
	});

	test("an overlay that is not open is not below anything", () => {
		const state = apply({ type: "open", id: "dialog", layer: "modal" });
		expect(isBelowTopModal(state, "nope")).toBe(false);
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
