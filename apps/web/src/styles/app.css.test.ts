import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The docs site's palette, pinned against the library's.
 *
 * `app.css` cannot import `theme.css` — that file wires light and dark through
 * uniwind's `@variant`, which does not exist outside React Native — so it
 * transcribes the values by hand onto the `--color-fd-*` names Fumadocs paints
 * from. A transcription drifts, and this one drifts invisibly: the page still
 * renders, just in last season's greys, with every captured preview showing a
 * seam against the background behind it.
 *
 * Both files author `oklch()`, so the comparison is string equality rather than
 * a colour-space conversion that could disagree about rounding.
 */
const APP_CSS = readFileSync(join(import.meta.dirname, "app.css"), "utf-8");
const THEME_CSS = readFileSync(
	join(import.meta.dirname, "../../../../packages/native-ui/src/styles/theme.css"),
	"utf-8"
);

/** The body of one `@variant` block of `theme.css`, brace-matched. */
function libraryBlock(variant: "dark" | "light"): string {
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

	return THEME_CSS.slice(start + marker.length, index - 1);
}

/** The `@theme` block holds light; `.dark` holds dark. */
function docsBlock(variant: "dark" | "light"): string {
	const marker = variant === "light" ? "@theme {" : ".dark {";
	const start = APP_CSS.indexOf(marker) + marker.length;

	return APP_CSS.slice(start, APP_CSS.indexOf("}", start));
}

function declared(block: string, name: string): string | undefined {
	return block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();
}

/**
 * Fumadocs slot ← library token.
 *
 * `fd-card` is absent on purpose: `card` and `background` are the same white in
 * the library, and a docs card has to read as a surface, so `app.css` resolves
 * `tertiary` instead — a `color-mix` of two variables this file cannot see.
 */
const MAPPING: Record<string, string> = {
	"fd-background": "background",
	"fd-foreground": "foreground",
	"fd-muted": "muted",
	"fd-muted-foreground": "muted-foreground",
	"fd-popover": "popover",
	"fd-popover-foreground": "popover-foreground",
	"fd-card-foreground": "card-foreground",
	"fd-border": "border",
	"fd-primary": "primary",
	"fd-primary-foreground": "primary-foreground",
	"fd-secondary": "secondary",
	"fd-secondary-foreground": "secondary-foreground",
	"fd-accent": "accent",
	"fd-accent-foreground": "accent-foreground",
	"fd-ring": "ring",
	"fd-error": "destructive",
	"fd-warning": "warning",
	"fd-success": "success",
	"fd-info": "info",
};

describe("the docs palette", () => {
	// Every assertion below passes vacuously if a parse came back empty.
	test("reads both files", () => {
		expect(libraryBlock("light")).toContain("--background");
		expect(docsBlock("light")).toContain("--color-fd-background");
		expect(docsBlock("dark")).toContain("--color-fd-background");
	});

	for (const variant of ["light", "dark"] as const) {
		test(`matches the library's ${variant} theme, token for token`, () => {
			const docs = docsBlock(variant);
			const library = libraryBlock(variant);

			for (const [slot, token] of Object.entries(MAPPING)) {
				expect({ slot, value: declared(docs, `--color-${slot}`) }).toEqual({
					slot,
					value: declared(library, `--${token}`),
				});
			}
		});
	}

	// This one is what makes a captured preview seamless: `preview.tsx`
	// composites the simulator's shot onto `--color-fd-background`, and the
	// simulator painted the screen with `--background`.
	test("paints the page in the same colour the previews were captured on", () => {
		for (const variant of ["light", "dark"] as const) {
			expect(declared(docsBlock(variant), "--color-fd-background")).toBe(
				declared(libraryBlock(variant), "--background")
			);
		}
	});
});
