import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

const CONTENT_DIR = join(import.meta.dirname, "..", "content", "docs");
const COMPONENTS_DIR = join(CONTENT_DIR, "native", "components");
const CHARTS_DIR = join(CONTENT_DIR, "charts");

type Page = { slug: string; body: string };

function pagesIn(dir: string, { skipIndex }: { skipIndex: boolean }): Page[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => name.endsWith(".mdx") && !(skipIndex && name === "index.mdx"))
		.sort()
		.map((name) => ({ slug: basename(name, ".mdx"), body: readFileSync(join(dir, name), "utf-8") }));
}

const PAGES = pagesIn(COMPONENTS_DIR, { skipIndex: true });

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

/**
 * The chart engine pages — `content/docs/charts/` — are not component pages
 * and do not follow that shape: there is no registry to install from and no
 * single component to name. What they do share is the sidebar contract (every
 * page listed, nothing listed that does not exist) and, for the six pages that
 * each document one chart type, the same closing `## API Reference` heading
 * the component pages end on — so a reader who learned where the props are on
 * `Button` finds them in the same place on `Line`.
 */

const CHART_TYPE_PAGES = ["line", "area", "bar", "scatter", "candlestick", "pie"];

const CHART_PAGES = pagesIn(CHARTS_DIR, { skipIndex: false });

function chartsMetaPages(): string[] {
	const path = join(CHARTS_DIR, "meta.json");
	if (!existsSync(path)) return [];
	const meta = JSON.parse(readFileSync(path, "utf-8")) as { pages?: unknown };
	if (!Array.isArray(meta.pages)) return [];
	return meta.pages.filter((entry): entry is string => typeof entry === "string" && !entry.startsWith("---"));
}

describe("chart engine pages", () => {
	// A walker that found nothing would let every assertion below pass vacuously.
	test("finds the chart engine pages", () => {
		expect(CHART_PAGES.length).toBeGreaterThan(10);
	});

	test("every page listed in meta.json exists on disk", () => {
		const slugs = new Set(CHART_PAGES.map((page) => page.slug));
		const missing = chartsMetaPages().filter((slug) => !slugs.has(slug));
		expect(missing).toEqual([]);
	});

	// A page missing from `pages` still resolves by URL but never appears in the
	// sidebar, which is a page nobody finds.
	test("every page on disk is listed in meta.json", () => {
		const listed = new Set(chartsMetaPages());
		const unlisted = CHART_PAGES.filter((page) => !listed.has(page.slug)).map((page) => page.slug);
		expect(unlisted).toEqual([]);
	});

	test("every chart-type page ends at API Reference", () => {
		const wrong = CHART_PAGES.filter((page) => CHART_TYPE_PAGES.includes(page.slug))
			.filter((page) => sections(page.body).at(-1) !== "API Reference")
			.map((page) => `${page.slug} → ${sections(page.body).at(-1) ?? "(none)"}`);
		expect(wrong).toEqual([]);
	});

	test("every chart-type page is on disk", () => {
		const slugs = new Set(CHART_PAGES.map((page) => page.slug));
		expect(CHART_TYPE_PAGES.filter((slug) => !slugs.has(slug))).toEqual([]);
	});
});
