import { describe, expect, test } from "bun:test";
import {
	buildComboboxRows,
	filterItems,
	getHighlightRanges,
	matchOption,
	normalizeComboboxOptions,
	resolvePendingRemove,
	resolveQueryReset,
	resolveResultsAnnouncement,
	resolveSelectedComboboxOptions,
	shouldOfferCreate,
} from "./combobox.filter";
import type { ComboboxEntry, ComboboxFilter, ComboboxOption } from "./combobox.types";

const DEFAULT: ComboboxFilter = { kind: "default" };
const NONE: ComboboxFilter = { kind: "none" };

const nz: ComboboxOption = { keywords: ["Aotearoa", "NZ"], label: "New Zealand", value: "nz" };
const au: ComboboxOption = { label: "Australia", value: "au" };
const fr: ComboboxOption = { isDisabled: true, label: "France", value: "fr" };
const at: ComboboxOption = { label: "Österreich", value: "at" };

const entries: ComboboxEntry[] = normalizeComboboxOptions([
	{ label: "Oceania", options: [nz, au] },
	{ label: "Europe", options: [fr, at] },
]);

describe("normalizeComboboxOptions", () => {
	test("flattens groups and keeps each option's heading", () => {
		expect(entries.map((entry) => [entry.option.value, entry.groupLabel])).toEqual([
			["nz", "Oceania"],
			["au", "Oceania"],
			["fr", "Europe"],
			["at", "Europe"],
		]);
	});

	test("keeps keywords on the option", () => {
		expect(entries[0]?.option.keywords).toEqual(["Aotearoa", "NZ"]);
	});

	test("drops a duplicate value, first wins", () => {
		const out = normalizeComboboxOptions([nz, { ...nz, label: "Again" }]);
		expect(out).toEqual([{ option: nz }]);
	});

	test("an ungrouped option has no heading", () => {
		expect(normalizeComboboxOptions([au])).toEqual([{ option: au }]);
	});
});

describe("matchOption", () => {
	test("default matches the label, case- and accent-insensitively", () => {
		expect(matchOption(nz, "zeal", DEFAULT)).toBe(true);
		expect(matchOption(at, "OSTER", DEFAULT)).toBe(true);
		expect(matchOption(au, "zeal", DEFAULT)).toBe(false);
	});

	test("default falls back to keywords", () => {
		expect(matchOption(nz, "aotea", DEFAULT)).toBe(true);
		expect(matchOption(nz, "nz", DEFAULT)).toBe(true);
	});

	test("an empty or blank query matches everything", () => {
		expect(matchOption(au, "", DEFAULT)).toBe(true);
		expect(matchOption(au, "   ", DEFAULT)).toBe(true);
	});

	test("custom is called with the raw option and the raw query", () => {
		const calls: [ComboboxOption, string][] = [];
		const filter: ComboboxFilter = {
			kind: "custom",
			match: (option, query) => {
				calls.push([option, query]);
				return option.value === query;
			},
		};
		expect(matchOption(au, " au", filter)).toBe(false);
		expect(matchOption(au, "au", filter)).toBe(true);
		expect(calls).toEqual([
			[au, " au"],
			[au, "au"],
		]);
	});

	test("none matches everything, always", () => {
		expect(matchOption(au, "zzz", NONE)).toBe(true);
	});
});

describe("filterItems", () => {
	test("preserves order and group membership", () => {
		expect(filterItems(entries, "a", DEFAULT).map((entry) => entry.option.value)).toEqual(["nz", "au", "fr"]);
		expect(filterItems(entries, "a", DEFAULT).map((entry) => entry.groupLabel)).toEqual([
			"Oceania",
			"Oceania",
			"Europe",
		]);
	});

	test("a group the query empties contributes no rows, so no heading", () => {
		const rows = buildComboboxRows(filterItems(entries, "austr", DEFAULT), null);
		expect(rows.map((row) => row.kind)).toEqual(["heading", "option"]);
	});

	test("keeps a disabled option that matches", () => {
		expect(filterItems(entries, "fran", DEFAULT).map((entry) => entry.option.value)).toEqual(["fr"]);
	});

	test("none keeps every entry, whatever the query", () => {
		expect(filterItems(entries, "zzz", NONE)).toHaveLength(4);
	});

	test("an empty query returns a copy of everything", () => {
		const out = filterItems(entries, "", DEFAULT);
		expect(out).toEqual(entries);
		expect(out).not.toBe(entries);
	});
});

