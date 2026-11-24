import { describe, expect, test } from "bun:test";
import { createToastOffsetStore, resolveToastEdgeLift } from "./toast.offset";

/** Stand-ins for shared values: the store only keeps and orders them, it never reads them. */
const tabBar = { value: 84 };
const toolbar = { value: 120 };
const header = { value: 44 };

/** A listener that counts its calls — plain, so the suite runs under any test runner. */
function makeListener(): { listener: () => void; calls: () => number } {
	let count = 0;
	return {
		listener: () => {
			count += 1;
		},
		calls: () => count,
	};
}

describe("createToastOffsetStore", () => {
	test("starts with no source on either edge", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		expect(store.getSnapshot()).toEqual({});
	});

	test("applies a registered source and drops it on release", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const registration = store.set({ bottom: tabBar });
		expect(store.getSnapshot().bottom).toBe(tabBar);
		registration.release();
		expect(store.getSnapshot()).toEqual({});
	});

	test("lets the newest registration win per edge and restores the previous one on release", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const first = store.set({ bottom: tabBar });
		const second = store.set({ bottom: toolbar, top: header });
		expect(store.getSnapshot()).toEqual({ top: header, bottom: toolbar });
		second.release();
		expect(store.getSnapshot()).toEqual({ bottom: tabBar });
		first.release();
		expect(store.getSnapshot()).toEqual({});
	});

	test("keeps an older registration for an edge the newer one leaves out", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		store.set({ bottom: tabBar });
		store.set({ top: header });
		expect(store.getSnapshot()).toEqual({ top: header, bottom: tabBar });
	});

	test("updates a registration in place without changing its order", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const first = store.set({ bottom: tabBar });
		store.set({ top: header });
		first.update({ bottom: toolbar });
		expect(store.getSnapshot()).toEqual({ top: header, bottom: toolbar });
	});

	test("notifies only when the resolved sources change", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const { listener, calls } = makeListener();
		store.subscribe(listener);
		const registration = store.set({ bottom: tabBar });
		expect(calls()).toBe(1);
		registration.update({ bottom: tabBar });
		expect(calls()).toBe(1);
		registration.release();
		expect(calls()).toBe(2);
	});

	test("keeps the same snapshot object while nothing changes", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const before = store.getSnapshot();
		store.set({}).update({});
		expect(store.getSnapshot()).toBe(before);
	});

	test("ignores a second release", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const first = store.set({ bottom: tabBar });
		store.set({ bottom: toolbar });
		first.release();
		first.release();
		expect(store.getSnapshot()).toEqual({ bottom: toolbar });
	});

	test("ignores an update after release", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const registration = store.set({ bottom: tabBar });
		registration.release();
		registration.update({ bottom: toolbar });
		expect(store.getSnapshot()).toEqual({});
	});

	test("stops notifying an unsubscribed listener", () => {
		const store = createToastOffsetStore<typeof tabBar>();
		const { listener, calls } = makeListener();
		const unsubscribe = store.subscribe(listener);
		unsubscribe();
		store.set({ bottom: tabBar });
		expect(calls()).toBe(0);
	});
});

describe("resolveToastEdgeLift", () => {
	test("lifts nothing when the chrome fits inside the safe area", () => {
		expect(resolveToastEdgeLift({ chrome: 20, safeArea: 34, keyboard: 0 })).toBe(0);
	});

	test("lifts by the part of the chrome above the safe area", () => {
		expect(resolveToastEdgeLift({ chrome: 84, safeArea: 34, keyboard: 0 })).toBe(50);
	});

	test("lifts by the part of the keyboard above the safe area", () => {
		expect(resolveToastEdgeLift({ chrome: 0, safeArea: 34, keyboard: 336 })).toBe(302);
	});

	test("takes the larger of the chrome and the keyboard, since the keyboard covers the tab bar", () => {
		expect(resolveToastEdgeLift({ chrome: 84, safeArea: 34, keyboard: 336 })).toBe(302);
		expect(resolveToastEdgeLift({ chrome: 400, safeArea: 34, keyboard: 336 })).toBe(366);
	});

	test("treats a negative or non-finite chrome as no chrome", () => {
		expect(resolveToastEdgeLift({ chrome: -10, safeArea: 34, keyboard: 0 })).toBe(0);
		expect(resolveToastEdgeLift({ chrome: Number.NaN, safeArea: 34, keyboard: 0 })).toBe(0);
	});
});
