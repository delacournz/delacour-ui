import { describe, expect, test } from "bun:test";
import { type DocsPageSeo, docsHead as docsHeadRaw, docsImageUrl, docsProduct, PRODUCTS } from "./seo";

type Meta = { name?: string; property?: string; content?: string; title?: string };

/** Widened to one optional-field shape, so a test can read any tag without narrowing first. */
function docsHead(page: DocsPageSeo): { meta: Meta[]; links: { rel: string; href: string }[] } {
	return docsHeadRaw(page);
}

function content(meta: Meta[], key: string): string | undefined {
	return meta.find((tag) => tag.name === key || tag.property === key)?.content;
}

/**
 * `@delacour/react-native-charts` is a separate package — Skia, no Tailwind, no Uniwind — so a
 * link to its docs has to preview as that package, not as the component library's card.
 */
describe("docsProduct", () => {
	test("the charts tree is its own product", () => {
		expect(docsProduct(["charts"])).toBe("charts");
		expect(docsProduct(["charts", "line"])).toBe("charts");
	});

	test("everything else is the component library", () => {
		expect(docsProduct([])).toBe("ui");
		expect(docsProduct(["native", "components", "button"])).toBe("ui");
		expect(docsProduct(["chartsy"])).toBe("ui");
	});
});

describe("docsImageUrl", () => {
	test("is absolute and names the product", () => {
		const url = new URL(docsImageUrl({ product: "charts", title: "Line" }));

		expect(url.origin).toBe("https://ui.delacour.co.nz");
		expect(url.pathname).toBe("/og/docs");
		expect(url.searchParams.get("product")).toBe("charts");
		expect(url.searchParams.get("title")).toBe("Line");
	});

	test("leaves the default product and an absent title out of the query", () => {
		expect(docsImageUrl({ product: "ui" })).toBe("https://ui.delacour.co.nz/og/docs");
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
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?product=charts");
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
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?product=charts&title=Line");
	});

	test("a page with no description falls back to its product's", () => {
		const { meta } = docsHead({ slugs: ["charts", "core"], title: "Core" });

		expect(content(meta, "description")).toBe(PRODUCTS.charts.description);
	});

	test("a component page stays under the library's name", () => {
		const { meta } = docsHead({ slugs: ["native", "components", "button"], title: "Button" });

		expect(meta.find((tag) => tag.title)?.title).toBe("Button — Delacour UI");
		expect(content(meta, "og:site_name")).toBe("Delacour UI");
		expect(content(meta, "og:image")).toBe("https://ui.delacour.co.nz/og/docs?title=Button");
	});
});
