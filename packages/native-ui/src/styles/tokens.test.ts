import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BUTTON_SIZE_TOKENS, BUTTON_TEXT_TOKENS, ICON_SIZE_TOKENS, SCREEN_SIZE_TOKENS } from "./tokens";

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
		const registered = [...BUTTON_SIZE_TOKENS, ...ICON_SIZE_TOKENS, ...SCREEN_SIZE_TOKENS].sort();
		expect(declared).toEqual(registered);
	});

	test("declare exactly the same button text tokens", () => {
		const declared = [...TOKENS.keys()]
			.filter((name) => name.startsWith("text-button-"))
			.map((name) => name.replace("text-", ""))
			.sort();
		expect(declared).toEqual([...BUTTON_TEXT_TOKENS].sort());
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
});