describe("buildComboboxRows", () => {
	test("puts the create row first", () => {
		const rows = buildComboboxRows([{ option: au }], "Aus");
		expect(rows[0]).toEqual({ key: "create", kind: "create", query: "Aus" });
		expect(rows[1]?.kind).toBe("option");
	});

	test("no create query, no create row", () => {
		expect(buildComboboxRows([{ option: au }], null).map((row) => row.kind)).toEqual(["option"]);
	});
});

describe("getHighlightRanges", () => {
	test("returns the first match over the original string", () => {
		expect(getHighlightRanges("New Zealand", "zeal")).toEqual([{ end: 8, start: 4 }]);
	});

	test("is case-insensitive", () => {
		expect(getHighlightRanges("Apple", "APP")).toEqual([{ end: 3, start: 0 }]);
	});

	test("maps through diacritic stripping", () => {
		expect(getHighlightRanges("Éclair", "ecl")).toEqual([{ end: 3, start: 0 }]);
		expect(getHighlightRanges("Crème brûlée", "brul")).toEqual([{ end: 10, start: 6 }]);
	});

	test("maps a decomposed (NFD) original back to whole characters", () => {
		const decomposed = "Éclair";
		expect(getHighlightRanges(decomposed, "ecl")).toEqual([{ end: 4, start: 0 }]);
	});

	test("is unicode-safe past the BMP", () => {
		expect(getHighlightRanges("🥝 Kiwi", "kiwi")).toEqual([{ end: 7, start: 3 }]);
	});

	test("every occurrence with all", () => {
		expect(getHighlightRanges("banana", "an", { all: true })).toEqual([
			{ end: 3, start: 1 },
			{ end: 5, start: 3 },
		]);
	});

	test("an empty or blank query has no ranges", () => {
		expect(getHighlightRanges("Apple", "")).toEqual([]);
		expect(getHighlightRanges("Apple", "  ")).toEqual([]);
	});

	test("a query longer than the label has no ranges", () => {
		expect(getHighlightRanges("Fig", "figgy")).toEqual([]);
	});

	test("trims the query before matching", () => {
		expect(getHighlightRanges("Apple", " pp ")).toEqual([{ end: 3, start: 1 }]);
	});
});

describe("shouldOfferCreate", () => {
	const base = { allowCustomValue: true, entries, selected: [] as readonly string[] };

	test("false for an empty or blank query", () => {
		expect(shouldOfferCreate({ ...base, query: "" })).toBe(false);
		expect(shouldOfferCreate({ ...base, query: "   " })).toBe(false);
	});

	test("true when no label matches exactly", () => {
		expect(shouldOfferCreate({ ...base, query: "Fiji" })).toBe(true);
		expect(shouldOfferCreate({ ...base, query: "New" })).toBe(true);
	});

	test("false on an exact match after folding", () => {
		expect(shouldOfferCreate({ ...base, query: "new zealand " })).toBe(false);
		expect(shouldOfferCreate({ ...base, query: "osterreich" })).toBe(false);
	});

	test("false when the typed text is already chosen", () => {
		expect(shouldOfferCreate({ ...base, query: "Fiji", selected: ["Fiji"] })).toBe(false);
		expect(shouldOfferCreate({ ...base, query: " fiji", selected: ["Fiji"] })).toBe(false);
	});

	test("false unless custom values are allowed", () => {
		expect(shouldOfferCreate({ ...base, allowCustomValue: false, query: "Fiji" })).toBe(false);
	});
});

