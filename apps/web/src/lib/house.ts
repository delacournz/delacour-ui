import { type FontFamily, fontByName } from "@delacour/design-system/fonts";
import { HOUSE_CONFIG } from "@delacour/design-system/house";

/**
 * The house preset, as the docs site reads it.
 *
 * `HOUSE_CONFIG` sets the whole UI, headings included, in JetBrains Mono,
 * so the body, heading and code faces are the same family. The site still names
 * its code face here, by catalogue id, so a house that moves its body back to
 * a sans keeps a mono for code; every other fact about it (the family string
 * Google Fonts takes, the weights it ships) comes from `fonts.ts` rather than
 * being typed twice.
 */
export const HOUSE_MONO_FONT = "jetbrains-mono";

/**
 * The families the whole site loads: body, headings and code.
 *
 * Deduplicated: with heading, body and code all JetBrains Mono, only one
 * family loads. A repeat would be requested twice, and the CSS API 400s a
 * repeated family.
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
