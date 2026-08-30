import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The Tokens page lists exactly the tokens `theme.css` declares.
 *
 * It is a hand-written reference to a generated-feeling thing, which is the
 * shape documentation drifts in: a token added to the palette and never written
 * up is invisible to a reader, and a row left behind after one is renamed sends
 * them looking for a class that no longer exists. Neither breaks a build on its
 * own.
 *
 * Names only, deliberately. The values on the page are the *defaults*, and a
 * consumer's theme replaces them wholesale — pinning them would fail the build
 * for a retune that changed nothing a reader was misled by. The names are the
 * contract.
 *
 * Read as text and importing nothing, like `content.test.ts`.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const PAGE = readFileSync(join(import.meta.dirname, "..", "content/docs/native/getting-started/tokens.mdx"), "utf-8");
const THEME_CSS = readFileSync(join(ROOT, "packages/native-ui/src/styles/theme.css"), "utf-8");

/** Token names declared inside one `@variant` block, brace-matched. */
function declared(variant: "dark" | "light"): Set<string> {
	const marker = `@variant ${variant} {`;
	const start = THEME_CSS.indexOf(marker);
	if (start === -1) throw new Error(`theme.css declares no @variant ${variant}`);

	let depth = 1;
	let index = start + marker.length;

	while (index < THEME_CSS.length && depth > 0) {
		if (THEME_CSS[index] === "{") depth += 1;
		if (THEME_CSS[index] === "}") depth -= 1;
		index += 1;
	}

	const block = THEME_CSS.slice(start + marker.length, index - 1);

	return new Set([...block.matchAll(/^\s*--([\w-]+):/gm)].map(([, name]) => name));
}

/**
 * The first cell of every row in the two palette tables.
 *
 * Scoped to them rather than to the whole page: the table below lists what is
 * *not* a colour, and it names `--radius` and the fonts — which live in
 * `tokens.css`, not the palette, and would read here as tokens the theme forgot
 * to declare.
 */
function listed(): Set<string> {
	const start = PAGE.indexOf("## The shadcn set");
	const end = PAGE.indexOf("## Everything that is not a colour");
	if (start === -1 || end === -1) throw new Error("tokens.mdx no longer has the two palette tables");

	return new Set([...PAGE.slice(start, end).matchAll(/^\| `([\w-]+)` \|/gm)].map(([, name]) => name));
}

/**
 * Named in prose or in a link rather than given a row of their own.
 *
 * The shadow scale is one row covering eight tokens, because a reader picking a
 * shadow wants the range and not eight near-identical box-shadow strings; the
 * bare `--shadow` has no Tailwind namespace at all and so no utility to
 * document. `--radius` and the fonts are rows on the Sizing page.
 */
const OFF_TABLE = new Set([
	"shadow",
	"shadow-2xs",
	"shadow-xs",
	"shadow-sm",
	"shadow-md",
	"shadow-lg",
	"shadow-xl",
	"shadow-2xl",
]);

const LIGHT = declared("light");
const LISTED = listed();

describe("the Tokens page", () => {
	// Both assertions below pass vacuously if either parse came back empty.
	test("reads the page and the palette", () => {
		expect(LIGHT.size).toBeGreaterThan(30);
		expect(LISTED.size).toBeGreaterThan(30);
	});

	test("documents every token the palette declares", () => {
		const undocumented = [...LIGHT].filter((token) => !LISTED.has(token) && !OFF_TABLE.has(token));
		expect(undocumented).toEqual([]);
	});

	test("names no token the palette does not declare", () => {
		const stale = [...LISTED].filter((token) => !LIGHT.has(token) && !OFF_TABLE.has(token));
		expect(stale).toEqual([]);
	});

	// The whole claim of the page. If a token here is ever renamed away from
	// shadcn's spelling, this is the line that says so.
	test("keeps shadcn's own names", () => {
		for (const token of [
			"background",
			"foreground",
			"card",
			"popover",
			"primary",
			"secondary",
			"muted",
			"accent",
			"destructive",
			"border",
			"input",
			"ring",
			"chart-1",
			"sidebar",
		]) {
			expect(LISTED.has(token)).toBe(true);
		}
	});
});
