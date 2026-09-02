import { type ConversionResult, convertTheme, PREFERRED_ORDER, type ThemeSource } from "./convert";
import type { ResolvedFonts, ResolvedMode, ResolvedTokens } from "./resolve";
import { GEOMETRY_TOKENS } from "./styles";

/**
 * A resolved design system as CSS someone can paste.
 *
 * Two shapes, because there are two destinations and they want different files:
 * a web project takes shadcn's `globals.css` — `:root { … }` and `.dark { … }` —
 * and a React Native project takes this package's `theme.css`, which Uniwind
 * reads only from `@variant light` / `@variant dark`.
 *
 * The native shape is `convertTheme`'s work, not a second renderer. That is the
 * whole reason `convert.ts` lives in this package: it already fills the tokens
 * shadcn has no name for, orders the names the way shadcn reads them, checks for
 * dangling references and writes the `@theme inline` alias block. Restating any
 * of that here would be a second implementation of a shipped command.
 */

export type EmitOptions = {
	/** The families to declare. Omitted rails are simply not written. */
	fonts?: ResolvedFonts;
};

/**
 * The web fallback stack, after the chosen family.
 *
 * A single family name is what React Native needs and what the native shape
 * carries; a browser wants somewhere to go while the webfont loads, and on a
 * machine that does not have it at all.
 */
const WEB_FALLBACK = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const GEOMETRY = new Set<string>(GEOMETRY_TOKENS);

/**
 * The type scale, which no axis varies.
 *
 * Restated from `packages/native-ui/src/styles/tokens.css` rather than resolved,
 * because nothing in the customizer writes these — but a pasted theme still
 * needs them or `text-sm` and its neighbours resolve to nothing.
 * `emit.test.ts` reads that file and fails if the two drift.
 */
const TYPE_SCALE: readonly [string, string][] = [
	["--text-xs", "12px"],
	["--text-sm", "14px"],
	["--text-base", "16px"],
	["--text-lg", "18px"],
	["--text-xl", "20px"],
	["--text-2xl", "24px"],
	["--text-3xl", "30px"],
];

/**
 * The generic corner scale, as multipliers of `--radius`.
 *
 * `inline` is load-bearing: a utility has to read `var(--radius)` itself, so a
 * theme that redeclares `--radius` reaches `rounded-lg` rather than a copy taken
 * when the scale was compiled. A multiplier rather than the `calc(var(--radius)
 * - 4px)` some generators still emit, so a square-cornered theme stays square at
 * every step instead of going negative.
 */
const RADIUS_RAMP: readonly [string, string][] = [
	["--radius-xs", "calc(var(--radius) * 0.4)"],
	["--radius-sm", "calc(var(--radius) * 0.6)"],
	["--radius-md", "calc(var(--radius) * 0.8)"],
	["--radius-lg", "var(--radius)"],
	["--radius-xl", "calc(var(--radius) * 1.4)"],
	["--radius-2xl", "calc(var(--radius) * 1.8)"],
	["--radius-3xl", "calc(var(--radius) * 2.2)"],
	["--radius-4xl", "calc(var(--radius) * 2.6)"],
	["--radius-full", "9999px"],
];

/**
 * A geometry number as CSS.
 *
 * `--radius` is `rem` because that is what `tokens.css` ships and what every
 * shadcn theme declares — Vega's `10` is the `0.625rem` already in the file, so
 * the identity style round-trips byte for byte. Everything else is `px`.
 *
 * Trailing zeros are stripped rather than left: `0.4500rem` and `0.45rem` are
 * the same corner, but only one of them compares equal to the shipped file.
 */
function length(token: string, value: number): string {
	const scaled = token === "radius" ? value / 16 : value;
	const rounded = Math.round(scaled * 1e6) / 1e6;

	return `${rounded}${token === "radius" ? "rem" : "px"}`;
}

/** A resolved mode split into the palette and the geometry, each already stringified. */
function split(mode: ResolvedMode): { colors: Record<string, string>; geometry: Record<string, string> } {
	const colors: Record<string, string> = {};
	const geometry: Record<string, string> = {};

	for (const [token, value] of Object.entries(mode)) {
		if (GEOMETRY.has(token)) {
			geometry[`--${token}`] = typeof value === "number" ? length(token, value) : value;
			continue;
		}

		colors[`--${token}`] = String(value);
	}

	return { colors, geometry };
}

/** shadcn's own reading order first, then whatever else the palette brought. */
function ordered(names: string[]): string[] {
	const rest = names.filter((name) => !PREFERRED_ORDER.includes(name)).sort();

	return [...PREFERRED_ORDER.filter((name) => names.includes(name)), ...rest];
}

function block(selector: string, values: Record<string, string>, names: string[]): string {
	const lines = names.map((name) => `\t${name}: ${values[name]};`).join("\n");

	return `${selector} {\n${lines}\n}`;
}

