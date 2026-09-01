import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig } from "./config";

/**
 * A design system as a short code, for a URL someone will share.
 *
 * The playground composes a theme on a phone and hands it to the documentation
 * site as `?preset=<code>`; the site decodes it and renders the CSS. Twelve
 * characters, which is the range shadcn's own preset codes sit in.
 *
 * **A code must never come to mean a different theme.** It ends up bookmarked,
 * pasted into a chat, and read off a screen, so it outlives the build that wrote
 * it by longer than anything else here. That single requirement is what shapes
 * the whole format:
 *
 * - **Declared ordinals, never array positions.** The tables below are literal
 *   `name -> number` maps. `STYLES` and `ACCENT_THEMES` are in shadcn's own
 *   editorial order and reordering them is a plausible change; if a code's
 *   meaning rode on that order, every link ever shared would silently repoint.
 *   `preset.test.ts` pins the numbers themselves for exactly that reason.
 * - **A version byte**, so the format can change without stranding old codes.
 * - **A checksum byte.** Without it every twelve-character string decodes to
 *   *some* theme, so a code truncated by a chat client's link detection renders
 *   a wrong design system instead of saying the link is broken.
 * - **A byte per axis rather than bit packing.** The 29 bits would fit in seven
 *   characters, but a byte per axis means an eighth axis appends a byte where a
 *   bit field would renumber everything.
 *
 * Ordinals are **append-only**: never renumber one, never reuse a retired
 * number. A format change bumps {@link PRESET_VERSION} and replaces the golden
 * table in the test rather than re-baselining it.
 *
 * Base64url is hand-rolled against RFC 4648 §5 rather than reaching for
 * `btoa`/`atob`. This module has to load under Bun's test runner, Metro, Vite's
 * SSR pass and Node's CJS config loader, and staying dependency-free is what
 * lets it.
 */

export const PRESET_VERSION = 1;

/** Version, seven axes, checksum. */
const PRESET_BYTES = 9;

/** Nine bytes is seventy-two bits, which is twelve base64 characters and no padding. */
export const PRESET_CODE_LENGTH = 12;

export const STYLE_ORDINALS: Record<string, number> = {
	vega: 0,
	nova: 1,
	maia: 2,
	lyra: 3,
	mira: 4,
	luma: 5,
	sera: 6,
	rhea: 7,
};

export const BASE_COLOR_ORDINALS: Record<string, number> = {
	neutral: 0,
	stone: 1,
	zinc: 2,
	mauve: 3,
	olive: 4,
	mist: 5,
	taupe: 6,
};

/**
 * One space for both palette axes, because both range over the same list.
 *
 * The seven base colours keep the ordinals they carry above — the Theme axis
 * offers the current base colour as the way to say "no accent", so the two sets
 * genuinely overlap and giving them one numbering keeps that true.
 */
export const PALETTE_ORDINALS: Record<string, number> = {
	neutral: 0,
	stone: 1,
	zinc: 2,
	mauve: 3,
	olive: 4,
	mist: 5,
	taupe: 6,
	amber: 7,
	blue: 8,
	cyan: 9,
	emerald: 10,
	fuchsia: 11,
	green: 12,
	indigo: 13,
	lime: 14,
	orange: 15,
	pink: 16,
	purple: 17,
	red: 18,
	rose: 19,
	sky: 20,
	teal: 21,
	violet: 22,
	yellow: 23,
};

/** `inherit` takes 0 because it is a legal `fontHeading`; it is never a legal `font`. */
export const FONT_ORDINALS: Record<string, number> = {
	inherit: 0,
	geist: 1,
	inter: 2,
	"noto-sans": 3,
	"nunito-sans": 4,
	figtree: 5,
	roboto: 6,
	raleway: 7,
	"dm-sans": 8,
	"public-sans": 9,
	outfit: 10,
	oxanium: 11,
	manrope: 12,
	"space-grotesk": 13,
	montserrat: 14,
	"ibm-plex-sans": 15,
	"source-sans-3": 16,
	"instrument-sans": 17,
	"geist-mono": 18,
	"jetbrains-mono": 19,
	"noto-serif": 20,
	"roboto-slab": 21,
	merriweather: 22,
	lora: 23,
	"playfair-display": 24,
	"eb-garamond": 25,
	"instrument-serif": 26,
};

