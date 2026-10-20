import { describe, expect, test } from "bun:test";
import type { DemoSource } from "./demo-source";
import { componentOf, hashOf } from "./plan";

const source: DemoSource = { code: "export function Demo() {}\n", meta: { title: "A demo" } };

describe("hashOf", () => {
	test("changes with the spec block, so editing a flow re-captures its demo", () => {
		const before = hashOf(source, 'capture("a/b", async (f) => { await f.wait(500); })', true, "stage");
		const after = hashOf(source, 'capture("a/b", async (f) => { await f.wait(700); })', true, "stage");
		expect(before).not.toBe(after);
	});

	test("a clip and a still of the same source hash differently", () => {
		expect(hashOf(source, 'capture("a/b")', false, "stage")).not.toBe(hashOf(source, 'capture("a/b")', true, "stage"));
	});

	test("the device edge reaches only device frames", () => {
		expect(hashOf(source, null, false, "stage")).not.toBe(hashOf(source, null, false, "device"));
	});
});

describe("componentOf", () => {
	test("is the first segment, however deep the gallery nests", () => {
		expect(componentOf("switch/colours")).toBe("switch");
		expect(componentOf("screen/navbar/default")).toBe("screen");
	});
});
