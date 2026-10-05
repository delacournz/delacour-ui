import { describe, expect, test } from "bun:test";
import {
	createToastApi,
	createToastStore,
	normalizeToastInput,
	reduceToasts,
	type ToastItem,
	type ToastMessageItem,
	type ToastState,
} from "./toast.store";

const AT = { now: 1000, batchIndex: 0 };

function message(id: string, title = id): ToastMessageItem {
	const item = normalizeToastInput({ id, title }, { ...AT, id });
	if (item.kind !== "message") throw new Error("expected a message");
	return item;
}

function ids(state: ToastState): string[] {
	return state.map((item) => item.id);
}

/** A store whose microtasks run when the test says so, so a batch is explicit. */
function manualStore() {
	const queue: (() => void)[] = [];
	let now = 0;
	const store = createToastStore({
		now: () => now,
		schedule: (task) => {
			queue.push(task);
		},
	});
	return {
		store,
		api: createToastApi(store),
		flush: () => {
			for (const task of queue.splice(0)) task();
		},
		advance: (ms: number) => {
			now += ms;
		},
	};
}

describe("normalizeToastInput", () => {
	test("a string is a default-status message titled with it", () => {
		const item = normalizeToastInput("Saved", { ...AT, id: "t1" });
		expect(item).toMatchObject({
			kind: "message",
			id: "t1",
			title: "Saved",
			status: "default",
			placement: "bottom",
			isLoading: false,
			isExiting: false,
			revision: 0,
			createdAt: 1000,
		});
	});

	test("a render function makes a custom toast", () => {
		const render = () => null;
		const item = normalizeToastInput({ render, placement: "top" }, { ...AT, id: "t2" });
		expect(item.kind).toBe("custom");
		expect(item.placement).toBe("top");
	});

	test("an id on the options wins over the generated one", () => {
		expect(normalizeToastInput({ id: "mine", title: "x" }, { ...AT, id: "t3" }).id).toBe("mine");
	});
});

describe("reduceToasts", () => {
	test("add appends, oldest first", () => {
		const state = reduceToasts(reduceToasts([], { type: "add", item: message("a") }), {
			type: "add",
			item: message("b"),
		});
		expect(ids(state)).toEqual(["a", "b"]);
	});

	test("add with an existing id replaces it in place and bumps its revision", () => {
		let state: ToastState = [message("a"), message("b")];
		state = reduceToasts(state, { type: "hide", id: "a" });
		state = reduceToasts(state, { type: "add", item: message("a", "Again") });
		expect(ids(state)).toEqual(["a", "b"]);
		expect(state[0]).toMatchObject({ title: "Again", revision: 1, isExiting: false });
	});

	test("update merges into the toast with that id and bumps its revision", () => {
		const state = reduceToasts([message("a")], {
			type: "update",
			id: "a",
			patch: { status: "success", description: "All done" },
		});
		expect(state[0]).toMatchObject({ title: "a", status: "success", description: "All done", revision: 1 });
	});

	test("update of an unknown id is the identity", () => {
		const state: ToastState = [message("a")];
		expect(reduceToasts(state, { type: "update", id: "zzz", patch: { title: "x" } })).toBe(state);
	});

	test("update with a title turns a custom toast into a message", () => {
		const custom = normalizeToastInput({ id: "c", render: () => null }, { ...AT, id: "c" });
		const [item] = reduceToasts([custom], { type: "update", id: "c", patch: { title: "Now words" } });
		expect(item).toMatchObject({ kind: "message", title: "Now words", status: "default" });
	});

	test("hide marks the toast exiting and keeps it, so the viewport can animate it out", () => {
		const state = reduceToasts([message("a")], { type: "hide", id: "a" });
		expect(ids(state)).toEqual(["a"]);
		expect(state[0]?.isExiting).toBe(true);
	});

	test("hide of an exiting or unknown toast is the identity", () => {
		const exiting = reduceToasts([message("a")], { type: "hide", id: "a" });
		expect(reduceToasts(exiting, { type: "hide", id: "a" })).toBe(exiting);
		expect(reduceToasts(exiting, { type: "hide", id: "zzz" })).toBe(exiting);
	});

	test("remove drops it", () => {
		const state = reduceToasts([message("a"), message("b")], { type: "remove", id: "a" });
		expect(ids(state)).toEqual(["b"]);
	});

	test("hideAll marks every toast exiting", () => {
		const state = reduceToasts([message("a"), message("b")], { type: "hideAll" });
		expect(state.every((item: ToastItem) => item.isExiting)).toBe(true);
	});
});

