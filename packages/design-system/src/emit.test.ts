import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, type DesignSystemConfig } from "./config";
import { parseTheme } from "./convert";
import { emitNativeCss, emitShadcnCss } from "./emit";
import { RADII } from "./radii";
import { resolveFonts, resolveTokens } from "./resolve";
import { GEOMETRY_TOKENS, STYLES } from "./styles";
import { ACCENT_THEMES } from "./themes";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../native-ui/src/styles/theme.css"), "utf-8");

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

const shadcn = (from: DesignSystemConfig): string => emitShadcnCss(resolveTokens(from), { fonts: resolveFonts(from) });
const native = (from: DesignSystemConfig) => emitNativeCss(resolveTokens(from), { fonts: resolveFonts(from) });

/** `--name: value;` pairs out of a brace-matched block, keyed without the `--`. */
function declarationsIn(css: string, selector: string): Record<string, string> {
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
	 * `--radius` is shadcn's own token and the one number the whole corner ramp
	 * derives from. The other twenty are this package's, and a web app has no
	 * `h-button-md` to spend them on — worse, `parseTheme` would read them back
	 * into the palette blocks on a round trip.
	 */
	test("carries --radius and no other geometry", () => {
		const light = declarationsIn(css, ":root");

		expect(light.radius).toBe("0.625rem");
		for (const token of GEOMETRY_TOKENS) {
			if (token === "radius") continue;
			expect(light[token]).toBeUndefined();
		}
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
