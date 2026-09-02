import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, type DesignSystemConfig } from "./config";
import { convertTheme, parseTheme } from "./convert";
import { emitNativeCss, emitShadcnCss } from "./emit";
import { RADII } from "./radii";
import { resolveFonts, resolveTokens } from "./resolve";
import { GEOMETRY_TOKENS, STYLES } from "./styles";
import { ACCENT_THEMES } from "./themes";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../native-ui/src/styles/theme.css"), "utf-8");
const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../native-ui/src/styles/tokens.css"), "utf-8");

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

const shadcn = (from: DesignSystemConfig): string => emitShadcnCss(resolveTokens(from), { fonts: resolveFonts(from) });
const native = (from: DesignSystemConfig) => emitNativeCss(resolveTokens(from), { fonts: resolveFonts(from) });

/**
 * `--name: value;` pairs out of a brace-matched block, keyed without the `--`.
 *
 * Comments come out first, the way `parseTheme` does it. The rendered
 * `theme.css` opens with a doc comment that names `@variant light` and
 * `@variant dark` in prose, and matching that instead of the real block brace-
 * matches from the wrong place and reads the whole file as one block.
 */
function declarationsIn(source: string, selector: string): Record<string, string> {
	const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
	const start = css.indexOf(selector);
	if (start < 0) return {};

	let depth = 0;
	let index = css.indexOf("{", start);
	const from = index + 1;

	for (; index < css.length; index += 1) {
		if (css[index] === "{") depth += 1;
		if (css[index] === "}") {
			depth -= 1;
			if (depth === 0) break;
		}
	}

	const body = css.slice(from, index);
	const out: Record<string, string> = {};
	for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
		out[name as string] = (value as string).trim();
	}

	return out;
}

/**
 * The strongest assertion in the file.
 *
 * Vega is the identity element — it restates the library's own numbers — so the
 * geometry it emits has to come back byte for byte against `theme.css`'s own
 * `@variant native` block. That proves the number-to-unit conversion in both
 * directions at once: a `rem` divisor that is wrong, or a `px` suffix on the one
 * token that takes `rem`, fails here and nowhere else.
 */
describe("vega is the identity element, in CSS", () => {
	const shipped = declarationsIn(THEME_CSS, "@variant native");
	const emitted = declarationsIn(native(DEFAULT_CONFIG).css, "@variant native");

	test("the reader found both blocks", () => {
		expect(Object.keys(shipped).length).toBeGreaterThan(0);
		expect(Object.keys(emitted).length).toBeGreaterThan(0);
	});

	for (const token of GEOMETRY_TOKENS) {
		test(`--${token} matches what the library ships`, () => {
			expect(emitted[token]).toBe(shipped[token] as string);
		});
	}
});

describe("units", () => {
	test("--radius is always rem and every other geometry token is px", () => {
		for (const style of STYLES) {
			for (const radius of RADII) {
				const emitted = declarationsIn(
					native(config({ style: style.name, radius: radius.name })).css,
					"@variant native"
				);

				for (const token of GEOMETRY_TOKENS) {
					const value = emitted[token] as string;
					expect(value).toBeDefined();
					expect(value).toMatch(token === "radius" ? /rem$/ : /px$/);
					expect(value).not.toMatch(/^-?[\d.]+$/);
				}
			}
		}
	});

	test("the radius maths", () => {
		const radiusOf = (from: DesignSystemConfig) => declarationsIn(native(from).css, "@variant native").radius;

		expect(radiusOf(config({ radius: "none" }))).toBe("0rem");
		expect(radiusOf(config({ radius: "small" }))).toBe("0.45rem");
		expect(radiusOf(config({ radius: "medium" }))).toBe("0.625rem");
		expect(radiusOf(config({ radius: "large" }))).toBe("0.875rem");
	});

	test("a style's own corner survives the default radius", () => {
		for (const style of STYLES) {
			const emitted = declarationsIn(native(config({ style: style.name })).css, "@variant native");
			expect(emitted.radius).toBe(`${style.geometry.radius / 16}rem`);
		}
	});
});

