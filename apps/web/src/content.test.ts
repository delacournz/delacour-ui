import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * Every component page keeps the same shape.
 *
 * The pages follow shadcn's order — hero, `## Installation`, `## Usage`, flat
 * example sections, `## API Reference` — and the value of that is entirely in it
 * being the *same* order every time: a reader who has found the install block
 * once knows where it is on all nineteen. Nothing else can hold that. `tsc`
 * covers `**\/*.ts{,x}` only, so MDX is never typechecked, and a page that
 * quietly loses its install block renders perfectly well.
 *
 * Read as text and importing nothing, like `previews/previews.test.ts` and
 * `packages/native-ui/src/docs.test.ts`.
 */

const COMPONENTS_DIR = join(import.meta.dirname, "..", "content", "docs", "native", "components");

type Page = { slug: string; body: string };

function pages(): Page[] {
	return readdirSync(COMPONENTS_DIR)
		.filter((name) => name.endsWith(".mdx") && name !== "index.mdx")
		.sort()
		.map((name) => ({ slug: basename(name, ".mdx"), body: readFileSync(join(COMPONENTS_DIR, name), "utf-8") }));
}

const PAGES = pages();

/** The `##` headings, in order. */
function sections(body: string): string[] {
	return [...body.matchAll(/^## (.+)$/gm)].map(([, heading]) => (heading as string).trim());
}

describe("component pages", () => {
	// A walker that found nothing would let every assertion below pass vacuously.
	test("finds the component pages", () => {
		expect(PAGES.length).toBeGreaterThan(15);
	});

	test("every page has an Installation section", () => {
		const missing = PAGES.filter((page) => !sections(page.body).includes("Installation")).map((p) => p.slug);
		expect(missing).toEqual([]);
	});

	// The install block is derived from the registry, and the name is the key it
	// is read under. A mismatched one throws at render for a reader.
	test("every page installs itself", () => {
		const wrong = PAGES.filter((page) => !page.body.includes(`<ComponentInstall name="${page.slug}" />`)).map(
			(p) => p.slug
		);
		expect(wrong).toEqual([]);
	});

	test("Installation is the first section", () => {
		const wrong = PAGES.filter((page) => sections(page.body)[0] !== "Installation").map(
			(p) => `${p.slug} → ${sections(p.body)[0] ?? "(none)"}`
		);
		expect(wrong).toEqual([]);
	});

	test("every page has a Usage section, straight after Installation", () => {
		const wrong = PAGES.filter((page) => sections(page.body)[1] !== "Usage").map(
			(p) => `${p.slug} → ${sections(p.body)[1] ?? "(none)"}`
		);
		expect(wrong).toEqual([]);
	});

	// `## API`, the old heading, is not this. The rename is the whole point of
	// having one vocabulary across the site.
	test("every page ends at API Reference", () => {
		const wrong = PAGES.filter((page) => sections(page.body).at(-1) !== "API Reference").map(
			(p) => `${p.slug} → ${sections(p.body).at(-1) ?? "(none)"}`
		);
		expect(wrong).toEqual([]);
	});
});
