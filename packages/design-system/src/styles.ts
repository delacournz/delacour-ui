/**
 * The geometry half of a design system: how big things are, and how round.
 *
 * shadcn's own styles are ~420 `@apply` rules per style — `.cn-button` is
 * `h-9 rounded-md text-sm` under Vega and `h-8 rounded-2xl text-sm` under Rhea.
 * None of it is tokens. That shape does not port: this library expresses the
 * same decisions as `--spacing-button-*`, `--text-button-*` and `--radius`, so
 * a style here is a bundle of those numbers rather than a stylesheet.
 *
 * What that buys is real — height, corner and type scale are most of what
 * separates Vega from Rhea from Lyra. What it cannot buy is Sera, whose
 * character is `uppercase` and `tracking-widest` on ~44 rules: both are classes
 * on a label, not values a variable can carry. Sera below is square and tight,
 * which is the part of it that is expressible; the letterforms are not.
 *
 * Values are NUMBERS, not `"44px"` strings. Uniwind's `createVarGetter` parses
 * colours with culori and passes everything else through unchanged, so a length
 * reaches React Native as a string and every numeric style prop — `height`,
 * `borderRadius`, `fontSize` — ignores it with no error at all.
 */

export type StyleName = "vega" | "nova" | "maia" | "lyra" | "mira" | "luma" | "sera" | "rhea";

/** The geometry tokens a style writes, without the leading `--`. */
export type GeometryValues = {
	radius: number;
	"spacing-button-sm": number;
	"spacing-button-md": number;
	"spacing-button-lg": number;
	"text-button-sm": number;
	"text-button-md": number;
	"text-button-lg": number;
	"radius-button-sm": number;
	"radius-button-md": number;
	"radius-button-lg": number;
	"spacing-input-sm": number;
	"spacing-input-md": number;
	"spacing-input-lg": number;
	"text-input-sm": number;
	"text-input-md": number;
	"text-input-lg": number;
	"spacing-icon-xs": number;
	"spacing-icon-sm": number;
	"spacing-icon-md": number;
	"spacing-icon-lg": number;
	"spacing-icon-xl": number;
	"spacing-icon-2xl": number;
	"spacing-navbar-row": number;
	"spacing-screen-gutter": number;
};

export type Style = {
	name: StyleName;
	title: string;
	/** One line, shown under the name in the picker. shadcn's own wording. */
	description: string;
	geometry: GeometryValues;
};

/**
 * The three control heights, the type paired with each, and the icon scale.
 *
 * A style names one density and everything steps from it, rather than listing
 * two dozen numbers per style and inviting them to drift out of proportion.
 * `heights` are the button and input scales, which the library keeps separate
 * but which no style has yet had a reason to disagree on.
 */
function geometry({
	radius,
	heights,
	text,
	icons,
	navbar,
	gutter,
	buttonRadius,
}: {
	radius: number;
	heights: readonly [number, number, number];
	text: readonly [number, number, number];
	icons: readonly [number, number, number, number, number, number];
	navbar: number;
	gutter: number;
	/**
	 * The button's own corner. Capped at half its height by the caller, because
	 * past that the renderer clamps and the number stops meaning what it says.
	 */
	buttonRadius: readonly [number, number, number];
}): GeometryValues {
	return {
		radius,
		"spacing-button-sm": heights[0],
		"spacing-button-md": heights[1],
		"spacing-button-lg": heights[2],
		"text-button-sm": text[0],
		"text-button-md": text[1],
		"text-button-lg": text[2],
		"radius-button-sm": Math.min(buttonRadius[0], heights[0] / 2),
		"radius-button-md": Math.min(buttonRadius[1], heights[1] / 2),
		"radius-button-lg": Math.min(buttonRadius[2], heights[2] / 2),
		"spacing-input-sm": heights[0],
		"spacing-input-md": heights[1],
		"spacing-input-lg": heights[2],
		"text-input-sm": text[0],
		"text-input-md": text[1],
		"text-input-lg": text[2],
		"spacing-icon-xs": icons[0],
		"spacing-icon-sm": icons[1],
		"spacing-icon-md": icons[2],
		"spacing-icon-lg": icons[3],
		"spacing-icon-xl": icons[4],
		"spacing-icon-2xl": icons[5],
		"spacing-navbar-row": navbar,
		"spacing-screen-gutter": gutter,
	};
}

const LIBRARY_HEIGHTS = [36, 44, 52] as const;
const LIBRARY_TEXT = [14, 16, 18] as const;
const LIBRARY_ICONS = [14, 16, 18, 20, 24, 32] as const;
const CAPSULE = [18, 22, 26] as const;

