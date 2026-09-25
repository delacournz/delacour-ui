import { describe, expect, test } from "bun:test";
import type { SheetIntent } from "../sheet.types";
import { type IntentState, resolveIntent } from "./resolve-intent";

const ready: IntentState = {
	currentIndex: -1,
	base: 0,
	layoutReady: true,
	detents: [200, 400, 800],
	closedHeight: 0,
	maxHeight: 800,
	initialIndex: 0,
};
const open: IntentState = { ...ready, currentIndex: 1, base: 400 };
/** A sheet visibly open whose settled index never caught up — a release the list owned. */
const staleClosed: IntentState = { ...ready, currentIndex: -1, base: 800 };
const unmeasured: IntentState = { ...ready, layoutReady: false, detents: [] };

const intent = (kind: SheetIntent["kind"], extra: Record<string, unknown> = {}): SheetIntent =>
	({ id: 1, kind, ...extra }) as SheetIntent;

describe("resolveIntent", () => {
	describe("open", () => {
		test("animates a closed sheet to its initial index", () => {
			expect(resolveIntent(ready, intent("open"))).toEqual({ action: "animate", target: 200 });
			expect(resolveIntent({ ...ready, initialIndex: 2 }, intent("open"))).toEqual({ action: "animate", target: 800 });
		});

		test("an initial index past the last detent lands on the last", () => {
			expect(resolveIntent({ ...ready, initialIndex: 9 }, intent("open"))).toEqual({ action: "animate", target: 800 });
		});

		test("waits for layout rather than animating from a guess", () => {
			expect(resolveIntent(unmeasured, intent("open"))).toEqual({ action: "wait" });
		});

		test("is a no-op on a sheet that is already open", () => {
			expect(resolveIntent(open, intent("open"))).toBeNull();
			expect(resolveIntent(staleClosed, intent("open"))).toBeNull();
		});

		test("with nothing to open to there is nothing to do", () => {
			expect(resolveIntent({ ...ready, detents: [] }, intent("open"))).toBeNull();
		});
	});

	describe("close", () => {
		test("animates an open sheet to its closed height", () => {
			expect(resolveIntent(open, intent("close"))).toEqual({ action: "animate", target: 0 });
			expect(resolveIntent({ ...open, closedHeight: -50 }, intent("close"))).toEqual({
				action: "animate",
				target: -50,
			});
		});

		test("a visibly open sheet closes even when its settled index still says closed", () => {
			expect(resolveIntent(staleClosed, intent("close"))).toEqual({ action: "animate", target: 0 });
			expect(resolveIntent(staleClosed, intent("forceClose"))).toEqual({ action: "jump", target: 0 });
			expect(resolveIntent(staleClosed, intent("snapToIndex", { index: -1 }))).toEqual({
				action: "animate",
				target: 0,
			});
		});

		test("a sheet resting within the settle tolerance of closed is closed", () => {
			expect(resolveIntent({ ...ready, base: 0.4 }, intent("close"))).toBeNull();
			expect(resolveIntent({ ...ready, closedHeight: -50, base: -49.8 }, intent("close"))).toBeNull();
		});

		test("closing a closed sheet is nothing — no deadlock, no phantom onClose", () => {
			expect(resolveIntent(ready, intent("close"))).toBeNull();
			expect(resolveIntent(unmeasured, intent("close"))).toBeNull();
		});
	});

	describe("forceClose", () => {
		test("jumps an open sheet closed without animating", () => {
			expect(resolveIntent(open, intent("forceClose"))).toEqual({ action: "jump", target: 0 });
		});

		test("is nothing on a closed sheet", () => {
			expect(resolveIntent(ready, intent("forceClose"))).toBeNull();
		});
	});

	describe("snapToIndex", () => {
		test("animates to the detent at that index", () => {
			expect(resolveIntent(open, intent("snapToIndex", { index: 2 }))).toEqual({ action: "animate", target: 800 });
		});

		test("-1 closes", () => {
			expect(resolveIntent(open, intent("snapToIndex", { index: -1 }))).toEqual({ action: "animate", target: 0 });
		});

		test("an index that does not exist is refused", () => {
			expect(resolveIntent(open, intent("snapToIndex", { index: 3 }))).toBeNull();
			expect(resolveIntent(open, intent("snapToIndex", { index: -2 }))).toBeNull();
			expect(resolveIntent(open, intent("snapToIndex", { index: 1.5 }))).toBeNull();
		});

		test("waits for layout", () => {
			expect(resolveIntent(unmeasured, intent("snapToIndex", { index: 0 }))).toEqual({ action: "wait" });
		});
	});

	describe("snapToPosition", () => {
		test("a pixel height animates as written, without becoming a detent", () => {
			expect(resolveIntent(open, intent("snapToPosition", { position: 333 }))).toEqual({
				action: "animate",
				target: 333,
			});
		});

		test("a percentage resolves against the height available", () => {
			expect(resolveIntent(open, intent("snapToPosition", { position: "50%" }))).toEqual({
				action: "animate",
				target: 400,
			});
		});

		test("clamps to what the sheet can show", () => {
			expect(resolveIntent(open, intent("snapToPosition", { position: 5000 }))).toEqual({
				action: "animate",
				target: 800,
			});
			expect(resolveIntent({ ...open, closedHeight: -50 }, intent("snapToPosition", { position: -500 }))).toEqual({
				action: "animate",
				target: -50,
			});
		});

		test("an invalid position is refused", () => {
			expect(resolveIntent(open, intent("snapToPosition", { position: "abc" }))).toBeNull();
			expect(resolveIntent(open, intent("snapToPosition", { position: Number.NaN }))).toBeNull();
		});

		test("waits for layout", () => {
			expect(resolveIntent(unmeasured, intent("snapToPosition", { position: 100 }))).toEqual({ action: "wait" });
		});
	});

	describe("expand and collapse", () => {
		test("expand animates to the highest detent, collapse to the lowest", () => {
			expect(resolveIntent(open, intent("expand"))).toEqual({ action: "animate", target: 800 });
			expect(resolveIntent(open, intent("collapse"))).toEqual({ action: "animate", target: 200 });
		});

		test("both open a closed sheet", () => {
			expect(resolveIntent(ready, intent("expand"))).toEqual({ action: "animate", target: 800 });
		});

		test("both wait for layout and refuse an empty detent list", () => {
			expect(resolveIntent(unmeasured, intent("expand"))).toEqual({ action: "wait" });
			expect(resolveIntent({ ...ready, detents: [] }, intent("collapse"))).toBeNull();
		});
	});
});