describe("resolvePendingRemove", () => {
	const idle = { kind: "idle" } as const;

	test("backspace on an empty query marks the last chip", () => {
		expect(resolvePendingRemove(idle, { chipCount: 3, query: "", type: "backspace" })).toEqual({
			removeIndex: null,
			state: { index: 2, kind: "pending" },
		});
	});

	test("a second backspace removes it", () => {
		expect(resolvePendingRemove({ index: 2, kind: "pending" }, { chipCount: 3, query: "", type: "backspace" })).toEqual(
			{ removeIndex: 2, state: idle }
		);
	});

	test("backspace with text in the query deletes text, not chips", () => {
		expect(resolvePendingRemove(idle, { chipCount: 3, query: "a", type: "backspace" })).toEqual({
			removeIndex: null,
			state: idle,
		});
	});

	test("a keystroke or a blur clears the mark", () => {
		const pending = { index: 1, kind: "pending" } as const;
		expect(resolvePendingRemove(pending, { type: "keystroke" })).toEqual({ removeIndex: null, state: idle });
		expect(resolvePendingRemove(pending, { type: "blur" })).toEqual({ removeIndex: null, state: idle });
	});

	test("no chips, no-op", () => {
		expect(resolvePendingRemove(idle, { chipCount: 0, query: "", type: "backspace" })).toEqual({
			removeIndex: null,
			state: idle,
		});
	});

	test("a stale mark past the end is re-aimed at the last chip", () => {
		expect(resolvePendingRemove({ index: 5, kind: "pending" }, { chipCount: 2, query: "", type: "backspace" })).toEqual(
			{ removeIndex: null, state: { index: 1, kind: "pending" } }
		);
	});
});

describe("resolveQueryReset", () => {
	test("resets a non-empty query with the reason", () => {
		expect(resolveQueryReset("kiw", "select")).toEqual({ reason: "select", value: "" });
		expect(resolveQueryReset("kiw", "close")).toEqual({ reason: "close", value: "" });
		expect(resolveQueryReset("kiw", "clear")).toEqual({ reason: "clear", value: "" });
	});

	test("an empty query has nothing to report", () => {
		expect(resolveQueryReset("", "close")).toBeNull();
	});
});

describe("resolveResultsAnnouncement", () => {
	test("counts results, singular and plural", () => {
		expect(resolveResultsAnnouncement({ count: 1, emptyText: "None", query: "a" })).toBe("1 result");
		expect(resolveResultsAnnouncement({ count: 4, emptyText: "None", query: "a" })).toBe("4 results");
	});

	test("says the empty text when nothing matches", () => {
		expect(resolveResultsAnnouncement({ count: 0, emptyText: "None", query: "a" })).toBe("None");
	});

	test("says nothing before a query is typed", () => {
		expect(resolveResultsAnnouncement({ count: 4, emptyText: "None", query: " " })).toBeNull();
	});

	test("takes a formatter to localise", () => {
		expect(
			resolveResultsAnnouncement({ count: 2, emptyText: "Aucun", format: (n) => `${n} résultats`, query: "a" })
		).toBe("2 résultats");
	});
});

describe("resolveSelectedComboboxOptions", () => {
	test("reads the options behind the values, in the order chosen", () => {
		expect(
			resolveSelectedComboboxOptions({
				allowCustomValue: false,
				entries,
				remembered: new Map(),
				selected: ["au", "nz"],
			})
		).toEqual([au, nz]);
	});

	test("falls back to a remembered option the list no longer holds", () => {
		const remembered = new Map([["aria", { label: "Aria Whitlock", value: "aria" }]]);
		expect(
			resolveSelectedComboboxOptions({ allowCustomValue: false, entries: [], remembered, selected: ["aria"] })
		).toEqual([{ label: "Aria Whitlock", value: "aria" }]);
	});

	test("a custom value is its own label when custom values are allowed", () => {
		expect(
			resolveSelectedComboboxOptions({ allowCustomValue: true, entries, remembered: new Map(), selected: ["Fiji"] })
		).toEqual([{ label: "Fiji", value: "Fiji" }]);
	});

	test("an unknown value is skipped otherwise", () => {
		expect(
			resolveSelectedComboboxOptions({ allowCustomValue: false, entries, remembered: new Map(), selected: ["zz"] })
		).toEqual([]);
	});
});