/**
 * Eight styles, in shadcn's own order, with its own one-line descriptions.
 *
 * Vega is the library's current numbers exactly, so it is the identity element:
 * selecting it must leave the app looking as it does with no customizer at all.
 * `styles.test.ts` asserts that against `theme.css` rather than trusting it.
 */
export const STYLES: readonly Style[] = [
	{
		name: "vega",
		title: "Vega",
		description: "Clean, neutral, and familiar",
		geometry: geometry({
			radius: 10,
			heights: LIBRARY_HEIGHTS,
			text: LIBRARY_TEXT,
			icons: LIBRARY_ICONS,
			navbar: 56,
			gutter: 20,
			buttonRadius: CAPSULE,
		}),
	},
	{
		name: "nova",
		title: "Nova",
		description: "Reduced padding and margins",
		geometry: geometry({
			radius: 12,
			heights: [34, 42, 50],
			text: LIBRARY_TEXT,
			icons: LIBRARY_ICONS,
			navbar: 54,
			gutter: 16,
			buttonRadius: [12, 14, 16],
		}),
	},
	{
		name: "maia",
		title: "Maia",
		description: "Rounded, with generous spacing",
		geometry: geometry({
			radius: 20,
			heights: [40, 48, 56],
			text: LIBRARY_TEXT,
			icons: [16, 18, 20, 22, 26, 34],
			navbar: 60,
			gutter: 24,
			buttonRadius: CAPSULE,
		}),
	},
	{
		name: "lyra",
		title: "Lyra",
		description: "Boxy and sharp. For mono fonts",
		geometry: geometry({
			radius: 0,
			heights: [32, 40, 48],
			text: [13, 14, 16],
			icons: [13, 15, 16, 18, 22, 30],
			navbar: 52,
			gutter: 16,
			buttonRadius: [0, 0, 0],
		}),
	},
	{
		name: "mira",
		title: "Mira",
		description: "Made for compact interfaces",
		geometry: geometry({
			radius: 8,
			heights: [30, 38, 46],
			text: [13, 14, 16],
			icons: [13, 15, 16, 18, 22, 30],
			navbar: 50,
			gutter: 14,
			buttonRadius: [8, 9, 10],
		}),
	},
	{
		name: "luma",
		title: "Luma",
		description: "Fluid, luminous, and soft",
		geometry: geometry({
			radius: 24,
			heights: [38, 46, 54],
			text: LIBRARY_TEXT,
			icons: LIBRARY_ICONS,
			navbar: 58,
			gutter: 22,
			buttonRadius: CAPSULE,
		}),
	},
	{
		name: "sera",
		title: "Sera",
		description: "Editorial and typographic",
		// Square and tight is the half of Sera a token can carry. Its uppercase
		// letterforms and wide tracking live on ~44 label rules in shadcn's
		// stylesheet, and neither is a value a CSS variable can hold.
		geometry: geometry({
			radius: 0,
			heights: [34, 42, 50],
			text: [13, 15, 17],
			icons: [14, 15, 17, 19, 23, 31],
			navbar: 56,
			gutter: 24,
			buttonRadius: [0, 0, 0],
		}),
	},
	{
		name: "rhea",
		title: "Rhea",
		description: "Like Luma but compact",
		geometry: geometry({
			radius: 16,
			heights: [32, 40, 48],
			text: [13, 14, 16],
			icons: [13, 15, 16, 18, 22, 30],
			navbar: 52,
			gutter: 18,
			buttonRadius: CAPSULE,
		}),
	},
];

/**
 * Every geometry name a style writes, as a literal list.
 *
 * `emit.ts` splits a resolved theme against this to decide which values take
 * `px` and which are colours, so it has to be readable without reaching into
 * `STYLES[0]` — and a literal is the version a reader can check. `styles.test`
 * asserts it against the real keys, which is what stops it drifting.
 */
export const GEOMETRY_TOKENS: readonly (keyof GeometryValues)[] = [
	"radius",
	"spacing-button-sm",
	"spacing-button-md",
	"spacing-button-lg",
	"text-button-sm",
	"text-button-md",
	"text-button-lg",
	"radius-button-sm",
	"radius-button-md",
	"radius-button-lg",
	"spacing-input-sm",
	"spacing-input-md",
	"spacing-input-lg",
	"text-input-sm",
	"text-input-md",
	"text-input-lg",
	"spacing-icon-xs",
	"spacing-icon-sm",
	"spacing-icon-md",
	"spacing-icon-lg",
	"spacing-icon-xl",
	"spacing-icon-2xl",
	"spacing-navbar-row",
	"spacing-screen-gutter",
];

export function styleByName(name: string): Style | undefined {
	return STYLES.find((style) => style.name === name);
}
