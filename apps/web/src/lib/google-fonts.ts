import type { DesignSystemConfig } from "@delacour/design-system/config";
import { FONTS, type FontFamily, fontByName } from "@delacour/design-system/fonts";
import { resolveFonts } from "@delacour/design-system/resolve";

/**
 * The twenty-six families, on a page that until now loaded no webfont at all.
 *
 * The Font axis is the one axis a name cannot carry: "Lora" tells you nothing
 * unless you already know Lora. So the option tiles are set in the face they
 * choose — and the cost of that is twenty-six families on a documentation page,
 * which is why it is done in two requests rather than one.
 *
 * **The order of the two is load-bearing.** The specimen sheet asks for the two
 * glyphs the tiles actually draw, so twenty-six families cost a few kilobytes
 * between them; the second asks for the one or two families the preview panel
 * sets real sentences in, at full coverage. Both declare `@font-face` rules for
 * the same family names, and CSS resolves that by document order — so the full
 * faces have to come **after** the subsetted ones, or the panel would render its
 * paragraph out of a font containing `A` and `g`.
 *
 * Every family here is a Google family: `fonts.ts`'s `name` is the
 * `@expo-google-fonts` slug, and those packages are generated from Google Fonts.
 * `family` is the name embedded in the TTF, which is also the name the CSS API
 * takes.
 */

const CSS_API = "https://fonts.googleapis.com/css2";

/** What a font tile draws. Two glyphs, so the specimen sheet stays small. */
export const SPECIMEN_TEXT = "Ag";

/** After the chosen family, somewhere to go while the webfont loads. */
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

/** A family name as a CSS `font-family` value — quoted, because most of them have spaces. */
export function fontSpecimen(family: string): string {
	return `"${family}", ${FALLBACK}`;
}

/** The weight to ask for, of the ones the family actually ships. */
function weightsFor(font: FontFamily, wanted: readonly number[]): readonly number[] {
	const available = wanted.filter((weight) => font.weights.includes(weight));

	return available.length > 0 ? available : [font.weights[0] ?? 400];
}

/**
 * One `family=` clause.
 *
 * Spaces become `+`, and the weights go up — both are the CSS API's own
 * spelling, and it answers a malformed one with a 400 rather than a fallback.
 */
function clause(font: FontFamily, wanted: readonly number[]): string {
	const name = font.family.replaceAll(" ", "+");
	const weights = [...weightsFor(font, wanted)].sort((a, b) => a - b).join(";");

	return `family=${name}:wght@${weights}`;
}

/**
 * A stylesheet URL for a set of families.
 *
 * **Sorted by family name**, because the CSS API requires it and rejects an
 * unsorted list outright — a rule that is easy to satisfy here and impossible to
 * notice if the list is ever appended to instead.
 */
function stylesheet(fonts: readonly FontFamily[], wanted: readonly number[], text?: string): string {
	const families = [...fonts].sort((a, b) => a.family.localeCompare(b.family)).map((font) => clause(font, wanted));
	const query = [...families, text ? `text=${encodeURIComponent(text)}` : "", "display=swap"].filter(Boolean);

	return `${CSS_API}?${query.join("&")}`;
}

/** Every family, subsetted to the two glyphs a tile draws. */
export function specimenStylesheetHref(): string {
	return stylesheet(FONTS, [400], SPECIMEN_TEXT);
}

/** The one or two families the preview panel sets, at full coverage. */
export function selectedStylesheetHref(config: DesignSystemConfig): string | undefined {
	const { sans, heading } = resolveFonts(config);
	const names = [config.font, config.fontHeading === "inherit" ? config.font : config.fontHeading];
	const fonts = [...new Set(names)].flatMap((name) => {
		const font = fontByName(name);
		return font && (font.family === sans || font.family === heading) ? [font] : [];
	});

	return fonts.length > 0 ? stylesheet(fonts, [400, 600, 700]) : undefined;
}

export type HeadLink = { rel: string; href: string; crossOrigin?: "anonymous" };

/**
 * The route's font links, in the order they have to appear.
 *
 * `preconnect` first because the font files come from a second origin the
 * browser has no reason to have opened; then the specimen sheet; then the
 * selected families, whose full faces must override the two-glyph ones — see the
 * note at the top of this file.
 */
export function themeFontLinks(config: DesignSystemConfig): readonly HeadLink[] {
	const selected = selectedStylesheetHref(config);

	return [
		{ rel: "preconnect", href: "https://fonts.googleapis.com" },
		{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
		{ rel: "stylesheet", href: specimenStylesheetHref() },
		...(selected ? [{ rel: "stylesheet", href: selected }] : []),
	];
}