describe("the shadcn shape", () => {
	const css = shadcn(DEFAULT_CONFIG);

	test("declares both modes in one file", () => {
		expect(css).toContain(":root {");
		expect(css).toContain(".dark {");
	});

	test("carries shadcn's own names", () => {
		const light = declarationsIn(css, ":root");

		for (const name of ["background", "foreground", "card", "primary", "secondary", "muted", "border", "ring"]) {
			expect(light[name]).toBeDefined();
		}
		for (let step = 1; step <= 5; step += 1) expect(light[`chart-${step}`]).toBeDefined();
	});

	/**
	 * The palette on its own is not the theme.
	 *
	 * The Style axis writes button heights, field heights, the icon scale and the
	 * screen gutter, so a copied file carrying only colours arrives with none of
	 * the geometry that made it look the way it did on the phone — every
	 * `h-button-md` and `size-icon-md` resolves to nothing.
	 */
	test("carries the geometry in a @theme block, resolved from the config", () => {
		const theme = declarationsIn(shadcn(config({ style: "rhea" })), "@theme {");
		const geometry = resolveTokens(config({ style: "rhea" })).light;

		for (const token of GEOMETRY_TOKENS) {
			expect(theme[token]).toBeDefined();
		}
		expect(theme["spacing-button-md"]).toBe(`${geometry["spacing-button-md"] as number}px`);
		expect(theme.radius).toBe(`${(geometry.radius as number) / 16}rem`);
	});

	test("carries the corner ramp as multipliers, inline", () => {
		const ramp = declarationsIn(css, "@theme inline");

		expect(ramp["radius-lg"]).toBe("var(--radius)");
		expect(ramp["radius-md"]).toBe("calc(var(--radius) * 0.8)");
		expect(ramp["radius-full"]).toBe("9999px");
	});

	/**
	 * `--radius` is declared once, in `@theme`, where `tokens.css` declares it.
	 * A second copy in `:root` would be a later-wins race between two blocks in
	 * one file, and the loser would be whichever the reader edited.
	 */
	test("declares each geometry token exactly once", () => {
		const light = declarationsIn(css, ":root");

		for (const token of GEOMETRY_TOKENS) {
			expect(light[token]).toBeUndefined();
		}
	});

	/**
	 * The type scale and the ramp are restated in `emit.ts` because no axis
	 * varies them. This is what stops the copies drifting.
	 */
	test("the static scales match what the library ships", () => {
		const shipped = declarationsIn(TOKENS_CSS, "@theme {");
		const shippedRamp = declarationsIn(TOKENS_CSS, "@theme inline");
		const theme = declarationsIn(css, "@theme {");
		const ramp = declarationsIn(css, "@theme inline");

		for (const step of ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"]) {
			expect(theme[step]).toBe(shipped[step] as string);
		}
		for (const [name, value] of Object.entries(shippedRamp)) {
			expect(ramp[name]).toBe(value);
		}
	});

	/** Vega restates the library's own numbers, so its whole block should match. */
	test("vega's @theme block matches tokens.css outright", () => {
		const shipped = declarationsIn(TOKENS_CSS, "@theme {");
		const emitted = declarationsIn(shadcn(DEFAULT_CONFIG), "@theme {");

		expect(emitted).toEqual(shipped);
	});

	test("leaves this package's own additions to the native shape", () => {
		const light = declarationsIn(css, ":root");

		for (const name of ["elevated", "tertiary", "overlay", "destructive-soft"]) {
			expect(light[name]).toBeUndefined();
		}
	});

	test("light and dark declare the same names", () => {
		const light = Object.keys(declarationsIn(css, ":root")).sort();
		const dark = Object.keys(declarationsIn(css, ".dark")).sort();

		expect(dark).toEqual(light);
	});
});

