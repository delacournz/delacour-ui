import { describe, expect, test } from "bun:test";
import { INITIAL_REGISTRY, isTop, reduceRegistry, type SheetRegistryState, topOf, zIndexOf } from "./sheet-registry";

function open(state: SheetRegistryState, id: string, host = "root", behavior: "push" | "replace" = "push") {
	return reduceRegistry(state, { type: "open", id, host, behavior });
}

describe("sheet registry", () => {
	test("opening assigns increasing z, later on top", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		expect(zIndexOf(b.state, "a")).toBeGreaterThan(0);
		expect(zIndexOf(b.state, "b")).toBeGreaterThan(zIndexOf(b.state, "a"));
		expect(topOf(b.state, "root")).toBe("b");
	});

	test("reopening a sheet already open brings it to the top", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		const again = open(b.state, "a");
		expect(topOf(again.state, "root")).toBe("a");
		expect(again.state.open.filter((entry) => entry.id === "a")).toHaveLength(1);
	});

	test("push closes nothing", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		expect(b.closed).toEqual([]);
		expect(zIndexOf(b.state, "a")).toBeGreaterThan(0);
	});

	test("replace closes the other open sheets in the same host and reports them", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		const c = open(b.state, "c", "root", "replace");
		expect([...c.closed].sort()).toEqual(["a", "b"]);
		expect(zIndexOf(c.state, "a")).toBe(0);
		expect(zIndexOf(c.state, "b")).toBe(0);
		expect(topOf(c.state, "root")).toBe("c");
	});

	test("replace leaves sheets in another host alone", () => {
		const a = open(INITIAL_REGISTRY, "a", "modal");
		const b = open(a.state, "b", "root", "replace");
		expect(b.closed).toEqual([]);
		expect(topOf(b.state, "modal")).toBe("a");
		expect(topOf(b.state, "root")).toBe("b");
	});

	test("closing removes the entry and the next one down is top", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		const closed = reduceRegistry(b.state, { type: "close", id: "b" });
		expect(topOf(closed.state, "root")).toBe("a");
		expect(zIndexOf(closed.state, "b")).toBe(0);
	});

	test("closing an unknown sheet returns the same state", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const closed = reduceRegistry(a.state, { type: "close", id: "nope" });
		expect(closed.state).toBe(a.state);
		expect(closed.closed).toEqual([]);
	});

	test("top of an empty host is null; z of a closed sheet is zero", () => {
		expect(topOf(INITIAL_REGISTRY, "root")).toBeNull();
		expect(zIndexOf(INITIAL_REGISTRY, "a")).toBe(0);
	});

	test("z never reuses a number after a close", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const zA = zIndexOf(a.state, "a");
		const closed = reduceRegistry(a.state, { type: "close", id: "a" });
		const b = open(closed.state, "b");
		expect(zIndexOf(b.state, "b")).toBeGreaterThan(zA);
	});

	test("isTop is true only for the topmost sheet of its own host", () => {
		const a = open(INITIAL_REGISTRY, "a");
		const b = open(a.state, "b");
		const m = open(b.state, "m", "modal");
		expect(isTop(m.state, "a")).toBe(false);
		expect(isTop(m.state, "b")).toBe(true);
		expect(isTop(m.state, "m")).toBe(true);
		expect(isTop(m.state, "nope")).toBe(false);
	});
});
