import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderHouseCss, renderHouseMeta } from "../../scripts/gen-theme";

/**
 * The docs site's palette, held to the house preset.
 *
 * `house.css` and `house-meta.ts` are committed output of `bun run gen-theme`,
 * so the browser fetches the palette as plain CSS with no client work. Committed
 * output drifts the moment someone edits the preset and forgets the script, and
 * this drift is invisible: the site still renders, in last season's colours.
 * So each file is held equal to a fresh render — the same pattern
 * `emit.test.ts` uses against `tokens.css`.
 *
 * `app.css` itself is then held to declaring no palette of its own: every
 * `--color-fd-*` on the site comes through the generator or not at all.
 */
const STYLES = import.meta.dirname;
const APP_CSS = readFileSync(join(STYLES, "app.css"), "utf-8");
const HOUSE_CSS = readFileSync(join(STYLES, "house.css"), "utf-8");
const HOUSE_META = readFileSync(join(STYLES, "..", "lib", "house-meta.ts"), "utf-8");

describe("house.css", () => {
	test("is what `bun run gen-theme` writes today", () => {
		expect(HOUSE_CSS).toBe(renderHouseCss());
	});

	test("says so", () => {
		expect(HOUSE_CSS).toContain("Do not edit");
	});
});

describe("house-meta.ts", () => {
	test("is what `bun run gen-theme` writes today", () => {
		expect(HOUSE_META).toBe(renderHouseMeta());
	});
});

describe("app.css", () => {
	test("imports the generated palette after the library's scale", () => {
		const tokens = APP_CSS.indexOf('@import "delacour-react-native-ui/styles/tokens"');
		const house = APP_CSS.indexOf('@import "./house.css"');
		const neutral = APP_CSS.indexOf('@import "fumadocs-ui/css/neutral.css"');

		expect(tokens).toBeGreaterThan(-1);
		expect(house).toBeGreaterThan(tokens);
		expect(house).toBeGreaterThan(neutral);
	});

	test("declares no --color-fd-* literal of its own", () => {
		const declared = [...APP_CSS.matchAll(/--color-fd-[a-z-]+:\s*([^;]+);/g)];
		const literals = declared.filter(([, value]) => /(oklch|hsl|rgb|#)/.test(value ?? ""));

		expect(literals.map(([line]) => line)).toEqual([]);
	});

	test("carries no hex colour at all", () => {
		expect(APP_CSS).not.toMatch(/#[0-9a-f]{3,8}\b/i);
	});

	test("gives every px type step a line height", () => {
		for (const step of ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"]) {
			expect(APP_CSS).toContain(`--text-${step}--line-height:`);
		}
	});

	test("declares the rhythm and the radius scale", () => {
		for (const token of ["--spacing-section", "--spacing-section-gap", "--radius-card", "--radius-tile"]) {
			expect(APP_CSS).toContain(`${token}:`);
		}
	});

	/*
	 * The three column widths, in order. `measure` exists because the pill nav
	 * is `width: max-content` and is therefore wider than the reading column —
	 * a marketing page under it needs a measure that clears its own chrome. If
	 * it ever shrinks back under `reading` the page it was added for looks
	 * exactly as wrong as it did before.
	 */
	test("the column widths are ordered reading < measure < page", () => {
		const rem = (token: string): number => {
			const value = APP_CSS.match(new RegExp(`--container-${token}:\\s*([0-9.]+)rem;`))?.[1];
			if (!value) throw new Error(`--container-${token} is not declared in rem`);
			return Number(value);
		};

		expect(rem("reading")).toBeLessThan(rem("measure"));
		expect(rem("measure")).toBeLessThan(rem("page"));
	});
});
