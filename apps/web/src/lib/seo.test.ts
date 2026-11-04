import { describe, expect, test } from "bun:test";
import {
	type DocsPageSeo,
	docsHead as docsHeadRaw,
	docsImageUrl,
	docsProduct,
	homeHead as homeHeadRaw,
	isDocsProduct,
	PRODUCTS,
	pageHead as pageHeadRaw,
} from "./seo";

type Meta = { name?: string; property?: string; content?: string; title?: string; "script:ld+json"?: unknown };
type JsonLd = { "@type": string; [key: string]: unknown };

function jsonLd(meta: Meta[]): JsonLd[] {
	return meta.flatMap((tag) => (tag["script:ld+json"] ? [tag["script:ld+json"] as JsonLd] : []));
}

/** Widened to one optional-field shape, so a test can read any tag without narrowing first. */
function docsHead(page: DocsPageSeo): { meta: Meta[]; links: { rel: string; href: string; type?: string }[] } {
	return docsHeadRaw(page);
}

type Widened = { meta: Meta[]; links: { rel: string; href: string; type?: string }[] };
const homeHead = (): Widened => homeHeadRaw();
const pageHead = (page: Parameters<typeof pageHeadRaw>[0]): Widened => pageHeadRaw(page);

function content(meta: Meta[], key: string): string | undefined {
	return meta.find((tag) => tag.name === key || tag.property === key)?.content;
}

/**
 * `@delacour/react-native-charts` and `@delacour/react-native-bottom-sheet` are separate
 * packages — Skia, Reanimated, keyboard-controller; no Tailwind, no Uniwind — so a link to
 * either's docs has to preview as that package, not as the component library's card.
 */
describe("docsProduct", () => {
	test("the charts tree is its own product", () => {
		expect(docsProduct(["charts"])).toBe("charts");
		expect(docsProduct(["charts", "line"])).toBe("charts");
	});

	test("the bottom-sheet tree is its own product", () => {
		expect(docsProduct(["bottom-sheet"])).toBe("bottom-sheet");
		expect(docsProduct(["bottom-sheet", "steps"])).toBe("bottom-sheet");
	});

	test("everything else is the component library", () => {
		expect(docsProduct([])).toBe("ui");
		expect(docsProduct(["native", "components", "button"])).toBe("ui");
		expect(docsProduct(["native", "components", "bottom-sheet"])).toBe("ui");
		expect(docsProduct(["chartsy"])).toBe("ui");
		expect(docsProduct(["ui"])).toBe("ui");
	});
});

describe("isDocsProduct", () => {
	test("admits every product in PRODUCTS and nothing else", () => {
		for (const product of Object.keys(PRODUCTS)) expect(isDocsProduct(product)).toBe(true);
		expect(isDocsProduct("chartsy")).toBe(false);
		expect(isDocsProduct("toString")).toBe(false);
		expect(isDocsProduct(null)).toBe(false);
		expect(isDocsProduct(undefined)).toBe(false);
	});
});

describe("docsImageUrl", () => {
	test("is absolute and names the page", () => {
		const url = new URL(docsImageUrl(["charts", "line"]));

		expect(url.origin).toBe("https://ui.delacour.co.nz");
		expect(url.pathname).toBe("/og/docs");
		expect(url.searchParams.get("page")).toBe("charts/line");
	});

	test("is the bare route for the docs root, which is the library's default card", () => {
		expect(docsImageUrl([])).toBe("https://ui.delacour.co.nz/og/docs");
	});
});