describe("createToastStore", () => {
	test("notifies subscribers and hands out a fresh snapshot", () => {
		const { store, api } = manualStore();
		const before = store.getSnapshot();
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls += 1;
		});
		api.show("Saved");
		expect(calls).toBe(1);
		expect(store.getSnapshot()).not.toBe(before);
		unsubscribe();
		api.show("Again");
		expect(calls).toBe(1);
	});

	test("a no-op action keeps the snapshot and notifies no one", () => {
		const { store, api } = manualStore();
		api.show("Saved");
		const snapshot = store.getSnapshot();
		let calls = 0;
		store.subscribe(() => {
			calls += 1;
		});
		api.update("missing", { title: "x" });
		expect(store.getSnapshot()).toBe(snapshot);
		expect(calls).toBe(0);
	});

	test("toasts added in one tick are numbered for the stagger, and the count resets after it", () => {
		const { store, api, flush } = manualStore();
		api.show("one");
		api.show("two");
		api.show("three");
		flush();
		api.show("four");
		expect(store.getSnapshot().map((item) => item.batchIndex)).toEqual([0, 1, 2, 0]);
	});

	test("ids come from a counter and never repeat", () => {
		const { api } = manualStore();
		const a = api.show("a");
		const b = api.show("b");
		expect(a.id).not.toBe(b.id);
	});
});

describe("createToastApi", () => {
	test("the api is callable as well as a namespace", () => {
		const { store, api } = manualStore();
		api("Saved");
		expect(store.getSnapshot()[0]).toMatchObject({ title: "Saved" });
	});

	test("the status shorthands set the status, and error is destructive", () => {
		const { store, api } = manualStore();
		api.success("s");
		api.info("i");
		api.warning("w");
		api.error("e", { description: "why" });
		expect(store.getSnapshot().map((item) => (item.kind === "message" ? item.status : null))).toEqual([
			"success",
			"info",
			"warning",
			"destructive",
		]);
		expect(store.getSnapshot()[3]).toMatchObject({ description: "why" });
	});

	test("the handle hides its own toast", () => {
		const { store, api } = manualStore();
		const handle = api.show("Saved");
		handle.hide();
		expect(store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("hide and hideAll", () => {
		const { store, api } = manualStore();
		const a = api.show("a");
		api.show("b");
		api.hide(a.id);
		expect(store.getSnapshot().map((item) => item.isExiting)).toEqual([true, false]);
		api.hideAll();
		expect(store.getSnapshot().every((item) => item.isExiting)).toBe(true);
	});

	test("promise: loading, then success in place under the same id", async () => {
		const { store, api } = manualStore();
		const result = api.promise(Promise.resolve(3), {
			loading: "Uploading…",
			success: (count) => `Uploaded ${count} files`,
			error: "Upload failed",
		});
		const [loading] = store.getSnapshot();
		expect(loading).toMatchObject({ kind: "message", title: "Uploading…", isLoading: true, status: "default" });

		expect(await result).toBe(3);
		const after = store.getSnapshot();
		expect(after).toHaveLength(1);
		expect(after[0]).toMatchObject({
			id: loading?.id,
			title: "Uploaded 3 files",
			status: "success",
			isLoading: false,
			revision: 1,
		});
	});

	test("promise: loading, then error in place, and the caller still sees the rejection", async () => {
		const { store, api } = manualStore();
		const failure = new Error("offline");
		const result = api.promise(Promise.reject(failure), {
			loading: "Saving…",
			success: "Saved",
			error: (error) => `Failed: ${(error as Error).message}`,
		});
		const id = store.getSnapshot()[0]?.id;
		await expect(result).rejects.toBe(failure);
		expect(store.getSnapshot()[0]).toMatchObject({
			id,
			title: "Failed: offline",
			status: "destructive",
			isLoading: false,
		});
	});
});
