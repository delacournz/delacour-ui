import { type FontFamily, fontByName } from "@delacour/design-system/fonts";
import { HOUSE_CONFIG } from "@delacour/design-system/house";

/**
 * The house preset, as the docs site reads it.
 *
 * `HOUSE_CONFIG` names a sans and a heading face on the customiser's own axes.
 * It cannot name a code face — the design system has no mono rail — so the
 * site names one here, by catalogue id, and every other fact about it (the
 * family string Google Fonts takes, the weights it ships) still comes from
 * `fonts.ts` rather than being typed twice.
 */
export const HOUSE_MONO_FONT = "geist-mono";

/**
 * The three families the whole site loads: body, headings and code.
 *
 * Deduplicated, because a heading that inherits the body would otherwise
 * request Inter twice — and the CSS API 400s a repeated family.
 */
export function houseFonts(): readonly FontFamily[] {
	const names = [
		HOUSE_CONFIG.font,
		HOUSE_CONFIG.fontHeading === "inherit" ? HOUSE_CONFIG.font : HOUSE_CONFIG.fontHeading,
		HOUSE_MONO_FONT,
	];

	return [...new Set(names)].flatMap((name) => {
		const font = fontByName(name);
		if (!font) throw new Error(`the house preset names a font that is not in the catalogue: "${name}"`);
		return [font];
	});
}

/** Is this family one the site already carries at full coverage? */
export function isHouseFont(font: FontFamily): boolean {
	return houseFonts().some((candidate) => candidate.name === font.name);
}
