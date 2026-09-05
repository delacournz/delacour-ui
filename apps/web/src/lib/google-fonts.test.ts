import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, type DesignSystemConfig } from "@delacour/design-system/config";
import { FONTS } from "@delacour/design-system/fonts";
import {
	fontSpecimen,
	SPECIMEN_TEXT,
	selectedStylesheetHref,
	specimenStylesheetHref,
	themeFontLinks,
} from "./google-fonts";

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

const families = (href: string): string[] =>
	[...new URL(href).searchParams.getAll("family")].map((clause) => clause.split(":")[0] ?? "");

describe("specimenStylesheetHref", () => {
	test("names every family in the catalogue", () => {
		expect(families(specimenStylesheetHref())).toHaveLength(FONTS.length);
	});

	/**
	 * The CSS API rejects an unsorted list outright, and a 400 here is invisible:
	 * the tiles simply render in the page font and look like a design decision.
	 */
	test("in the order the CSS API demands", () => {
		const names = families(specimenStylesheetHref());

		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
	});

	test("subsetted to the glyphs a tile actually draws", () => {
		expect(new URL(specimenStylesheetHref()).searchParams.get("text")).toBe(SPECIMEN_TEXT);
	});

	test("spaces are the `+` the API spells them with, not `%20`", () => {
		expect(specimenStylesheetHref()).toContain("family=Space+Grotesk");
		expect(specimenStylesheetHref()).not.toContain("%20");
	});

	/**
	 * Instrument Serif ships one face. Asking a family for a weight it does not
	 * have is a 400 for the whole request, so it would cost all twenty-six.
	 */
	test("asks each family only for weights it ships", () => {
		const clauses = new URL(specimenStylesheetHref()).searchParams.getAll("family");

		for (const clause of clauses) {
			const [name, spec] = clause.split(":wght@");
			const font = FONTS.find((candidate) => candidate.family === name?.replaceAll("+", " "));
			const weights = (spec ?? "").split(";").map(Number);

			expect({ name, unsupported: weights.filter((weight) => !font?.weights.includes(weight)) }).toEqual({
				name,
				unsupported: [],
			});
		}
	});
});

describe("selectedStylesheetHref", () => {
	test("one family when the heading inherits", () => {
		expect(families(selectedStylesheetHref(DEFAULT_CONFIG) ?? "")).toEqual(["Geist"]);
	});

	test("both when it does not", () => {
		const href = selectedStylesheetHref(config({ font: "lora", fontHeading: "space-grotesk" })) ?? "";

		// `searchParams` decodes the API's `+` back to a space; the raw `+` is
		// asserted against the URL string above.
		expect(families(href).sort()).toEqual(["Lora", "Space Grotesk"]);
	});

	test("and it is not subsetted — the panel sets whole sentences", () => {
		expect(new URL(selectedStylesheetHref(DEFAULT_CONFIG) ?? "").searchParams.get("text")).toBeNull();
	});
});

/**
 * Both sheets declare `@font-face` for the selected family, and CSS resolves
 * that by document order. Full coverage last, or the preview panel renders its
 * paragraph out of a font containing `A` and `g`.
 */
test("the full faces are requested after the two-glyph ones", () => {
	const sheets = themeFontLinks(DEFAULT_CONFIG).filter((link) => link.rel === "stylesheet");

	expect(sheets.map((link) => link.href)).toEqual([
		specimenStylesheetHref(),
		selectedStylesheetHref(DEFAULT_CONFIG) ?? "",
	]);
});

test("preconnects to the origin the font files come from", () => {
	const preconnects = themeFontLinks(DEFAULT_CONFIG).filter((link) => link.rel === "preconnect");

	expect(preconnects.map((link) => link.href)).toContain("https://fonts.gstatic.com");
});

describe("fontSpecimen", () => {
	test("quotes the family, because most of them have spaces", () => {
		expect(fontSpecimen("Space Grotesk")).toStartWith('"Space Grotesk", ');
	});

	test("and leaves somewhere to go while the webfont loads", () => {
		expect(fontSpecimen("Geist")).toContain("system-ui");
	});
});
