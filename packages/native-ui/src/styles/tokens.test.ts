import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	BUTTON_RADIUS_TOKENS,
	BUTTON_SIZE_TOKENS,
	BUTTON_TEXT_TOKENS,
	CHART_SIZE_TOKENS,
	ICON_SIZE_TOKENS,
	INPUT_SIZE_TOKENS,
	INPUT_TEXT_TOKENS,
	SCREEN_SIZE_TOKENS,
} from "./tokens";

const CSS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8");

/** Every `--name: 12px` declaration in `tokens.css`, as a name → points map. */
function declarations(): Map<string, number> {
	const found = new Map<string, number>();
	for (const [, name, value] of CSS.matchAll(/--([\w-]+):\s*([\d.]+)px;/g)) {
		found.set(name, Number(value));
	}
	return found;
}

const TOKENS = declarations();

/** Points behind a token, failing loudly rather than yielding NaN. */
function px(name: string): number {
	const value = TOKENS.get(name);
	if (value === undefined) throw new Error(`tokens.css defines no --${name}`);
	return value;
}

describe("tokens.ts and tokens.css", () => {
	// The registry drives `cn`'s tailwind-merge extension. A token in the CSS
	// that is missing here is an override that silently stops working; a name
	// here with no CSS behind it is a class that compiles to nothing.
	test("declare exactly the same spacing tokens", () => {
		const declared = [...TOKENS.keys()]
			.filter((name) => name.startsWith("spacing-"))
			.map((name) => name.replace("spacing-", ""))
			.sort();
		const registered = [
			...BUTTON_SIZE_TOKENS,
			...CHART_SIZE_TOKENS,
			...ICON_SIZE_TOKENS,
			...INPUT_SIZE_TOKENS,
			...SCREEN_SIZE_TOKENS,
		].sort();
		expect(declared).toEqual(registered);
	});

	test("declare exactly the same button text tokens", () => {
		const declared = [...TOKENS.keys()]
			.filter((name) => name.startsWith("text-button-"))
			.map((name) => name.replace("text-", ""))
			.sort();
		expect(declared).toEqual([...BUTTON_TEXT_TOKENS].sort());
	});

	test("declare exactly the same button radius tokens", () => {
		const declared = [...TOKENS.keys()]
			.filter((name) => name.startsWith("radius-button-"))
			.map((name) => name.replace("radius-", ""))
			.sort();
		expect(declared).toEqual([...BUTTON_RADIUS_TOKENS].sort());
	});

	test("declare exactly the same input text tokens", () => {
		const declared = [...TOKENS.keys()]
			.filter((name) => name.startsWith("text-input-"))
			.map((name) => name.replace("text-", ""))
			.sort();
		expect(declared).toEqual([...INPUT_TEXT_TOKENS].sort());
	});
});

describe("the chart scale", () => {
	test("ascends in the order the registry lists it", () => {
		const values = CHART_SIZE_TOKENS.map((token) => px(`spacing-${token}`));
		expect(values).toEqual([...values].sort((a, b) => a - b));
		expect(new Set(values).size).toBe(CHART_SIZE_TOKENS.length);
	});

	test("stays taller than a control, since a chart is a region and not a row", () => {
		// A chart shorter than an input would have no room for an axis under its
		// own plot, and the labels would collide with the marks.
		expect(px("spacing-chart-sm")).toBeGreaterThan(px("spacing-input-lg"));
	});
});

describe("the icon scale", () => {
	// Component tests compare tokens by their index in ICON_SIZE_TOKENS rather
	// than by looking up points, which only means anything while the array is
	// ordered. This is the test that keeps that true.
	test("ascends in the order the registry lists it", () => {
		const values = ICON_SIZE_TOKENS.map((token) => px(`spacing-${token}`));
		expect(values).toEqual([...values].sort((a, b) => a - b));
		expect(new Set(values).size).toBe(ICON_SIZE_TOKENS.length);
	});
});

