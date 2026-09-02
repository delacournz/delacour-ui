import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8");
const THEME_CSS = readFileSync(join(import.meta.dirname, "theme.css"), "utf-8");

/**
 * Every `--name: value` declaration inside one `@variant` block of `theme.css`.
 *
 * Source text, not an import: these are CSS custom properties and no renderer
 * is involved, so reading the file is the only way to assert against them.
 * `styles/tokens.test.ts` and `styles/theme-tokens.test.ts` do the same.
 */
function variantDeclarations(variant: string): Map<string, string> {
	const block = THEME_CSS.split(`@variant ${variant} {`)[1]?.split("}")[0] ?? "";
	const found = new Map<string, string>();

	for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
		found.set(name as string, (value as string).trim());
	}

	return found;
}

/** The same, from `tokens.css`'s first `@theme` block — the copy `apps/web` reads. */
function themeDeclarations(): Map<string, string> {
	const block = TOKENS_CSS.split("@theme {")[1]?.split("\n}")[0] ?? "";
	const found = new Map<string, string>();

	for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
		found.set(name as string, (value as string).trim());
	}

	return found;
}

const NATIVE = variantDeclarations("native");
const TOKENS = themeDeclarations();

describe("the CSS readers", () => {
	test("find both blocks", () => {
		expect(NATIVE.size).toBeGreaterThan(0);
		expect(TOKENS.size).toBeGreaterThan(0);
	});
});

/**
 * The geometry is declared twice, and the two copies must agree.
 *
 * `tokens.css` is the copy `apps/web` reads — the docs site imports only that
 * file. `theme.css`'s `@variant native` block is the copy React Native reads,
 * and it exists because Uniwind inlines a plain `@theme` declaration at build
 * time: without it every one of these numbers would be frozen into the bundle
 * and the playground's Style and Radius axes would silently do nothing.
 *
 * Two hand-maintained copies of one number always drift. This is what stops it.
 */
describe("the geometry block", () => {
	test("restates every number tokens.css declares, with the same value", () => {
		for (const [name, value] of NATIVE) {
			expect(TOKENS.get(name), `tokens.css declares no ${name}`).toBeDefined();
			expect(TOKENS.get(name), `${name} disagrees between tokens.css and theme.css`).toBe(value);
		}
	});

	/**
	 * A token left out of the native block is not a build error — it is a
	 * control in the playground's customizer that moves nothing, which is the
	 * kind of gap only a person notices, late.
	 */
	test("covers every scale a customizer can retune", () => {
		const required = [
			"--radius",
			...(["sm", "md", "lg"] as const).flatMap((step) => [
				`--spacing-button-${step}`,
				`--text-button-${step}`,
				`--radius-button-${step}`,
				`--spacing-input-${step}`,
				`--text-input-${step}`,
			]),
			...(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((step) => `--spacing-icon-${step}`),
			"--spacing-navbar-row",
			"--spacing-screen-gutter",
		];

		for (const name of required) {
			expect(NATIVE.has(name), `theme.css's @variant native declares no ${name}`).toBe(true);
		}
	});

	// The generic corner scale is derived from `--radius` in `tokens.css`'s
	// `@theme inline` block. Restating a derived step here would pin it and
	// break the one thing the Radius axis relies on.
	test("does not restate the derived corner scale", () => {
		for (const step of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "full"]) {
			expect(NATIVE.has(`--radius-${step}`)).toBe(false);
		}
	});
});

/** The heading face is a token like the other three, or `Text.Display` cannot follow a theme. */
describe("the font families", () => {
	test("declare all four for both platforms", () => {
		for (const platform of ["ios", "android"] as const) {
			const declared = variantDeclarations(platform);

			for (const token of ["--font-sans", "--font-serif", "--font-mono", "--font-heading"] as const) {
				expect(declared.get(token), `@variant ${platform} declares no ${token}`).toBeDefined();
				// React Native's `fontFamily` takes one name and no fallback
				// list, so a comma-separated web stack resolves to nothing.
				expect(declared.get(token)).not.toContain(",");
			}
		}
	});
});