export const RADIUS_ORDINALS: Record<string, number> = {
	default: 0,
	none: 1,
	small: 2,
	medium: 3,
	large: 4,
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** FNV-1a, low byte. `Math.imul` because a plain `*` loses precision past 2^53. */
function checksum(bytes: readonly number[]): number {
	let hash = 0x81_1c_9d_c5;

	for (const byte of bytes) {
		hash = Math.imul(hash ^ byte, 0x01_00_01_93) >>> 0;
	}

	return hash & 0xff;
}

function toBase64Url(bytes: readonly number[]): string {
	let out = "";

	for (let index = 0; index < bytes.length; index += 3) {
		const chunk = ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
		const characters = Math.min(3, bytes.length - index) + 1;

		for (let step = 0; step < characters; step += 1) {
			out += ALPHABET[(chunk >> (18 - step * 6)) & 0x3f];
		}
	}

	return out;
}

/** `null` for anything outside the alphabet — the caller treats that as a bad code. */
function fromBase64Url(code: string): number[] | null {
	const bytes: number[] = [];

	for (let index = 0; index < code.length; index += 4) {
		let chunk = 0;

		for (let step = 0; step < 4; step += 1) {
			const position = ALPHABET.indexOf(code[index + step] as string);
			if (position < 0) return null;
			chunk = (chunk << 6) | position;
		}

		bytes.push((chunk >> 16) & 0xff, (chunk >> 8) & 0xff, chunk & 0xff);
	}

	return bytes;
}

/** An ordinal back to the name that carries it, or `undefined` if this build has retired it. */
function nameOf(table: Record<string, number>, ordinal: number): string | undefined {
	for (const [name, value] of Object.entries(table)) {
		if (value === ordinal) return name;
	}

	return undefined;
}

function ordinalOf(table: Record<string, number>, name: string, fallback: string): number {
	return table[name] ?? (table[fallback] as number);
}

/** The body font can never be `inherit` — the table is shared with the heading. */
function bodyFont(name: string): string {
	return name === "inherit" ? DEFAULT_CONFIG.font : name;
}

/** A config as a twelve-character code. */
export function encodePreset(config: DesignSystemConfig): string {
	const payload = [
		PRESET_VERSION,
		ordinalOf(STYLE_ORDINALS, config.style, DEFAULT_CONFIG.style),
		ordinalOf(BASE_COLOR_ORDINALS, config.baseColor, DEFAULT_CONFIG.baseColor),
		ordinalOf(PALETTE_ORDINALS, config.theme, DEFAULT_CONFIG.theme),
		ordinalOf(PALETTE_ORDINALS, config.chartColor, DEFAULT_CONFIG.chartColor),
		ordinalOf(FONT_ORDINALS, config.font, DEFAULT_CONFIG.font),
		ordinalOf(FONT_ORDINALS, config.fontHeading, DEFAULT_CONFIG.fontHeading),
		ordinalOf(RADIUS_ORDINALS, config.radius, DEFAULT_CONFIG.radius),
	];

	return toBase64Url([...payload, checksum(payload)]);
}

/**
 * A code back into a config, or `null` when the code is not one of ours.
 *
 * The two failures are deliberately different. `null` means *structurally*
 * invalid — wrong length, an alphabet we do not use, a version this build cannot
 * read, or a failed checksum — and the caller shows the default theme and says
 * the link could not be read. An unrecognised **ordinal** is not that: it is a
 * name this build has retired, and it costs that one axis rather than the whole
 * configuration.
 *
 * That per-axis forgiveness has to live here rather than leaning on
 * `normalizeConfig`, which only validates `theme` and `chartColor` against the
 * base colour and lets a stale `style`, `font`, `fontHeading` or `radius` pass
 * straight through — `resolveTokens` then silently skips the geometry and the
 * app renders a theme nobody chose. `normalizeConfig` still runs last, for the
 * one invariant it does own.
 *
 * Total by construction: every branch returns, and nothing here can throw on a
 * string of any shape or length.
 */
export function decodePreset(code: string): DesignSystemConfig | null {
	if (code.length !== PRESET_CODE_LENGTH) return null;

	const bytes = fromBase64Url(code);
	if (!bytes || bytes.length !== PRESET_BYTES) return null;

	const payload = bytes.slice(0, PRESET_BYTES - 1);
	if (payload[0] !== PRESET_VERSION) return null;
	if (checksum(payload) !== bytes[PRESET_BYTES - 1]) return null;

	const read = (table: Record<string, number>, index: number, fallback: string): string =>
		nameOf(table, payload[index] as number) ?? fallback;

	return normalizeConfig({
		style: read(STYLE_ORDINALS, 1, DEFAULT_CONFIG.style) as DesignSystemConfig["style"],
		baseColor: read(BASE_COLOR_ORDINALS, 2, DEFAULT_CONFIG.baseColor) as DesignSystemConfig["baseColor"],
		theme: read(PALETTE_ORDINALS, 3, DEFAULT_CONFIG.theme) as DesignSystemConfig["theme"],
		chartColor: read(PALETTE_ORDINALS, 4, DEFAULT_CONFIG.chartColor) as DesignSystemConfig["chartColor"],
		// `inherit` shares the font table but is only ever legal on the heading.
		font: bodyFont(read(FONT_ORDINALS, 5, DEFAULT_CONFIG.font)),
		fontHeading: read(FONT_ORDINALS, 6, DEFAULT_CONFIG.fontHeading),
		radius: read(RADIUS_ORDINALS, 7, DEFAULT_CONFIG.radius) as DesignSystemConfig["radius"],
	});
}
