import { describe, expect, test } from "bun:test";
import { resolveItemGraph, UnknownItemError } from "./resolve";

const GRAPH: Record<string, string[]> = {
	button: ["icon", "pressable", "spinner", "tv"],
	icon: ["cn", "tv", "use-theme-color"],
	pressable: ["compose-refs", "merge-props"],
	spinner: ["cn", "icon", "tv", "use-theme-color"],
	tv: ["styles"],
	cn: ["styles"],
	"use-theme-color": ["color"],
	"compose-refs": [],
	"merge-props": ["cn"],
	styles: [],
	color: [],
	separator: ["tv"],
};

const lookup = (name: string) => (name in GRAPH ? { registryDependencies: GRAPH[name] as string[] } : undefined);

describe("resolveItemGraph", () => {
	test("returns dependencies before the items that need them", () => {
		const order = resolveItemGraph(["separator"], lookup);

		expect(order).toEqual(["styles", "tv", "separator"]);
	});

	test("pulls the whole transitive closure of a component", () => {
		const order = resolveItemGraph(["button"], lookup);

		expect(order).toContain("styles");
		expect(order).toContain("color");
		expect(order.indexOf("cn")).toBeLessThan(order.indexOf("icon"));
		expect(order.at(-1)).toBe("button");
	});

	test("visits each item once however many paths reach it", () => {
		const order = resolveItemGraph(["button", "spinner", "icon"], lookup);

		expect(new Set(order).size).toBe(order.length);
	});

	test("keeps the requested order for unrelated roots", () => {
		expect(resolveItemGraph(["color", "compose-refs"], lookup)).toEqual(["color", "compose-refs"]);
	});

	test("survives a cycle rather than recursing forever", () => {
		const cyclic = (name: string) => ({ a: { registryDependencies: ["b"] }, b: { registryDependencies: ["a"] } })[name];

		expect(resolveItemGraph(["a"], cyclic)).toEqual(["b", "a"]);
	});

	test("names the unknown item and what was near it", () => {
		expect(() => resolveItemGraph(["buton"], lookup)).toThrow(UnknownItemError);
		expect(() => resolveItemGraph(["buton"], lookup)).toThrow(/buton/);
	});

	test("reports an unknown dependency against the item that asked for it", () => {
		const broken = (name: string) => (name === "a" ? { registryDependencies: ["ghost"] } : undefined);

		expect(() => resolveItemGraph(["a"], broken)).toThrow(/ghost.*required by.*a/s);
	});
});
