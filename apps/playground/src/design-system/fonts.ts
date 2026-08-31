/** Which of the three rails a family belongs to, and which picker group it lands in. */
export type FontType = "sans" | "mono" | "serif";

export type FontFamily = {
	/** Stable id, kebab-case; also the @expo-google-fonts slug. */
	name: string;
	/** Shown in the picker. */
	title: string;
	type: FontType;
	/** The family name embedded in the TTF — what iOS registers and what --font-sans is set to. */
	family: string;
	/** The `<Stem>` in `<Stem>_400Regular.ttf` inside the package. */
	file: string;
	/** The weights the package actually ships, of the four the library uses. */
	weights: readonly number[];
};

/**
 * The twenty-six Google families shadcn's create customizer offers, in its order.
 *
 * `family` is the value `--font-sans` and `--font-heading` are set to, and it is
 * the one field here that cannot be guessed from the others. iOS registers a face
 * under the name embedded in the TTF, not under the filename or the package slug,
 * and a `fontFamily` that names no registered face **falls back to the system font
 * with no error, no warning and no red box** — the only symptom is that the type
 * looks slightly wrong in a screenshot. So every value below was read out of the
 * font binary's `name` table rather than inferred: the typographic family, nameID
 * 16, falling back to nameID 1 where the face is one of the four RIBBI styles and
 * carries no nameID 16 of its own. Both resolve to the same string for all
 * twenty-six, which is what makes the plain human family name safe to rely on.
 *
 * `file` is separate for the same reason, and differs from `family` wherever the
 * name has a space: the package ships `SpaceGrotesk_400Regular.ttf` under the
 * family `Space Grotesk`.
 *
 * `weights` is per-family because the packages are not uniform. Most ship far more
 * than the four the library asks for, but the set is a property of the family, not
 * of this list — Instrument Serif has exactly one face, and asking `expo-font` for
 * a weight the package does not export is a build-time resolution failure, not a
 * graceful degradation.
 */
export const FONTS: readonly FontFamily[] = [
	{
		name: "geist",
		title: "Geist",
		type: "sans",
		family: "Geist",
		file: "Geist",
		weights: [400, 500, 600, 700],
	},
	{
		name: "inter",
		title: "Inter",
		type: "sans",
		family: "Inter",
		file: "Inter",
		weights: [400, 500, 600, 700],
	},
	{
		name: "noto-sans",
		title: "Noto Sans",
		type: "sans",
		family: "Noto Sans",
		file: "NotoSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "nunito-sans",
		title: "Nunito Sans",
		type: "sans",
		family: "Nunito Sans",
		file: "NunitoSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "figtree",
		title: "Figtree",
		type: "sans",
		family: "Figtree",
		file: "Figtree",
		weights: [400, 500, 600, 700],
	},
	{
		name: "roboto",
		title: "Roboto",
		type: "sans",
		family: "Roboto",
		file: "Roboto",
		weights: [400, 500, 600, 700],
	},
	{
		name: "raleway",
		title: "Raleway",
		type: "sans",
		family: "Raleway",
		file: "Raleway",
		weights: [400, 500, 600, 700],
	},
	{
		name: "dm-sans",
		title: "DM Sans",
		type: "sans",
		family: "DM Sans",
		file: "DMSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "public-sans",
		title: "Public Sans",
		type: "sans",
		family: "Public Sans",
		file: "PublicSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "outfit",
		title: "Outfit",
		type: "sans",
		family: "Outfit",
		file: "Outfit",
		weights: [400, 500, 600, 700],
	},
	{
		name: "oxanium",
		title: "Oxanium",
		type: "sans",
		family: "Oxanium",
		file: "Oxanium",
		weights: [400, 500, 600, 700],
	},
	{
		name: "manrope",
		title: "Manrope",
		type: "sans",
		family: "Manrope",
		file: "Manrope",
		weights: [400, 500, 600, 700],
	},
	{
		name: "space-grotesk",
		title: "Space Grotesk",
		type: "sans",
		family: "Space Grotesk",
		file: "SpaceGrotesk",
		weights: [400, 500, 600, 700],
	},
	{
		name: "montserrat",
		title: "Montserrat",
		type: "sans",
		family: "Montserrat",
		file: "Montserrat",
		weights: [400, 500, 600, 700],
	},
	{
		name: "ibm-plex-sans",
		title: "IBM Plex Sans",
		type: "sans",
		family: "IBM Plex Sans",
		file: "IBMPlexSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "source-sans-3",
		title: "Source Sans 3",
		type: "sans",
		family: "Source Sans 3",
		file: "SourceSans3",
		weights: [400, 500, 600, 700],
	},
	{
		name: "instrument-sans",
		title: "Instrument Sans",
		type: "sans",
		family: "Instrument Sans",
		file: "InstrumentSans",
		weights: [400, 500, 600, 700],
	},
	{
		name: "geist-mono",
		title: "Geist Mono",
		type: "mono",
		family: "Geist Mono",
		file: "GeistMono",
		weights: [400, 500],
	},
	{
		name: "jetbrains-mono",
		title: "JetBrains Mono",
		type: "mono",
		family: "JetBrains Mono",
		file: "JetBrainsMono",
		weights: [400, 500],
	},
	{
		name: "noto-serif",
		title: "Noto Serif",
		type: "serif",
		family: "Noto Serif",
		file: "NotoSerif",
		weights: [400, 500, 600, 700],
	},
	{
		name: "roboto-slab",
		title: "Roboto Slab",
		type: "serif",
		family: "Roboto Slab",
		file: "RobotoSlab",
		weights: [400, 500, 600, 700],
	},
	{
		name: "merriweather",
		title: "Merriweather",
		type: "serif",
		family: "Merriweather",
		file: "Merriweather",
		weights: [400, 500, 600, 700],
	},
	{
		name: "lora",
		title: "Lora",
		type: "serif",
		family: "Lora",
		file: "Lora",
		weights: [400, 500, 600, 700],
	},
	{
		name: "playfair-display",
		title: "Playfair Display",
		type: "serif",
		family: "Playfair Display",
		file: "PlayfairDisplay",
		weights: [400, 500, 600, 700],
	},
	{
		name: "eb-garamond",
		title: "EB Garamond",
		type: "serif",
		family: "EB Garamond",
		file: "EBGaramond",
		weights: [400, 500, 600, 700],
	},
	// The package ships one face. Every heading weight renders as the regular.
	{
		name: "instrument-serif",
		title: "Instrument Serif",
		type: "serif",
		family: "Instrument Serif",
		file: "InstrumentSerif",
		weights: [400],
	},
];

export type FontGroup = {
	type: FontType;
	label: string;
	fonts: readonly FontFamily[];
};

/**
 * The picker's three sections, in the picker's order.
 *
 * Sans before mono before serif is shadcn's ordering, not an alphabetisation and
 * not a count — it is editorial, so it is written out here rather than collected
 * from {@link FONTS}. Membership is the mechanical half and does come from `type`,
 * which keeps a family's position in exactly one place: move a row in `FONTS` and
 * it moves in its group.
 */
export const FONT_GROUPS: readonly FontGroup[] = [
	{ type: "sans", label: "Sans", fonts: FONTS.filter((font) => font.type === "sans") },
	{ type: "mono", label: "Mono", fonts: FONTS.filter((font) => font.type === "mono") },
	{ type: "serif", label: "Serif", fonts: FONTS.filter((font) => font.type === "serif") },
];

/** Look a family up by its stable id. Returns `undefined` for an id no longer in the catalogue. */
export function fontByName(name: string): FontFamily | undefined {
	return FONTS.find((font) => font.name === name);
}
