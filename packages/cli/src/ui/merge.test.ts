import { describe, expect, test } from "bun:test";
import { hasConflictMarkers, merge3 } from "./merge";

const BASE = ["one", "two", "three", "four", "five", ""].join("\n");

function edit(text: string, from: string, to: string): string {
	return text.replace(from, to);
}

describe("merge3", () => {
	test("takes the registry's change when the project made none", () => {
		const next = edit(BASE, "two", "TWO");

		expect(merge3({ local: BASE, base: BASE, next, nextLabel: "registry" })).toEqual({ content: next, conflicts: 0 });
	});

	test("keeps the project's change when the registry made none", () => {
		const local = edit(BASE, "four", "FOUR");

		expect(merge3({ local, base: BASE, next: BASE, nextLabel: "registry" })).toEqual({ content: local, conflicts: 0 });
	});

	test("takes both when they moved different lines", () => {
		const result = merge3({
			local: edit(BASE, "five", "FIVE"),
			base: BASE,
			next: edit(BASE, "one", "ONE"),
			nextLabel: "registry",
		});

		expect(result).toEqual({ content: ["ONE", "two", "three", "four", "FIVE", ""].join("\n"), conflicts: 0 });
	});

	test("does not call it a conflict when both sides made the same change", () => {
		const same = edit(BASE, "three", "THREE");

		expect(merge3({ local: same, base: BASE, next: same, nextLabel: "registry" })).toEqual({
			content: same,
			conflicts: 0,
		});
	});

	test("writes git's markers around a line both sides changed differently", () => {
		const result = merge3({
			local: edit(BASE, "three", "mine"),
			base: BASE,
			next: edit(BASE, "three", "theirs"),
			nextLabel: "registry@abc1234",
		});

		expect(result.conflicts).toBe(1);
		expect(result.content).toBe(
			["one", "two", "<<<<<<< local", "mine", "=======", "theirs", ">>>>>>> registry@abc1234", "four", "five", ""].join(
				"\n"
			)
		);
	});

	test("keeps the trailing newline", () => {
		const result = merge3({ local: BASE, base: BASE, next: edit(BASE, "five", "5"), nextLabel: "registry" });

		expect(result.content.endsWith("5\n")).toBe(true);
	});
});

describe("hasConflictMarkers", () => {
	test("finds a region a merge left behind", () => {
		const { content } = merge3({
			local: edit(BASE, "three", "mine"),
			base: BASE,
			next: edit(BASE, "three", "theirs"),
			nextLabel: "registry",
		});

		expect(hasConflictMarkers(content)).toBe(true);
	});

	test("is not fooled by a row of equals signs", () => {
		expect(hasConflictMarkers("a\n=======\nb\n")).toBe(false);
	});
});
