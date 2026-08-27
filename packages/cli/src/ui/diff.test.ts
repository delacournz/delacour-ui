import { describe, expect, test } from "bun:test";
import { diffLines, hasChanges, toHunks } from "./diff";

describe("diffLines", () => {
	test("reports no changes for identical text", () => {
		const lines = diffLines("a\nb\nc", "a\nb\nc");

		expect(hasChanges(lines)).toBe(false);
		expect(lines.every((line) => line.kind === "context")).toBe(true);
	});

	test("marks a replaced line as one removal and one addition", () => {
		const lines = diffLines("a\nb\nc", "a\nB\nc");

		expect(lines).toEqual([
			{ kind: "context", text: "a" },
			{ kind: "removed", text: "b" },
			{ kind: "added", text: "B" },
			{ kind: "context", text: "c" },
		]);
	});

	test("keeps the unchanged lines around an insertion", () => {
		const lines = diffLines("a\nc", "a\nb\nc");

		expect(lines.filter((line) => line.kind === "added").map((line) => line.text)).toEqual(["b"]);
		expect(lines.filter((line) => line.kind === "removed")).toEqual([]);
	});

	test("handles a deletion at the end", () => {
		const lines = diffLines("a\nb\nc", "a");

		expect(lines.filter((line) => line.kind === "removed").map((line) => line.text)).toEqual(["b", "c"]);
	});

	test("handles one side being empty", () => {
		expect(diffLines("", "a").filter((line) => line.kind === "added")).toHaveLength(1);
	});
});

describe("toHunks", () => {
	const long = (count: number, prefix = "line") => Array.from({ length: count }, (_, i) => `${prefix}${i}`).join("\n");

	test("drops the untouched runs between changes", () => {
		const before = `${long(20)}\nchanged\n${long(20, "tail")}`;
		const after = `${long(20)}\nCHANGED\n${long(20, "tail")}`;
		const hunks = toHunks(diffLines(before, after));

		expect(hunks).toHaveLength(1);
		expect(hunks[0]?.lines).toHaveLength(8);
	});

	test("emits a hunk per distant change", () => {
		const before = `top\n${long(20)}\nbottom`;
		const after = `TOP\n${long(20)}\nBOTTOM`;

		expect(toHunks(diffLines(before, after))).toHaveLength(2);
	});

	test("numbers each hunk from the line it starts at", () => {
		const before = `${long(10)}\nchanged`;
		const after = `${long(10)}\nCHANGED`;
		const [hunk] = toHunks(diffLines(before, after));

		expect(hunk?.before).toBe(8);
		expect(hunk?.after).toBe(8);
	});

	test("returns nothing when nothing changed", () => {
		expect(toHunks(diffLines("a\nb", "a\nb"))).toEqual([]);
	});
});
