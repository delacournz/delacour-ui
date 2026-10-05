import { describe, expect, test } from "bun:test";
import {
	INITIAL_OVERLAY_REGISTRY,
	isTopOverlay,
	OVERLAY_LAYER_BASE,
	type OverlayRegistryState,
	reduceOverlayRegistry,
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
