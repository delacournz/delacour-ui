import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig, palettesForBaseColor } from "./config";
import { FONT_GROUPS, FONTS, fontByName } from "./fonts";
import { RADII } from "./radii";
import { resolveTokens } from "./resolve";
import { STYLES } from "./styles";
import { ACCENT_THEMES } from "./themes";

/**
 * The library's own declarations, read as source text.
 *
 * The technique `native-ui`'s `styles/tokens.test.ts` and
 * `styles/theme-tokens.test.ts` already use: these are CSS custom properties,
 * no renderer is involved, and reading the file is the only way to assert a
 * customizer still writes names the library actually declares.
 */
const THEME_CSS = readFileSync(
	join(import.meta.dirname, "../../../../packages/native-ui/src/styles/theme.css"),
	"utf-8"
);

function declaredIn(variant: string): Set<string> {
	const block = THEME_CSS.split(`@variant ${variant} {`)[1]?.split("}")[0] ?? "";

	return new Set([...block.matchAll(/(--[\w-]+):/g)].map(([, name]) => (name as string).slice(2)));
}

const LIGHT = declaredIn("light");
const DARK = declaredIn("dark");
const NATIVE = declaredIn("native");

const MODES: ("light" | "dark")[] = ["light", "dark"];

describe("the theme.css reader", () => {
	test("finds every block it asserts against", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
		expect(NATIVE.size).toBeGreaterThan(0);
	});
});

/**
 * A variable the library does not declare is one no component reads.
 *
 * shadcn's ramps carry names this package has no counterpart for, and writing
 * one costs nothing visible — it simply sits in the store forever. This is what
 * catches a transcription that brought a web-only token along, and equally a
 * library token renamed out from under the data.
 */
describe("every axis writes names the library declares", () => {
	test.each(BASE_COLORS.map((base) => [base.name, base] as const))("base colour %s", (_name, base) => {
		for (const mode of MODES) {
			const declared = mode === "light" ? LIGHT : DARK;

			for (const token of Object.keys(base[mode])) {
				expect(declared.has(token), `theme.css declares no --${token}`).toBe(true);
			}
		}
	});

	test.each(ACCENT_THEMES.map((theme) => [theme.name, theme] as const))("accent %s", (_name, theme) => {
		for (const mode of MODES) {
			const declared = mode === "light" ? LIGHT : DARK;

			for (const token of Object.keys(theme[mode])) {
				expect(declared.has(token), `theme.css declares no --${token}`).toBe(true);
			}
		}
	});

	test.each(STYLES.map((style) => [style.name, style] as const))("style %s", (_name, style) => {
		for (const token of Object.keys(style.geometry)) {
			expect(NATIVE.has(token), `theme.css's @variant native declares no --${token}`).toBe(true);
		}
	});
});

/**
 * An accent must not carry `secondary`.
 *
 * shadcn's do, hardcoded to a zinc grey whatever the base colour — so stone +
 * blue would give a stone page with a zinc `Button variant="secondary"` and a
 * zinc `ListGroup`. Dropping it is the one place this deliberately diverges,
 * and a re-transcription from upstream would quietly bring it back.
 */
describe("the accents", () => {
	test.each(ACCENT_THEMES.map((theme) => [theme.name, theme] as const))("%s leaves secondary alone", (_name, theme) => {
		for (const mode of MODES) {
			expect(theme[mode].secondary).toBeUndefined();
			expect(theme[mode]["secondary-foreground"]).toBeUndefined();
		}
	});

	test.each(ACCENT_THEMES.map((theme) => [theme.name, theme] as const))("%s carries a primary pair", (_name, theme) => {
		for (const mode of MODES) {
			expect(theme[mode].primary).toBeDefined();
			expect(theme[mode]["primary-foreground"]).toBeDefined();
		}
	});
});

/**
 * Geometry is numbers, and a string here is silently inert.
 *
 * Uniwind's `createVarGetter` parses colours with culori and passes everything
 * else through unchanged, so `"44px"` reaches React Native as a string and
 * `height`, `borderRadius` and `fontSize` all ignore it without complaint. The
 * values declared in the CSS escape this because the bundler converts their
 * units at build time; a runtime override does not.
 */
describe("the styles", () => {
	test.each(STYLES.map((style) => [style.name, style] as const))("%s is all finite numbers", (_name, style) => {
		for (const [token, value] of Object.entries(style.geometry)) {
			expect(typeof value, `${token} must be a number, not a CSS length`).toBe("number");
			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(0);
		}
	});

	// Past half its height a corner is clamped by the renderer, so the number
	// would stop meaning what it says — and the step would stop being retunable.
	test.each(STYLES.map((style) => [style.name, style] as const))(
		"%s keeps a button corner drawable",
		(_name, style) => {
			for (const step of ["sm", "md", "lg"] as const) {
				const height = style.geometry[`spacing-button-${step}`];
				expect(style.geometry[`radius-button-${step}`]).toBeLessThanOrEqual(height / 2);
			}
		}
	);

	test.each(STYLES.map((style) => [style.name, style] as const))("%s steps its heights upward", (_name, style) => {
		const heights = [
			style.geometry["spacing-button-sm"],
			style.geometry["spacing-button-md"],
			style.geometry["spacing-button-lg"],
		];

		expect(heights).toEqual([...heights].sort((a, b) => a - b));
	});

	/**
	 * Vega is the identity element.
	 *
	 * Selecting it must leave the app exactly as `native-ui` ships, because that
	 * is what makes the customizer's reset meaningful and what `/preview` pins
	 * for the capture pipeline. Asserted against the library's own CSS rather
	 * than against a copy of the numbers.
	 */
	test("vega restates the library's own geometry", () => {
		const vega = STYLES.find((style) => style.name === "vega");
		if (!vega) throw new Error("no vega style");

		const block = THEME_CSS.split("@variant native {")[1]?.split("}")[0] ?? "";
		const declared = new Map<string, number>();

		// `--radius` is declared in rem and everything else in px, so the unit
		// is captured rather than assumed — a token silently switching units
		// would otherwise read as a sixteen-fold disagreement.
		for (const [, name, value, unit] of block.matchAll(/--([\w-]+):\s*([\d.]+)(px|rem);/g)) {
			const points = Number.parseFloat(value as string);
			declared.set(name as string, unit === "rem" ? points * 16 : points);
		}

		expect(declared.size).toBeGreaterThan(0);

		for (const [token, value] of Object.entries(vega.geometry)) {
			const expected = declared.get(token);
			if (expected === undefined) throw new Error(`theme.css declares no --${token}`);
			expect(value, `vega's ${token} disagrees with theme.css`).toBe(expected);
		}
	});
});

