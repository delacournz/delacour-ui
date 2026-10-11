import { describe, expect, test } from "bun:test";
import { type DocsProduct, PRODUCTS } from "@/lib/seo";
import { OG_DEFAULT_TITLE, OG_HEIGHT, OG_WIDTH, ogCardSvg, wrapTitle } from "./card";

describe("wrapTitle", () => {
	test("a short title is one line", () => {
		expect(wrapTitle("Button")).toEqual(["Button"]);
	});

	test("wraps on words, never inside one", () => {
		const lines = wrapTitle("Build your React Native component library");

		expect(lines.length).toBeGreaterThan(1);
		for (const line of lines) expect(line.length).toBeLessThanOrEqual(17);
		expect(lines.join(" ")).toBe("Build your React Native component library");
	});

	test("balances its lines rather than orphaning the last word", () => {
		expect(wrapTitle("Skia charts for React Native")).toEqual(["Skia charts for", "React Native"]);
		expect(wrapTitle("Progress Button with a label")).toEqual(["Progress Button", "with a label"]);
	});

	test("never runs past three lines", () => {
		const lines = wrapTitle("word ".repeat(60));

		expect(lines).toHaveLength(3);
		expect(lines[2]?.endsWith("…")).toBe(true);
	});

	test("a single word longer than the measure is cut, not run under the phone", () => {
		expect(wrapTitle("Supercalifragilisticexpialidociousness")).toEqual(["Supercalifragili…"]);
	});
});

describe("ogCardSvg", () => {
	test("is 1200 by 630", () => {
		expect(ogCardSvg()).toContain(`width="${OG_WIDTH}" height="${OG_HEIGHT}"`);
		expect(OG_WIDTH).toBe(1200);
		expect(OG_HEIGHT).toBe(630);
	});

	test("carries the page title, the site name and the mark", () => {
		const svg = ogCardSvg({ title: "Button" });

		expect(svg).toContain(">Button</text>");
		expect(svg).toContain(">DELACOUR UI</text>");
		expect(svg).toContain('stroke="#FBBF24"');
	});

	test("is set in the house mono, headings included, and in nothing else", () => {
		const svg = ogCardSvg({ title: "Button" });
		const families = new Set([...svg.matchAll(/font-family="([^"]+)"/g)].map((match) => match[1]));

		expect([...families]).toEqual(["JetBrains Mono"]);
		expect(svg).toMatch(/font-weight="600"[^>]*>Button<\/text>/);
	});

	test("spends amber on the mark and nowhere else", () => {
		for (const product of ["ui", "charts", "bottom-sheet"] as const) {
			const svg = ogCardSvg({ product });
			const outsideMark = svg.replace(/<g id="mark"[\s\S]*?<\/g><\/g>/, "");

			expect(svg).toContain('id="mark"');
			expect(outsideMark).not.toMatch(/#FBBF24/i);
		}
	});

	test("stands the library's real capture in the phone, and fakes nothing without one", () => {
		const svg = ogCardSvg({ capture: "data:image/png;base64,AAAA" });

		expect(svg).toContain('id="device"');
		expect(svg).toContain('href="data:image/png;base64,AAAA"');
		expect(svg).toContain('clip-path="url(#glass)"');
		expect(ogCardSvg()).not.toContain('id="device"');
	});

	test("keeps a three-line title and a two-line subtitle above the URL", () => {
		const svg = ogCardSvg({ title: "word ".repeat(60), subtitle: "word ".repeat(60) });
		const baselines = [...svg.matchAll(/<text[^>]* y="(\d+)"/g)].map((match) => Number(match[1]));
		const url = baselines.pop() ?? 0;

		expect(url).toBe(OG_HEIGHT - 64);
		expect(Math.max(...baselines)).toBeLessThan(url - 40);
	});

	test("falls back to the site's own line", () => {
		for (const line of wrapTitle(OG_DEFAULT_TITLE)) {
			expect(ogCardSvg()).toContain(`>${line}</text>`);
			expect(ogCardSvg({ title: "   " })).toContain(`>${line}</text>`);
		}
	});

	test("escapes markup in a title that arrived over a URL", () => {
		const svg = ogCardSvg({ title: `<script>alert("x")</script> & co` });

		expect(svg).not.toContain("<script>");
		expect(svg).toContain("&lt;script&gt;");
		expect(svg).toContain("&amp;");
	});

	test("paints the house dark page", () => {
		expect(ogCardSvg()).toContain('fill="#131313"');
	});
});

/**
 * Every package the site documents has a card of its own — its name, its line,
 * its docs URL and a motif the library's card does not draw — so a link to it
 * previews as that package in a feed. One row per product keeps the fourth
 * from arriving without one.
 */
const PACKAGE_CARDS: { product: DocsProduct; name: string; path: string; motif: string; page: string }[] = [
	{ product: "charts", name: "DELACOUR CHARTS", path: "/docs/charts", motif: "chart", page: "Line" },
	{
		product: "bottom-sheet",
		name: "DELACOUR BOTTOM SHEET",
		path: "/docs/bottom-sheet",
		motif: "sheet",
		page: "Snap points",
	},
];

describe.each(PACKAGE_CARDS)("ogCardSvg for $product", ({ product, name, path, motif, page }) => {
	test("is branded as the package, not the component library", () => {
		const svg = ogCardSvg({ product });

		expect(svg).toContain(`>${name}</text>`);
		expect(svg).not.toContain(">DELACOUR UI</text>");
		for (const line of wrapTitle(PRODUCTS[product].cardTitle)) expect(svg).toContain(`>${line}</text>`);
		expect(svg).toContain(`ui.delacour.co.nz${path}`);
	});

	test("draws its motif, which the library's card does not", () => {
		expect(ogCardSvg({ product })).toContain(`id="${motif}"`);
		expect(ogCardSvg()).not.toContain(`id="${motif}"`);
		expect(ogCardSvg({ product, capture: "data:image/png;base64,AAAA" })).not.toContain('id="device"');
	});

	test("draws no other package's motif", () => {
		const others = PACKAGE_CARDS.filter((card) => card.product !== product);
		for (const other of others) expect(ogCardSvg({ product })).not.toContain(`id="${other.motif}"`);
	});

	test("never says the web theme line", () => {
		expect(ogCardSvg({ product, title: page })).not.toMatch(/web theme|tailwind|uniwind/i);
	});
});
