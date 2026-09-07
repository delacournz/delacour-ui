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

	// The Usage block is the one thing a reader pastes. A fragment that names
	// `save` or `setTab` without declaring them reads fine and does not compile,
	// and nothing on this site compiles MDX — so the shape is asserted as text.
	describe("Usage is one complete file", () => {
		test("exactly one tsx fence", () => {
			const wrong = PAGES.filter((page) => usageFences(page.body).length !== 1).map(
				(p) => `${p.slug} → ${usageFences(p.body).length}`
			);
			expect(wrong).toEqual([]);
		});

		test("the fence is titled as a file", () => {
			const wrong = PAGES.filter((page) => !usageFences(page.body).every((f) => f.title !== null)).map((p) => p.slug);
			expect(wrong).toEqual([]);
		});

		test("the fence imports and exports a default component", () => {
			const wrong = PAGES.filter(
				(page) =>
					!usageFences(page.body).every((f) => f.code.includes("import ") && f.code.includes("export default function"))
			).map((p) => p.slug);
			expect(wrong).toEqual([]);
		});

		test("the fence imports from the CLI alias, not the package", () => {
			const wrong = PAGES.filter(
				(page) =>
					!usageFences(page.body).every(
						(f) => f.code.includes('from "@/components/ui/') && !f.code.includes("delacour-react-native-ui/")
					)
			).map((p) => p.slug);
			expect(wrong).toEqual([]);
		});

		test("the fence has no placeholders", () => {
			const wrong = PAGES.filter((page) => usageFences(page.body).some((f) => f.code.includes("…"))).map((p) => p.slug);
			expect(wrong).toEqual([]);
		});
	});

	// `{…}` is a JSX expression holding an ellipsis, which does not parse. A bare
	// `…` as a child in a later fragment is fine; this one never is.
	test("no page holds a `{…}` placeholder", () => {
		const wrong = PAGES.filter((page) => page.body.includes("{…}")).map((p) => p.slug);
		expect(wrong).toEqual([]);
	});
});

/** The ```tsx fences between `## Usage` and the next `##`. */
function usageFences(body: string): { title: string | null; code: string }[] {
	const start = body.indexOf("\n## Usage");
	if (start === -1) return [];
	const rest = body.slice(start + "\n## Usage".length);
	const end = rest.search(/^## /m);
	const block = end === -1 ? rest : rest.slice(0, end);
	return [...block.matchAll(/^```tsx([^\n]*)\n([\s\S]*?)^```/gm)].map(([, meta, code]) => ({
		title: (meta as string).match(/title="([^"]+)"/)?.[1] ?? null,
		code: code as string,
	}));
}

/**
 * Getting Started opens on the Quick start — the page a reader lands on from
 * `/docs`, the navbar and the hero — and it is the one page whose fence must be
 * pasteable as a whole app.
 */

const GETTING_STARTED_DIR = join(CONTENT_DIR, "native", "getting-started");
const QUICK_START = join(GETTING_STARTED_DIR, "index.mdx");

function metaPages(dir: string): string[] {
	const path = join(dir, "meta.json");
	if (!existsSync(path)) return [];
	const meta = JSON.parse(readFileSync(path, "utf-8")) as { pages?: unknown };
	if (!Array.isArray(meta.pages)) return [];
	return meta.pages.filter((entry): entry is string => typeof entry === "string" && !entry.startsWith("---"));
}

describe("quick start", () => {
	const body = existsSync(QUICK_START) ? readFileSync(QUICK_START, "utf-8") : "";

	test("is the Getting Started index", () => {
		expect(body).toMatch(/^title: Quick start$/m);
		expect(metaPages(GETTING_STARTED_DIR)[0]).toBe("index");
	});

	test("is a numbered flow of copyable commands", () => {
		expect(body).toContain("<Steps>");
		expect(body.match(/<InstallTabs/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
	});

	test("carries one complete App.tsx whose first statement imports the CSS", () => {
		const fences = [...body.matchAll(/^```tsx title="App\.tsx"\n([\s\S]*?)^```/gm)].map(([, code]) => code as string);
		expect(fences.length).toBe(1);
		const code = fences[0] as string;
		expect(code.split("\n")[0]).toMatch(/^import "\.\/styles\/global\.css";$/);
		expect(code).toContain("export default function");
		expect(code).toContain("<DelacourProvider>");
		expect(code).not.toContain("…");
	});

	test("every getting-started page is listed, and every listed page exists", () => {
		const onDisk = pagesIn(GETTING_STARTED_DIR, { skipIndex: false }).map((page) => page.slug);
		const listed = metaPages(GETTING_STARTED_DIR);
		expect(listed.filter((slug) => !onDisk.includes(slug))).toEqual([]);
		expect(onDisk.filter((slug) => !listed.includes(slug))).toEqual([]);
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