describe("the radius axis", () => {
	test("offers exactly one no-op option", () => {
		expect(RADII.filter((radius) => radius.value === null).map((radius) => radius.name)).toEqual(["default"]);
	});

	test("is all finite numbers otherwise", () => {
		for (const radius of RADII) {
			if (radius.value === null) continue;
			expect(Number.isFinite(radius.value)).toBe(true);
		}
	});
});

describe("the fonts", () => {
	test("group every family exactly once, in picker order", () => {
		expect(FONT_GROUPS.flatMap((group) => group.fonts.map((font) => font.name))).toEqual(
			FONTS.map((font) => font.name)
		);
	});

	test("name one family each, with no fallback stack", () => {
		for (const font of FONTS) {
			// React Native's `fontFamily` takes one name and no fallback list,
			// so a comma-separated web stack resolves to nothing at all.
			expect(font.family).not.toContain(",");
			expect(font.family.length).toBeGreaterThan(0);
			expect(font.weights.length).toBeGreaterThan(0);
		}
	});

	test("carry only weights the library can ask for", () => {
		for (const font of FONTS) {
			for (const weight of font.weights) {
				expect([400, 500, 600, 700]).toContain(weight);
			}
		}
	});

	test("are all reachable by id", () => {
		for (const font of FONTS) expect(fontByName(font.name)).toBe(font);
	});
});

describe("the config", () => {
	test("defaults to a resolvable design system", () => {
		const tokens = resolveTokens(DEFAULT_CONFIG);
		expect(Object.keys(tokens.light).length).toBeGreaterThan(0);
		expect(Object.keys(tokens.dark).length).toBeGreaterThan(0);
	});

	test("offers the base colour itself alongside every accent", () => {
		for (const base of BASE_COLORS) {
			const palettes = palettesForBaseColor(base.name).map((palette) => palette.name);
			expect(palettes[0]).toBe(base.name);
			expect(palettes).toHaveLength(ACCENT_THEMES.length + 1);

			// The other six base colours are hidden: used as an accent, one
			// would repaint the whole page from a control meant to move only
			// the primary.
			for (const other of BASE_COLORS) {
				if (other.name === base.name) continue;
				expect(palettes).not.toContain(other.name);
			}
		}
	});

	test("falls back per axis rather than wholesale", () => {
		const stored = { style: "vega", baseColor: "stone", theme: "not-a-theme" } as unknown as DesignSystemConfig;
		const normalized = normalizeConfig(stored);

		expect(normalized.baseColor).toBe("stone");
		expect(normalized.theme).toBe("stone");
	});

	test("survives a config from a build that knew nothing", () => {
		expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
		expect(normalizeConfig({})).toEqual(DEFAULT_CONFIG);
	});
});

/** Every combination has to resolve, because the picker lets the user reach every one. */
describe("the resolver", () => {
	test("composes base colour, accent, chart and geometry", () => {
		for (const base of BASE_COLORS) {
			for (const accent of ACCENT_THEMES) {
				const tokens = resolveTokens({ ...DEFAULT_CONFIG, baseColor: base.name, theme: accent.name });

				for (const mode of MODES) {
					expect(tokens[mode].primary).toBe(accent[mode].primary as string);
					// The departure: the base colour's secondary survives.
					expect(tokens[mode].secondary).toBe(base[mode].secondary as string);
					expect(tokens[mode].background).toBe(base[mode].background as string);
				}
			}
		}
	});

	test("lets the chart axis move the charts and nothing else", () => {
		const base = resolveTokens({ ...DEFAULT_CONFIG, baseColor: "neutral", theme: "neutral", chartColor: "neutral" });
		const charted = resolveTokens({ ...DEFAULT_CONFIG, baseColor: "neutral", theme: "neutral", chartColor: "blue" });

		for (const mode of MODES) {
			expect(charted[mode]["chart-1"]).not.toBe(base[mode]["chart-1"]);
			expect(charted[mode].primary).toBe(base[mode].primary as string);
			expect(charted[mode].background).toBe(base[mode].background as string);
		}
	});

	test("lets the radius axis override the style's own corner", () => {
		const styled = resolveTokens({ ...DEFAULT_CONFIG, style: "luma", radius: "default" });
		const squared = resolveTokens({ ...DEFAULT_CONFIG, style: "luma", radius: "none" });

		expect(styled.light.radius).toBe(24);
		expect(squared.light.radius).toBe(0);
		// …without replacing the rest of the style's geometry.
		expect(squared.light["spacing-button-md"]).toBe(styled.light["spacing-button-md"] as number);
	});
});