describe("docsHead", () => {
	test("the charts landing page carries charts' own title, description and card", () => {
		const { meta, links } = docsHead({
			slugs: ["charts"],
			title: "Overview",
			description: "A headless charting engine for React Native.",
		});

		expect(meta.find((tag) => tag.title)?.title).toBe(PRODUCTS.charts.headline);
		expect(content(meta, "og:site_name")).toBe("Delacour Charts");
		expect(content(meta, "og:title")).toBe(PRODUCTS.charts.headline);
		expect(content(meta, "description")).toBe("A headless charting engine for React Native.");
		expect(content(meta, "og:url")).toBe("https://ui.delacour.co.nz/docs/charts");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?page=charts");
		expect(content(meta, "twitter:image")).toBe(content(meta, "og:image"));
		expect(links).toContainEqual({ rel: "canonical", href: "https://ui.delacour.co.nz/docs/charts" });
	});

	test("never mentions Tailwind, Uniwind or shadcn on a charts page", () => {
		const { meta } = docsHead({ slugs: ["charts", "line"], title: "Line" });
		const text = meta.map((tag) => `${tag.title ?? ""} ${tag.content ?? ""}`).join(" ");

		expect(text).not.toMatch(/tailwind|uniwind|shadcn|design tokens/i);
		expect(text).toMatch(/skia/i);
	});

	test("an inner charts page is titled for itself under the charts name", () => {
		const { meta } = docsHead({ slugs: ["charts", "line"], title: "Line", description: "A stroked line." });

		expect(meta.find((tag) => tag.title)?.title).toBe("Line — Delacour Charts");
		expect(content(meta, "og:title")).toBe("Line — Delacour Charts");
		expect(content(meta, "og:description")).toBe("A stroked line.");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?page=charts%2Fline");
	});

	test("a page with no description falls back to its product's", () => {
		const { meta } = docsHead({ slugs: ["charts", "core"], title: "Core" });

		expect(content(meta, "description")).toBe(PRODUCTS.charts.description);
	});

	test("the bottom-sheet landing page carries its own title, card and canonical", () => {
		const { meta, links } = docsHead({ slugs: ["bottom-sheet"], title: "Overview" });

		expect(meta.find((tag) => tag.title)?.title).toBe(PRODUCTS["bottom-sheet"].headline);
		expect(content(meta, "og:site_name")).toBe("Delacour Bottom Sheet");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?page=bottom-sheet");
		expect(links).toContainEqual({ rel: "canonical", href: "https://ui.delacour.co.nz/docs/bottom-sheet" });
	});

	test("an inner bottom-sheet page is titled for itself, and never mentions a styling library", () => {
		const { meta } = docsHead({ slugs: ["bottom-sheet", "steps"], title: "Steps" });
		const text = meta.map((tag) => `${tag.title ?? ""} ${tag.content ?? ""}`).join(" ");

		expect(meta.find((tag) => tag.title)?.title).toBe("Steps — Delacour Bottom Sheet");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?page=bottom-sheet%2Fsteps");
		expect(text).not.toMatch(/tailwind|uniwind|shadcn|design tokens/i);
		expect(text).toMatch(/keyboard/i);
	});

	test("a component page stays under the library's name", () => {
		const { meta } = docsHead({ slugs: ["native", "components", "button"], title: "Button" });

		expect(meta.find((tag) => tag.title)?.title).toBe("React Native Button component — Delacour UI");
		expect(content(meta, "og:site_name")).toBe("Delacour UI");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?page=native%2Fcomponents%2Fbutton");
	});

	test("a guide page names React Native in its title", () => {
		const { meta } = docsHead({ slugs: ["native", "getting-started", "theming"], title: "Theming" });

		expect(meta.find((tag) => tag.title)?.title).toBe("Theming — Delacour UI for React Native");
	});

	test("the components index is not titled as one component", () => {
		const { meta } = docsHead({ slugs: ["native", "components"], title: "All Components" });

		expect(meta.find((tag) => tag.title)?.title).toBe("All Components — Delacour UI for React Native");
	});

	test("is an article, with an author", () => {
		const { meta } = docsHead({ slugs: ["native", "components", "button"], title: "Button" });

		expect(content(meta, "og:type")).toBe("article");
		expect(content(meta, "author")).toBe("Delacour");
	});

	test("every page links its Markdown twin for agents", () => {
		const { links } = docsHead({ slugs: ["native", "components", "button"], title: "Button" });

		expect(links).toContainEqual({
			rel: "alternate",
			type: "text/markdown",
			href: "https://ui.delacour.co.nz/docs/native/components/button.md",
		});
	});

	test("carries a TechArticle and a BreadcrumbList", () => {
		const { meta } = docsHead({ slugs: ["native", "components", "button"], title: "Button", description: "A press." });
		const [article, crumbs] = jsonLd(meta);

		expect(article?.["@type"]).toBe("TechArticle");
		expect(article?.headline).toBe("React Native Button component — Delacour UI");
		expect(article?.url).toBe("https://ui.delacour.co.nz/docs/native/components/button");
		expect(article?.author).toMatchObject({ "@type": "Organization", name: "Delacour" });
		expect(crumbs?.["@type"]).toBe("BreadcrumbList");
		expect(crumbs?.itemListElement).toHaveLength(3);
	});
});

describe("homeHead", () => {
	test("targets shadcn/ui for React Native in the title and description", () => {
		const { meta } = homeHead();
		const title = meta.find((tag) => tag.title)?.title ?? "";

		expect(title).toMatch(/shadcn\/ui/);
		expect(title).toMatch(/React Native/);
		expect(title.length).toBeLessThanOrEqual(60);
		expect(content(meta, "description")).toMatch(/shadcn/);
		expect((content(meta, "description") ?? "").length).toBeLessThanOrEqual(160);
	});

	test("is canonical at the origin and describes the site and the library", () => {
		const { meta, links } = homeHead();
		const types = jsonLd(meta).map((entry) => entry["@type"]);

		expect(links).toContainEqual({ rel: "canonical", href: "https://ui.delacour.co.nz/" });
		expect(types).toEqual(["WebSite", "SoftwareSourceCode", "FAQPage"]);
	});
});

describe("pageHead", () => {
	test("gives a marketing page a canonical with no query", () => {
		const { links, meta } = pageHead({ path: "/theme", title: "Neutral — Delacour UI", description: "CSS." });

		expect(links).toEqual([{ rel: "canonical", href: "https://ui.delacour.co.nz/theme" }]);
		expect(content(meta, "og:url")).toBe("https://ui.delacour.co.nz/theme");
		expect(content(meta, "og:title")).toBe("Neutral — Delacour UI");
	});
});