describe("the round trip through the converter", () => {
	test("parseTheme reads back what emitShadcnCss wrote", () => {
		for (const from of [DEFAULT_CONFIG, config({ baseColor: "stone", theme: "blue", chartColor: "blue" })]) {
			const tokens = resolveTokens(from);
			const parsed = parseTheme(shadcn(from));

			expect(parsed.light["--primary"]).toBe(tokens.light.primary as string);
			expect(parsed.dark["--primary"]).toBe(tokens.dark.primary as string);
			expect(parsed.light["--background"]).toBe(tokens.light.background as string);
		}
	});

	test("the shadcn shape declares everything the derived tokens lean on", () => {
		const result = native(DEFAULT_CONFIG);
		expect(result.warnings.filter((warning) => warning.includes("referenced but not declared"))).toEqual([]);
	});

	/**
	 * The page tells the reader to run this exact file through `delacour theme`,
	 * so the geometry it now carries has to land in `@variant native` — not in
	 * the palette, where Uniwind inlines it at build time and `h-button-md` stops
	 * being something an app can retune.
	 */
	test("the emitted globals.css converts with its geometry in the right block", () => {
		const from = config({ style: "rhea" });
		const parsed = parseTheme(shadcn(from));

		expect(parsed.native?.["--spacing-button-md"]).toBe("40px");
		expect(parsed.native?.["--radius"]).toBe("1rem");
		expect(parsed.light["--spacing-button-md"]).toBeUndefined();
		expect(parsed.light["--radius"]).toBeUndefined();

		const converted = convertTheme(parsed);
		const native = declarationsIn(converted.css, "@variant native");
		const light = declarationsIn(converted.css, "@variant light");

		expect(native["spacing-button-md"]).toBe("40px");
		expect(light["spacing-button-md"]).toBeUndefined();
		expect(light.primary).toBeDefined();
	});

	/** The derived ramp is rebuilt from `--radius`; carrying a copy would pin it. */
	test("the corner ramp does not survive the conversion", () => {
		const converted = convertTheme(parseTheme(shadcn(DEFAULT_CONFIG)));

		expect(converted.css).not.toContain("--radius-lg:");
		expect(converted.css).not.toContain("--radius-full:");
	});

	test("the native shape is readable by parseTheme, geometry included", () => {
		const parsed = parseTheme(native(config({ style: "rhea" })).css);

		expect(parsed.native).toBeDefined();
		expect(parsed.native?.["--spacing-button-md"]).toBeDefined();
		expect(parsed.light["--primary"]).toBeDefined();
	});
});

describe("fonts", () => {
	const from = config({ font: "inter", fontHeading: "playfair-display" });

	test("the shadcn shape gives --font-sans a real fallback stack", () => {
		const light = declarationsIn(shadcn(from), ":root");

		expect(light["font-sans"]).toStartWith("Inter,");
		expect(light["font-sans"]).toContain("sans-serif");
	});

	test("the native shape puts one family per platform, outside the palette", () => {
		const css = native(from).css;

		expect(declarationsIn(css, "@variant ios")["font-sans"]).toBe('"Inter"');
		expect(declarationsIn(css, "@variant ios")["font-heading"]).toBe('"Playfair Display"');
		expect(declarationsIn(css, ":root")["font-sans"]).toBeUndefined();
	});

	test("an inherited heading follows the body", () => {
		expect(resolveFonts(config({ font: "lora", fontHeading: "inherit" }))).toEqual({
			sans: "Lora",
			heading: "Lora",
		});
	});

	test("an unknown font id resolves to nothing rather than throwing", () => {
		expect(resolveFonts(config({ font: "not-a-font" }))).toEqual({ sans: undefined, heading: undefined });
	});
});

describe("the whole matrix emits", () => {
	test("every base colour against every accent", () => {
		for (const base of BASE_COLORS) {
			for (const accent of ACCENT_THEMES) {
				const from = config({ baseColor: base.name, theme: accent.name, chartColor: accent.name });

				expect(shadcn(from)).toContain("--primary:");
				expect(native(from).css).toContain("--primary:");
			}
		}
	});
});
