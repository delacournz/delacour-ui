import { DEFAULT_CONFIG, type DesignSystemConfig } from "./config";

/**
 * The studio's own look, as a preset.
 *
 * This is what `delacour.co.nz` is set in, mapped onto the customiser's axes:
 * zinc for the near-black page and zinc-900 surfaces, the `delacour` accent for
 * the brand amber, Inter under Outfit, and a corner one step tighter than Vega's.
 * The docs site paints itself from it and the playground opens in it, which is
 * the whole pitch — the theme you build here is the theme you ship — proven on
 * our own two surfaces.
 *
 * It is deliberately **not** `DEFAULT_CONFIG`. The library's default stays the
 * neutral identity theme so a fresh `delacour init` ships exactly what
 * `theme.css` declares; `house.test.ts` pins that distance.
 */
export const HOUSE_CONFIG: DesignSystemConfig = {
	style: "vega",
	baseColor: "zinc",
	theme: "delacour",
	chartColor: "delacour",
	font: "inter",
	fontHeading: "outfit",
	radius: "small",
};

/**
 * `encodePreset(HOUSE_CONFIG)`, written out rather than computed.
 *
 * The code is printed in the docs and baked into the playground's reset, so a
 * codec change that silently moved it would repoint every one of those links.
 * A literal fails the test instead.
 */
export const HOUSE_PRESET_CODE = "AQACGBgCCgLk";

export type PresetShortcut = {
	/** A stable id, used as a key and a query value. */
	readonly name: string;
	readonly title: string;
	/** One line under the title. */
	readonly blurb: string;
	readonly config: DesignSystemConfig;
	readonly code: string;
};

/**
 * The presets both customisers offer as one-tap starting points.
 *
 * Shared here so the web's "Presets" row and the playground's preset strip
 * cannot drift apart. The house leads; the library default follows, because
 * "what a consumer gets" is the second most useful thing to be able to return
 * to.
 */
export const PRESET_SHORTCUTS: readonly PresetShortcut[] = [
	{
		name: "delacour",
		title: "Delacour",
		blurb: "The studio's own: zinc, amber, Inter and Outfit.",
		config: HOUSE_CONFIG,
		code: HOUSE_PRESET_CODE,
	},
	{
		name: "library",
		title: "Library default",
		blurb: "What a fresh install ships: Vega, neutral, the platform font.",
		config: DEFAULT_CONFIG,
		code: "AQAAAAAbAAB9",
	},
];
