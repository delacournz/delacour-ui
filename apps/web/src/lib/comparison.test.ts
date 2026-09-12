import { describe, expect, test } from "bun:test";
import {
	CODE_SAMPLES,
	HEADLINE_SECTION,
	MAX_SAMPLE_LINE,
	PRODUCT_IDS,
	PRODUCTS,
	type ProductId,
	type Row,
	SECTIONS,
	type Section,
	SOURCES,
} from "./comparison";

/**
 * The comparison page makes claims about somebody else's product, so the
 * shape it makes them in is the thing worth pinning.
 *
 * Two of these are honesty tests rather than rendering tests. A comparison
 * table where one column ticks every row is a table nobody believes, and it is
 * also the state this file would drift into one edit at a time — so the drift
 * is a failing test rather than a reviewer's judgement call. The rest hold the
 * contract `routes/compare/heroui.tsx` renders against: three answers per row,
 * a note under every mark, and a source for the lot.
 */

const ROWS: Row[] = SECTIONS.flatMap((section) => [...section.rows]);

function answers(row: Row) {
	return PRODUCT_IDS.map((id) => row[id]);
}

/** Does one product tick every row of a section while no other product ticks any? */
function sweeps(section: Section, id: ProductId): boolean {
	const others = PRODUCT_IDS.filter((other) => other !== id);
	return section.rows.every(
		(row) => row[id].support === "yes" && others.every((other) => row[other].support !== "yes")
	);
}

describe("comparison data", () => {
	// A walker that found nothing would let every assertion below pass vacuously.
	test("has sections, and rows in each", () => {
		expect(SECTIONS.length).toBeGreaterThanOrEqual(4);
		for (const section of SECTIONS) expect(section.rows.length).toBeGreaterThan(0);
	});

	test("section ids are unique", () => {
		const ids = SECTIONS.map((section) => section.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test("the headline section exists", () => {
		expect(SECTIONS.some((section) => section.id === HEADLINE_SECTION)).toBe(true);
	});

	test("every section carries a blurb", () => {
		const bare = SECTIONS.filter((section) => section.blurb.trim().length < 40).map((section) => section.id);
		expect(bare).toEqual([]);
	});

	// The feature is the row's key in the render, so a repeat is also a duplicate
	// React key.
	test("no feature is claimed twice", () => {
		const features = ROWS.map((row) => row.feature);
		const repeated = features.filter((feature, index) => features.indexOf(feature) !== index);
		expect(repeated).toEqual([]);
	});
});

/**
 * The rendering contract. The page draws a mark and prints the note under it,
 * so a missing note is a bare tick — the exact thing this page must not put in
 * front of a reader — and a note ending in a full stop reads as a sentence in
 * a cell that is not one.
 */
describe("every row answers for all three products", () => {
	test("every answer carries a note", () => {
		const bare = ROWS.filter((row) => answers(row).some((answer) => answer.note.trim().length === 0)).map(
			(row) => row.feature
		);
		expect(bare).toEqual([]);
	});

	test("notes are fragments, not sentences", () => {
		const punctuated = ROWS.flatMap((row) =>
			answers(row)
				.filter((answer) => answer.note.trim() !== answer.note || answer.note.endsWith("."))
				.map((answer) => `${row.feature} → ${answer.note}`)
		);
		expect(punctuated).toEqual([]);
	});

	test("the products are the three columns the rows answer for", () => {
		expect(PRODUCTS.map((product) => product.id)).toEqual([...PRODUCT_IDS]);
	});
});

/**
 * The honesty invariants.
 *
 * These are the two claims the page makes about itself — that it measured more
 * than the one axis Delacour wins, and that it says so where the answer goes
 * the other way. Neither survives a well-meaning edit that "tidies" a
 * concession away, which is why both are here rather than in a review
 * checklist.
 */
describe("the page concedes", () => {
	test("Delacour does not win every row", () => {
		const conceded = ROWS.filter((row) => row.delacour.support !== "yes");
		expect(conceded.length).toBeGreaterThanOrEqual(4);
	});

	test("at least one row is a clean win for HeroUI over Delacour", () => {
		const clean = ROWS.filter((row) => row.delacour.support === "no" && row.heroui.support === "yes");
		expect(clean.length).toBeGreaterThan(0);
	});

	test("no section is a clean sweep for one product", () => {
		const swept = SECTIONS.filter((section) => PRODUCT_IDS.some((id) => sweeps(section, id))).map(
			(section) => section.id
		);
		expect(swept).toEqual([]);
	});
});

describe("sources", () => {
	test("every source is an https URL with a label", () => {
		const wrong = SOURCES.filter((source) => !source.href.startsWith("https://") || source.label.trim() === "").map(
			(source) => source.href
		);
		expect(wrong).toEqual([]);
	});

	test("both HeroUI properties are cited", () => {
		expect(SOURCES.some((source) => source.href.includes("heroui.com"))).toBe(true);
		expect(SOURCES.some((source) => source.href.includes("heroui.pro"))).toBe(true);
	});
});

/**
 * The samples are illustrations, but their width is a layout constraint: the
 * block they render into is half a 1380px page, and a `<pre>` wider than that
 * scrolls inside itself rather than wrapping. A long line is therefore clipped
 * mid-sentence on an ordinary desktop, with nothing to see wrong — which is
 * exactly what shipped the first time, on the one section carrying the whole
 * argument.
 */
describe("code samples fit the block they render into", () => {
	const samples = Object.entries(CODE_SAMPLES);

	test("finds both samples", () => {
		expect(samples.map(([name]) => name).sort()).toEqual(["variant", "wrapper"]);
	});

	test("no line is wider than the block", () => {
		const wide = samples.flatMap(([name, code]) =>
			code
				.split("\n")
				.filter((line) => line.length > MAX_SAMPLE_LINE)
				.map((line) => `${name}: ${line.length} chars — ${line}`)
		);
		expect(wide).toEqual([]);
	});

	// A sample that lost its point is worse than one that is too wide.
	test("each sample still names the file it is", () => {
		expect(CODE_SAMPLES.wrapper).toContain("node_modules/heroui-native");
		expect(CODE_SAMPLES.variant).toContain("app/components/ui/");
	});
});
