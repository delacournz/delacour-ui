import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The reader every suite that checks a token against `theme.css` shares, and
 * the tests that pin the file's own shape.
 *
 * It lives in a `.test.ts` on purpose. Nine suites need to know what the
 * palette declares, and nine hand-rolled regexes drifted from each other and
 * from the file. It also reads from disk, so it could never ship to a React
 * Native app — and the registry builder skips `*.test.ts`, which keeps it out
 * of what `delacour add styles` copies. See `packages/cli/src/registry/classify.ts`.
 *
 * Import it from a sibling suite:
 *
 * ```ts
 * import { declaredTokens } from "../../styles/theme-tokens.test";
 * ```
 */
export const THEME_CSS = readFileSync(join(import.meta.dirname, "theme.css"), "utf-8");
export const TOKENS_CSS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8");

/**
 * `--radius` in points.
 *
 * Declared in `rem` because that is what a theme generator emits; React Native
 * has no root font size, and Uniwind resolves one `rem` as sixteen points.
 */
export const REM_PX = 16;

export const RADIUS_BASE_PX = (() => {
	const value = TOKENS_CSS.match(/--radius:\s*([\d.]+)(rem|px);/);
	if (!value) throw new Error("tokens.css declares no --radius");

	return Number(value[1]) * (value[2] === "rem" ? REM_PX : 1);
})();

/**
 * What one step of the generic corner scale multiplies `--radius` by.
 *
 * The scale is `@theme inline`, so no `--radius-*` variable survives to runtime
 * — only `--radius` does. Anything that has to compute a corner in JavaScript
 * reads the base and applies its own multiplier, and pins that multiplier
 * against this. `Checkbox`'s concentric fill is the one case.
 */
export function radiusMultiplier(step: string): number {
	const match = TOKENS_CSS.match(new RegExp(`--radius-${step}:\\s*([^;]+);`));
	if (!match?.[1]) throw new Error(`tokens.css declares no --radius-${step}`);

	const value = match[1].trim();
	if (value === "var(--radius)") return 1;

	const multiplier = value.match(/calc\(var\(--radius\)\s*\*\s*([\d.]+)\)/)?.[1];
	if (multiplier === undefined) throw new Error(`--radius-${step} is not derived from --radius: ${value}`);

	return Number(multiplier);
}

/** A step of the generic corner scale in points, at the default `--radius`. */
export function radiusPx(step: string): number {
	return RADIUS_BASE_PX * radiusMultiplier(step);
}

export type ThemeVariant = "dark" | "light";

/**
 * The body of one `@variant` block, brace-matched.
 *
 * Counting braces rather than splitting on the first `}`: the block holds
 * comments and functional values, and a split would silently truncate the
 * palette to whatever came before the first one — which reads as "the theme
 * declares nothing", and every assertion built on it would pass vacuously.
 */
export function themeBlock(variant: ThemeVariant): string {
	const marker = `@variant ${variant} {`;
	const start = THEME_CSS.indexOf(marker);
	if (start === -1) throw new Error(`theme.css declares no @variant ${variant} block`);

	let depth = 1;
	let index = start + marker.length;

	while (index < THEME_CSS.length && depth > 0) {
		const character = THEME_CSS[index];
		if (character === "{") depth += 1;
		if (character === "}") depth -= 1;
		index += 1;
	}

	if (depth !== 0) throw new Error(`theme.css never closes its @variant ${variant} block`);

	return THEME_CSS.slice(start + marker.length, index - 1);
}

/**
 * Every token name one variant declares, without its `--` prefix.
 *
 * These are the RAW shadcn names — `destructive`, not `color-destructive`.
 * `theme.css` maps raw onto the `--color-*` namespace through `@theme inline`,
 * and a token missing from a variant resolves to nothing at runtime: the colour
 * silently falls back, in one theme only.
 */
export function declaredTokens(variant: ThemeVariant): Set<string> {
	const names = new Set<string>();

	for (const [, name] of themeBlock(variant).matchAll(/^\s*--([\w-]+):/gm)) {
		names.add(name);
	}

	return names;
}

/** The value one variant gives a token, or `undefined` if it declares none. */
export function tokenValue(variant: ThemeVariant, token: string): string | undefined {
	return themeBlock(variant)
		.match(new RegExp(`--${token}:\\s*([^;]+);`))?.[1]
		?.trim();
}

/**
 * How many of the two variants declare a token — 0, 1 or 2.
 *
 * Anything but 2 is a bug a component cannot see: a token declared once
 * resolves in one theme and silently falls back in the other.
 */
