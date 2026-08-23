import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NAVIGATION_THEME_TOKENS } from "./navigation-theme";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../styles/theme.css"), "utf-8");

/** Every `--color-*` name declared under one `@variant` block. */
function declaredColors(variant: "light" | "dark"): Set<string> {
	const block = THEME_CSS.split(`@variant ${variant} {`)[1]?.split("}")[0] ?? "";
	const names = new Set<string>();

	for (const [, name] of block.matchAll(/--color-([\w-]+):/g)) {
		names.add(name);
	}

	return names;
}

const LIGHT = declaredColors("light");
const DARK = declaredColors("dark");

/** The slots React Navigation's theme actually has. Missing one falls back to its light default. */
const REACT_NAVIGATION_SLOTS = ["background", "card", "text", "border", "primary", "notification"] as const;

describe("the theme.css reader", () => {
	// The assertions below are only worth anything if the parse found something.
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("NAVIGATION_THEME_TOKENS", () => {
	test("covers every slot React Navigation's theme has", () => {
		expect(Object.keys(NAVIGATION_THEME_TOKENS).sort()).toEqual([...REACT_NAVIGATION_SLOTS].sort());
	});

	// A slot pointing at a token no theme emits resolves to undefined, gets
	// dropped, and silently leaves React Navigation's light default in place —
	// which is the exact failure this whole hook exists to fix.
	test("names only tokens the light theme declares", () => {
		for (const token of Object.values(NAVIGATION_THEME_TOKENS)) {
			expect(LIGHT.has(token)).toBe(true);
		}
	});

	test("names only tokens the dark theme declares", () => {
		for (const token of Object.values(NAVIGATION_THEME_TOKENS)) {
			expect(DARK.has(token)).toBe(true);
		}
	});

	test("maps the background slot to the token a screen paints itself with", () => {
		// Screen's root is `bg-background`. If these two ever disagree, the
		// container behind a transition stops matching the cards in front of it.
		expect(NAVIGATION_THEME_TOKENS.background).toBe("background");
	});

	test("gives every slot its own token, so no two slots collapse together", () => {
		const tokens = Object.values(NAVIGATION_THEME_TOKENS);
		expect(new Set(tokens).size).toBe(tokens.length);
	});
});
