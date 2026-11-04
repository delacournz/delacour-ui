import { describe, expect, test } from "bun:test";
import { MARKETING_PATHS as PATHS } from "../sitemap";
import { COMPARISONS, comparisonBySlug, HUB_ENTRIES } from "./index";

const MARKETING_PATHS: readonly string[] = PATHS;

/**
 * Each two-way comparison is a statement about somebody else's product, held
 * to the rules `comparison.test.ts` holds the HeroUI page to: every claim has a
 * note, the page prints its sources, and the table concedes something.
 */
describe.each(COMPARISONS.map((comparison) => [comparison.slug, comparison] as const))("%s", (_slug, comparison) => {
	const rows = comparison.sections.flatMap((section) => section.rows);

	test("every answer carries a note, with no trailing full stop", () => {
		for (const row of rows) {
			for (const answer of [row.delacour, row.them]) {
				expect(answer.note.length).toBeGreaterThan(0);
				expect(answer.note.endsWith(".")).toBe(false);
			}
		}
	});

	test("Delacour does not win every row", () => {
		const losses = rows.filter((row) => row.them.support === "yes" && row.delacour.support !== "yes");
		expect(losses.length).toBeGreaterThanOrEqual(2);
	});

	test("no section is a sweep for either side", () => {
		for (const section of comparison.sections) {
			const ours = section.rows.every((row) => row.delacour.support === "yes" && row.them.support !== "yes");
			const theirs = section.rows.every((row) => row.them.support === "yes" && row.delacour.support !== "yes");
			expect({ section: section.id, sweep: ours || theirs }).toEqual({ section: section.id, sweep: false });
		}
	});

	test("prints at least two sources, each an https URL", () => {
		expect(comparison.sources.length).toBeGreaterThanOrEqual(2);
		for (const source of comparison.sources) expect(source.href).toStartWith("https://");
	});

	test("has no prices", () => {
		const text = JSON.stringify(comparison);
		expect(text).not.toMatch(/[$€£]\s?\d/);
	});

	test("is in the sitemap and looks itself up by slug", () => {
		expect(MARKETING_PATHS).toContain(`/compare/${comparison.slug}`);
		expect(comparisonBySlug(comparison.slug)).toBe(comparison);
	});

	test("title and description fit a results page", () => {
		expect(comparison.title.length).toBeLessThanOrEqual(60);
		expect(comparison.description.length).toBeLessThanOrEqual(160);
	});
});

describe("HUB_ENTRIES", () => {
	test("lists HeroUI Native and every two-way comparison, each with a sitemap path", () => {
		const paths = HUB_ENTRIES.map((entry) => entry.path);

		expect(paths).toContain("/compare/heroui");
		for (const comparison of COMPARISONS) expect(paths).toContain(`/compare/${comparison.slug}`);
		for (const path of paths) expect(MARKETING_PATHS).toContain(path);
		expect(MARKETING_PATHS).toContain("/compare");
	});

	test("an unknown slug finds nothing", () => {
		expect(comparisonBySlug("heroui")).toBeUndefined();
		expect(comparisonBySlug("nope")).toBeUndefined();
	});
});
