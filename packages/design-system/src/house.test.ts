import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, normalizeConfig } from "./config";
import { HOUSE_CONFIG, HOUSE_PRESET_CODE, PRESET_SHORTCUTS } from "./house";
import { decodePreset, encodePreset, PALETTE_ORDINALS } from "./preset";
import { resolveFonts, resolveTokens } from "./resolve";
import { ACCENT_THEMES } from "./themes";

/**
 * The house preset is Delacour's own look, and it is not the library's default.
 *
 * Two things are pinned here. The code, because it is printed in the docs and
 * baked into the playground's "Reset" — a codec change that moved it would send
 * every one of those links to a different theme. And the distance from
 * `DEFAULT_CONFIG`, because a fresh `delacour init` has to keep shipping the
 * neutral identity theme whatever the studio's own site looks like.
 */
describe("the house preset", () => {
	test("has a pinned code", () => {
		expect(encodePreset(HOUSE_CONFIG)).toBe(HOUSE_PRESET_CODE);
		expect(decodePreset(HOUSE_PRESET_CODE)).toEqual(HOUSE_CONFIG);
	});

	test("is already normalised", () => {
		expect(normalizeConfig(HOUSE_CONFIG)).toEqual(HOUSE_CONFIG);
	});

	test("names real faces for both the body and the headings", () => {
		const fonts = resolveFonts(HOUSE_CONFIG);

		expect(fonts.sans).toBe("Inter");
		expect(fonts.heading).toBe("Outfit");
	});

	test("is not the library default, and leaves the default alone", () => {
		expect(HOUSE_CONFIG).not.toEqual(DEFAULT_CONFIG);
		expect(encodePreset(DEFAULT_CONFIG)).toBe("AQAAAAAbAAB9");
	});

	test("paints the brand amber as the dark primary", () => {
		const { dark, light } = resolveTokens(HOUSE_CONFIG);

		expect(dark.primary).toBe("oklch(0.837 0.164 84.429)");
		expect(light.primary).toBe("oklch(0.666 0.157 58.318)");
		expect(dark["chart-2"]).toBe(dark.primary);
	});
});

describe("the delacour accent", () => {
	const accent = ACCENT_THEMES.find((theme) => theme.name === "delacour");

	test("exists, last in the list, with the next free ordinal", () => {
		expect(accent).toBeDefined();
		expect(ACCENT_THEMES.at(-1)?.name).toBe("delacour");
		expect(PALETTE_ORDINALS.delacour).toBe(24);
	});

	test("carries the same nine tokens as every other accent", () => {
		const amber = ACCENT_THEMES.find((theme) => theme.name === "amber");
		if (!accent || !amber) throw new Error("missing accent");

		expect(Object.keys(accent.light).sort()).toEqual(Object.keys(amber.light).sort());
		expect(Object.keys(accent.dark).sort()).toEqual(Object.keys(amber.dark).sort());
	});
});

describe("the preset shortcuts", () => {
	test("lead with the house and offer the library default second", () => {
		expect(PRESET_SHORTCUTS[0]?.code).toBe(HOUSE_PRESET_CODE);
		expect(PRESET_SHORTCUTS[1]?.code).toBe(encodePreset(DEFAULT_CONFIG));
	});

	test("every shortcut decodes to the config it names", () => {
		for (const shortcut of PRESET_SHORTCUTS) {
			expect(decodePreset(shortcut.code)).toEqual(shortcut.config);
			expect(normalizeConfig(shortcut.config)).toEqual(shortcut.config);
		}
	});
});
