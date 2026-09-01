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
 * shadcn's `globals.css`: `:root { … }` and `.dark { … }` in one file.
 *
 * What a web project pastes, and what `parseTheme` consumes — so it is also the
 * file to hand `delacour theme` to bring the same palette into a React Native
 * app.
 *
 * It carries **`--radius` and no other geometry**. The rest are this package's
 * own tokens; a web app has no `h-button-md` to spend them on, and worse, a
 * round trip through `parseTheme` would read them back into the palette blocks.
 * `--radius` is the exception because it is shadcn's own token and the number
 * the whole corner ramp derives from.
 *
 * It also carries none of the tokens this package adds over shadcn —
 * `--elevated`, `--tertiary`, the `-soft` pairs, `--overlay`. Each is *derived*
 * from a token shadcn does define, and `convertTheme` derives them on the way
 * in, so writing them here would pin a value that is meant to follow the palette.
 */
export function emitShadcnCss(tokens: ResolvedTokens, options: EmitOptions = {}): string {
	const light = split(tokens.light);
	const dark = split(tokens.dark);

	const values = { ...light.colors };
	const darkValues = { ...dark.colors };

	const radius = light.geometry["--radius"];
	if (radius) {
		values["--radius"] = radius;
		darkValues["--radius"] = dark.geometry["--radius"] ?? radius;
	}

	if (options.fonts?.sans) {
		values["--font-sans"] = `${options.fonts.sans}, ${WEB_FALLBACK}`;
		darkValues["--font-sans"] = values["--font-sans"];
	}

	const names = ordered(Object.keys(values));

	return `${block(":root", values, names)}\n\n${block(".dark", darkValues, names)}\n`;
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
