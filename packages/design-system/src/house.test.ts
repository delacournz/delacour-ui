import { describe, expect, test } from "bun:test";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, normalizeConfig } from "./config";
import { DELACOUR_AMBER_CONFIG, HOUSE_CONFIG, HOUSE_PRESET_CODE, PRESET_SHORTCUTS } from "./house";
import { BASE_COLOR_ORDINALS, decodePreset, encodePreset, PALETTE_ORDINALS, STYLE_ORDINALS } from "./preset";
import { resolveFonts, resolveTokens } from "./resolve";
import { styleByName } from "./styles";
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

		expect(fonts.sans).toBe("JetBrains Mono");
		expect(fonts.heading).toBe("JetBrains Mono");
	});

	test("is not the library default, and leaves the default alone", () => {
		expect(HOUSE_CONFIG).not.toEqual(DEFAULT_CONFIG);
		expect(encodePreset(DEFAULT_CONFIG)).toBe("AQAAAAAbAAB9");
	});

	test("is greyscale: the primary is near-black in light and near-white in dark", () => {
		const { dark, light } = resolveTokens(HOUSE_CONFIG);

		expect(light.primary).toBe("oklch(0.269 0 0)");
		expect(dark.primary).toBe("oklch(0.97 0 0)");
	});

	test("draws hairlines in alpha, so they sit on any surface", () => {
		const { dark, light } = resolveTokens(HOUSE_CONFIG);

		expect(light.border).toBe("oklch(0 0 0 / 12%)");
		expect(dark.border).toBe("oklch(1 0 0 / 10%)");
		expect(light.input).toBe("oklch(0 0 0 / 14%)");
		expect(dark.input).toBe("oklch(1 0 0 / 12%)");
	});

	test("sits on a graphite page with a lifted card and a recessed sidebar", () => {
		const { dark } = resolveTokens(HOUSE_CONFIG);

		expect(dark.background).toBe("oklch(0.188 0 0)");
		expect(dark.card).toBe("oklch(0.204 0 0)");
		expect(dark.sidebar).toBe("oklch(0.178 0 0)");
	});

	test("is dense: devl's 36pt touch control, 32pt small, under a 10pt corner", () => {
		const { light } = resolveTokens(HOUSE_CONFIG);

		expect(light["spacing-button-md"]).toBe(36);
		expect(light["spacing-button-sm"]).toBe(32);
		expect(light.radius).toBe(10);
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

describe("the graphite base and the vela style", () => {
	test("graphite is appended with the next free ordinals", () => {
		expect(BASE_COLORS.at(-1)?.name).toBe("graphite");
		expect(BASE_COLOR_ORDINALS.graphite).toBe(7);
		expect(PALETTE_ORDINALS.graphite).toBe(25);
	});

	test("graphite carries the same tokens as neutral", () => {
		const neutral = BASE_COLORS.find((base) => base.name === "neutral");
		const graphite = BASE_COLORS.find((base) => base.name === "graphite");
		if (!neutral || !graphite) throw new Error("missing base");

		expect(Object.keys(graphite.light).sort()).toEqual(Object.keys(neutral.light).sort());
		expect(Object.keys(graphite.dark).sort()).toEqual(Object.keys(neutral.dark).sort());
	});

	test("vela is appended with the next free ordinal", () => {
		expect(styleByName("vela")).toBeDefined();
		expect(STYLE_ORDINALS.vela).toBe(8);
	});
});

describe("the preset shortcuts", () => {
	test("lead with the house, keep the amber studio second, the library default third", () => {
		expect(PRESET_SHORTCUTS[0]?.code).toBe(HOUSE_PRESET_CODE);
		expect(PRESET_SHORTCUTS[1]?.config).toEqual(DELACOUR_AMBER_CONFIG);
		expect(PRESET_SHORTCUTS[2]?.code).toBe(encodePreset(DEFAULT_CONFIG));
	});

	test("every shortcut decodes to the config it names", () => {
		for (const shortcut of PRESET_SHORTCUTS) {
			expect(decodePreset(shortcut.code)).toEqual(shortcut.config);
			expect(normalizeConfig(shortcut.config)).toEqual(shortcut.config);
		}
	});
});
