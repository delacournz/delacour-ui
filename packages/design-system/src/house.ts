import { DEFAULT_CONFIG, type DesignSystemConfig } from "./config";

/**
 * The studio's own look, as a preset.
 *
 * A greyscale, tactile, keyboard-first interface: a graphite page drawn in alpha
 * hairlines, the whole UI set in JetBrains Mono with Inter reserved for headings,
 * a 10pt corner, and the dense Vela geometry. Colour is left free to mean
 * something — status and chart series — rather than spent on the brand.
 *
 * The docs site paints itself from it and the playground opens in it, which is
 * the whole pitch — the theme you build here is the theme you ship — proven on
 * our own two surfaces.
 *
 * It is deliberately **not** `DEFAULT_CONFIG`. The library's default stays the
 * neutral identity theme so a fresh `delacour init` ships exactly what
 * `theme.css` declares; `house.test.ts` pins that distance.
 */
export const HOUSE_CONFIG: DesignSystemConfig = {
	style: "vela",
	baseColor: "graphite",
	theme: "graphite",
	chartColor: "graphite",
	font: "jetbrains-mono",
	fontHeading: "inter",
	radius: "medium",
};

/**
 * `encodePreset(HOUSE_CONFIG)`, written out rather than computed.
 *
 * The code is printed in the docs and baked into the playground's reset, so a
 * codec change that silently moved it would repoint every one of those links.
 * A literal fails the test instead.
 */
export const HOUSE_PRESET_CODE = "AQgHGRkTAgO_";

/**
 * The studio's previous look, kept as a starting point: delacour.co.nz's zinc
 * page, the brand amber, Inter under Outfit.
 */
export const DELACOUR_AMBER_CONFIG: DesignSystemConfig = {
	style: "vega",
	baseColor: "zinc",
	theme: "delacour",
	chartColor: "delacour",
	font: "inter",
	fontHeading: "outfit",
	radius: "small",
};

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
		blurb: "The studio's own: graphite, hairlines, JetBrains Mono and Inter.",
		config: HOUSE_CONFIG,
		code: HOUSE_PRESET_CODE,
	},
	{
		name: "delacour-amber",
		title: "Delacour amber",
		blurb: "The studio site: zinc, amber, Inter and Outfit.",
		config: DELACOUR_AMBER_CONFIG,
		code: "AQACGBgCCgLk",
	},
	{
		name: "library",
		title: "Library default",
		blurb: "What a fresh install ships: Vega, neutral, the platform font.",
		config: DEFAULT_CONFIG,
		code: "AQAAAAAbAAB9",
	},
];
