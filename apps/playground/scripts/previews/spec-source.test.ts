import { describe, expect, test } from "bun:test";
import { captureBlocks } from "./spec-source";

const SPEC = `import { capture } from "./capture";

capture("switch/colours");

capture("switch/tap-or-drag", async (f) => {
	// Tapping it on, then off (a ")" in a comment must not end the block)
	await f.tap("switch-md");
	await f.wait(500);
	await f.tap("switch-md");
});

capture("input/variants/at-rest", { types: true }, async (f) => {
	await f.type("input-primary", "Ada");
});
`;

describe("captureBlocks", () => {
	test("finds every capture, in order, and tells a still from a clip", () => {
		const blocks = captureBlocks(SPEC);
		expect(blocks.map((block) => [block.id, block.animated])).toEqual([
			["switch/colours", false],
			["switch/tap-or-drag", true],
			["input/variants/at-rest", true],
		]);
	});

	test("a block's text is the whole call, comments and all", () => {
		const [, clip] = captureBlocks(SPEC);
		expect(clip?.text.startsWith('capture("switch/tap-or-drag", async (f) => {')).toBe(true);
		expect(clip?.text.endsWith("})")).toBe(true);
		expect(clip?.text).toContain('a ")" in a comment');
	});

	test("a change inside one block leaves the others' text alone", () => {
		const before = captureBlocks(SPEC);
		const after = captureBlocks(SPEC.replace("f.wait(500)", "f.wait(700)"));
		expect(after[0]?.text).toBe(before[0]?.text as string);
		expect(after[1]?.text).not.toBe(before[1]?.text as string);
		expect(after[2]?.text).toBe(before[2]?.text as string);
	});
});