export function declarationCount(token: string): number {
	return (["light", "dark"] as const).filter((variant) => tokenValue(variant, token) !== undefined).length;
}

/** Every name the `@theme inline` block aliases, with its `--` prefix. */
export function aliasedTokens(): Set<string> {
	const marker = "@theme inline {";
	const block = THEME_CSS.slice(THEME_CSS.indexOf(marker) + marker.length);
	const names = new Set<string>();

	for (const [, name] of block.matchAll(/^\s*(--[\w-]+):\s*var\(/gm)) {
		names.add(name);
	}

	return names;
}

/**
 * Declared but deliberately not aliased.
 *
 * A theme generator emits a bare `--shadow` alongside the scale, and dropping
 * it would make a paste lossy — but Tailwind's namespace is `--shadow-*`, so
 * there is no utility for it to back.
 */
const UNALIASED = new Set(["shadow"]);

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

describe("the theme.css reader", () => {
	// Every assertion below is worth nothing if the parse found no palette.
	test("finds a populated block for both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(30);
		expect(DARK.size).toBeGreaterThan(30);
	});

	test("brace-matches rather than stopping at the first closing brace", () => {
		expect(LIGHT.has("overlay")).toBe(true);
		expect(DARK.has("overlay")).toBe(true);
	});
});

describe("the palette", () => {
	// Uniwind refuses to build otherwise — "All themes must have the same
	// variables" — so this fails here, in a second, rather than in Metro.
	test("declares exactly the same names in both variants", () => {
		expect([...LIGHT].sort()).toEqual([...DARK].sort());
	});

	test("gives every token a value in both variants", () => {
		for (const token of LIGHT) {
			expect(tokenValue("light", token)).toBeTruthy();
			expect(tokenValue("dark", token)).toBeTruthy();
		}
	});

	test("uses shadcn's names, not the ones this package used before", () => {
		for (const shadcn of ["background", "foreground", "primary", "destructive", "border", "input", "ring"]) {
			expect(LIGHT.has(shadcn)).toBe(true);
		}

		for (const renamed of ["danger", "danger-foreground", "danger-soft", "danger-soft-foreground"]) {
			expect(LIGHT.has(renamed)).toBe(false);
		}
	});

	test("pairs every -foreground with a surface of the same name", () => {
		for (const token of LIGHT) {
			if (!token.endsWith("-foreground")) continue;
			expect(LIGHT.has(token.slice(0, -"-foreground".length))).toBe(true);
		}
	});
});

describe("the @theme inline block", () => {
	// `inline` emits no variable of its own — it substitutes the raw value into
	// each utility. A token missing here is declared but unreachable: no `bg-*`
	// exists for it, and nothing anywhere reports that.
	test("aliases every token the variants declare", () => {
		for (const token of LIGHT) {
			if (UNALIASED.has(token)) continue;

			const aliases = aliasedTokens();
			const reachable = aliases.has(`--color-${token}`) || aliases.has(`--${token}`);
			expect(reachable).toBe(true);
		}
	});

	test("aliases nothing the variants do not declare", () => {
		// The fonts are the exception: they are split by platform rather than by
		// theme, in their own `:root` block, because no one family name works on
		// both iOS and Android.
		const fonts = new Set(["--font-sans", "--font-serif", "--font-mono"]);

		for (const alias of aliasedTokens()) {
			if (fonts.has(alias)) continue;

			const token = alias.replace(/^--(color-)?/, "");
			expect(LIGHT.has(token)).toBe(true);
		}
	});
});

describe("the corner scale", () => {
	const STEPS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;

	test("derives every step from --radius", () => {
		for (const step of STEPS) expect(radiusMultiplier(step)).toBeGreaterThan(0);
	});

	test("ascends, so a larger name is never a tighter corner", () => {
		const multipliers = STEPS.map(radiusMultiplier);
		expect([...multipliers].sort((a, b) => a - b)).toEqual(multipliers);
	});

	test("puts lg exactly on --radius, which is what a pasted theme sets", () => {
		expect(radiusMultiplier("lg")).toBe(1);
	});

	// `--radius-button-*` is a shape, not a step: half the button's own height,
	// so the button stays a capsule however a consumer retunes `--radius`.
	test("leaves the button's corner out of it", () => {
		for (const step of ["button-sm", "button-md", "button-lg"]) {
			expect(() => radiusMultiplier(step)).toThrow();
		}
	});
});