/**
 * shadcn's `globals.css`, whole: the palette, then the scales it sits on.
 *
 * What a web project pastes, and what `parseTheme` consumes — so it is also the
 * file to hand `delacour theme` to bring the same design system into a React
 * Native app.
 *
 * **The baseline blocks are part of the copy, not decoration.** The Style axis
 * writes button heights, field heights, the icon scale and the screen gutter,
 * so a palette on its own arrives with none of the geometry that made the theme
 * look the way it did on the phone — `h-button-md` and its neighbours resolve to
 * nothing. They are emitted at the end, after the palette, because the palette
 * is what a reader scans for and what changes between two of these files.
 *
 * `--radius` sits in `@theme` with the rest of the geometry rather than in
 * `:root`, which is where `tokens.css` declares it and the only place it can be
 * declared once. `@theme inline` carries the corner ramp derived from it — a
 * utility has to read `var(--radius)` itself, or a theme that redeclares the
 * number reaches a copy taken when the scale was compiled.
 *
 * It carries none of the tokens this package adds over shadcn — `--elevated`,
 * `--tertiary`, the `-soft` pairs, `--overlay`. Each is *derived* from a token
 * shadcn does define, and `convertTheme` derives them on the way in, so writing
 * them here would pin a value that is meant to follow the palette.
 */
export function emitShadcnCss(tokens: ResolvedTokens, options: EmitOptions = {}): string {
	const light = split(tokens.light);
	const dark = split(tokens.dark);

	const values = { ...light.colors };
	const darkValues = { ...dark.colors };

	if (options.fonts?.sans) {
		values["--font-sans"] = `${options.fonts.sans}, ${WEB_FALLBACK}`;
		darkValues["--font-sans"] = values["--font-sans"];
	}

	const names = ordered(Object.keys(values));

	return [
		block(":root", values, names),
		block(".dark", darkValues, names),
		pairs("@theme", baseline(light.geometry)),
		pairs("@theme inline", RADIUS_RAMP),
	].join("\n\n");
}

/**
 * The scales, in `tokens.css`'s own order.
 *
 * `--radius` first, then the type scale, then the rest of the geometry — which
 * is `GEOMETRY_TOKENS` past its first entry, in the order it declares them. Two
 * lists in one order rather than one list, because the type scale is static and
 * the geometry is whatever the Style axis resolved to.
 */
function baseline(geometry: Record<string, string>): readonly [string, string][] {
	const resolved = GEOMETRY_TOKENS.slice(1).map(
		(token) => [`--${token}`, geometry[`--${token}`] ?? ""] as [string, string]
	);

	return [["--radius", geometry["--radius"] ?? ""], ...TYPE_SCALE, ...resolved.filter(([, value]) => value !== "")];
}

function pairs(selector: string, entries: readonly [string, string][]): string {
	const lines = entries.map(([name, value]) => `\t${name}: ${value};`).join("\n");

	return `${selector} {\n${lines}\n}\n`;
}

/**
 * This package's `theme.css`, rendered by `convertTheme`.
 *
 * Returns the whole {@link ConversionResult} rather than a bare string so a
 * caller can show the `warnings` — a palette missing a token the derived ones
 * lean on produces CSS that looks complete and resolves to nothing.
 *
 * The geometry rides in `native`, which `render` writes as `@variant native`.
 * That block is not decoration: a variable declared in a plain `@theme` is
 * resolved and inlined at build time, so `h-button-md` would carry a literal 44
 * and no runtime override could reach it. Inside a `@variant` it compiles to a
 * getter against the live store, which is the difference between a kit whose
 * density an app can retune and one whose density is a build artefact.
 *
 * Both platforms get the same family name, because the config names one real
 * family rather than a stack — which is also what stops `takeFonts` warning that
 * it kept only the first of several.
 */
export function emitNativeCss(tokens: ResolvedTokens, options: EmitOptions = {}): ConversionResult {
	const light = split(tokens.light);
	const dark = split(tokens.dark);

	const platformFonts = fontBlocks(options.fonts);

	const source: ThemeSource = {
		light: light.colors,
		dark: dark.colors,
		native: { ...dark.geometry, ...light.geometry },
		...(platformFonts ? { platformFonts } : {}),
	};

	return convertTheme(source);
}

function fontBlocks(fonts: ResolvedFonts | undefined): ThemeSource["platformFonts"] {
	if (!fonts?.sans && !fonts?.heading) return undefined;

	const declared: Record<string, string> = {};
	if (fonts.sans) declared["--font-sans"] = `"${fonts.sans}"`;
	if (fonts.heading) declared["--font-heading"] = `"${fonts.heading}"`;

	return { ios: declared, android: declared };
}
