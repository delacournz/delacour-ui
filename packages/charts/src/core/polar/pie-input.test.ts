import { describe, expect, test } from "bun:test";
import { collectPieInput } from "./pie-input";

describe("collectPieInput", () => {
	const rows = [
		{ name: "chrome", share: 64 },
		{ name: "safari", share: "19" },
		{ name: "other", share: null },
	];

	test("reads values through asNumber, so a numeric string counts", () => {
		expect(collectPieInput(rows, "share").values).toEqual([64, 19, Number.NaN]);
	});

	test("labels come from the label key as strings", () => {
		expect(collectPieInput(rows, "share", "name").labels).toEqual(["chrome", "safari", "other"]);
	});

	test("labels fall back to the row's index when no key is given", () => {
		expect(collectPieInput(rows, "share").labels).toEqual(["0", "1", "2"]);
	});

	test("a missing label reads as an empty string, not the word undefined", () => {
		expect(collectPieInput([{ share: 1 }], "share", "name").labels).toEqual([""]);
	});

	test("keeps one entry per row, so indices line up with the data", () => {
		const input = collectPieInput(rows, "share", "name");
		expect(input.values.length).toBe(rows.length);
		expect(input.labels.length).toBe(rows.length);
	});

	test("an empty table gives empty arrays", () => {
		expect(collectPieInput([], "share")).toEqual({ values: [], labels: [] });
	});
});