describe("the button scale", () => {
	test("ascends in the order the registry lists it", () => {
		const values = BUTTON_SIZE_TOKENS.map((token) => px(`spacing-${token}`));
		expect(values).toEqual([...values].sort((a, b) => a - b));
		expect(new Set(values).size).toBe(BUTTON_SIZE_TOKENS.length);
	});

	test("pairs each height with a label size and an icon that fit inside it", () => {
		for (const [index, token] of BUTTON_SIZE_TOKENS.entries()) {
			const height = px(`spacing-${token}`);
			expect(px(`text-${BUTTON_TEXT_TOKENS[index]}`)).toBeLessThan(height);
			// A button's icon indexes the shared scale at the same step name.
			expect(px(`spacing-icon-${token.replace("button-", "")}`)).toBeLessThan(height);
		}
	});

	test("scales the label with the height", () => {
		const text = BUTTON_TEXT_TOKENS.map((token) => px(`text-${token}`));
		expect(text).toEqual([...text].sort((a, b) => a - b));
	});

	// A radius past half the height is silently clamped to half by the
	// renderer, so a number above it would stop meaning what it says — and the
	// step it sits at would stop being retunable. Equal to half, which is what
	// every step is today, draws the capsule the button ships as.
	test("gives each height a corner it can actually draw", () => {
		for (const [index, token] of BUTTON_SIZE_TOKENS.entries()) {
			const height = px(`spacing-${token}`);
			expect(px(`radius-${BUTTON_RADIUS_TOKENS[index]}`)).toBeLessThanOrEqual(height / 2);
		}
	});

	test("scales the corner with the height", () => {
		const radii = BUTTON_RADIUS_TOKENS.map((token) => px(`radius-${token}`));
		expect(radii).toEqual([...radii].sort((a, b) => a - b));
		expect(new Set(radii).size).toBe(BUTTON_RADIUS_TOKENS.length);
	});

	// The three scales are indexed by the same step name — `button-md` names a
	// height, a label size and a corner — so a step added to one and not the
	// others would compile to a class with nothing behind it.
	test("names its steps the same way across all three scales", () => {
		expect([...BUTTON_RADIUS_TOKENS]).toEqual([...BUTTON_SIZE_TOKENS]);
		expect([...BUTTON_TEXT_TOKENS]).toEqual([...BUTTON_SIZE_TOKENS]);
	});
});

describe("the input scale", () => {
	test("ascends in the order the registry lists it", () => {
		const values = INPUT_SIZE_TOKENS.map((token) => px(`spacing-${token}`));
		expect(values).toEqual([...values].sort((a, b) => a - b));
		expect(new Set(values).size).toBe(INPUT_SIZE_TOKENS.length);
	});

	test("pairs each height with a text size and an icon that fit inside it", () => {
		for (const [index, token] of INPUT_SIZE_TOKENS.entries()) {
			const height = px(`spacing-${token}`);
			expect(px(`text-${INPUT_TEXT_TOKENS[index]}`)).toBeLessThan(height);
			// A decorator's icon indexes the shared scale at the same step name.
			expect(px(`spacing-icon-${token.replace("input-", "")}`)).toBeLessThan(height);
		}
	});

	test("scales the text with the height", () => {
		const text = INPUT_TEXT_TOKENS.map((token) => px(`text-${token}`));
		expect(text).toEqual([...text].sort((a, b) => a - b));
	});

	// `Input` and `Button` are the two controls a form puts side by side, so a
	// field that stood a step taller than the button beside it would read as a
	// mistake. They are separate scales precisely so this is asserted rather
	// than assumed — see the note in tokens.css.
	test("stands exactly as tall as the button beside it", () => {
		for (const [index, token] of INPUT_SIZE_TOKENS.entries()) {
			expect(px(`spacing-${token}`)).toBe(px(`spacing-${BUTTON_SIZE_TOKENS[index]}`));
		}
	});
});
