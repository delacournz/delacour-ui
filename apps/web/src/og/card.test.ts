import { describe, expect, test } from "bun:test";
import { type DocsProduct, PRODUCTS } from "@/lib/seo";
import { OG_DEFAULT_TITLE, OG_HEIGHT, OG_WIDTH, ogCardSvg, wrapTitle } from "./card";

describe("wrapTitle", () => {
	test("a short title is one line", () => {
		expect(wrapTitle("Button")).toEqual(["Button"]);
	});

	test("wraps on words, never inside one", () => {
		const lines = wrapTitle("Build your React Native component library, and own every file of it");

		expect(lines.length).toBeGreaterThan(1);
		for (const line of lines) expect(line.length).toBeLessThanOrEqual(30);
		expect(lines.join(" ")).toBe("Build your React Native component library, and own every file of it");
	});

	test("never runs past three lines", () => {
		const lines = wrapTitle("word ".repeat(60));

		expect(lines).toHaveLength(3);
		expect(lines[2]?.endsWith("…")).toBe(true);
	});

	test("a single word longer than the measure still lands", () => {
		expect(wrapTitle("Supercalifragilisticexpialidociousness")).toEqual(["Supercalifragilisticexpialidociousness"]);
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
		expect(svg).toContain(">Delacour UI</text>");
		expect(svg).toContain('stroke="#FBBF24"');
	});

	test("falls back to the site's own line", () => {
		expect(ogCardSvg()).toContain(`>${OG_DEFAULT_TITLE}</text>`);
		expect(ogCardSvg({ title: "   " })).toContain(`>${OG_DEFAULT_TITLE}</text>`);
	});

	test("escapes markup in a title that arrived over a URL", () => {
		const svg = ogCardSvg({ title: `<script>alert("x")</script> & co` });

		expect(svg).not.toContain("<script>");
		expect(svg).toContain("&lt;script&gt;");
		expect(svg).toContain("&amp;");
	});

	test("paints the house dark page", () => {
		expect(ogCardSvg()).toContain('fill="#09090b"');
	});
});

/**
 * Every package the site documents has a card of its own — its name, its line,
 * its docs URL and a motif the library's card does not draw — so a link to it
 * previews as that package in a feed. One row per product keeps the fourth
 * from arriving without one.
 */
const PACKAGE_CARDS: { product: DocsProduct; name: string; path: string; motif: string; page: string }[] = [
	{ product: "charts", name: "Delacour Charts", path: "/docs/charts", motif: "chart", page: "Line" },
	{
		product: "bottom-sheet",
		name: "Delacour Bottom Sheet",
		path: "/docs/bottom-sheet",
		motif: "sheet",
		page: "Snap points",
	},
];

describe.each(PACKAGE_CARDS)("ogCardSvg for $product", ({ product, name, path, motif, page }) => {
	test("is branded as the package, not the component library", () => {
		const svg = ogCardSvg({ product });

		expect(svg).toContain(`>${name}</text>`);
		expect(svg).not.toContain(">Delacour UI</text>");
		expect(svg).toContain(`>${PRODUCTS[product].cardTitle}</text>`);
		expect(svg).toContain(`ui.delacour.co.nz${path}`);
	});

	test("draws its motif, which the library's card does not", () => {
		expect(ogCardSvg({ product })).toContain(`id="${motif}"`);
		expect(ogCardSvg()).not.toContain(`id="${motif}"`);
	});

	test("draws no other package's motif", () => {
		const others = PACKAGE_CARDS.filter((card) => card.product !== product);
		for (const other of others) expect(ogCardSvg({ product })).not.toContain(`id="${other.motif}"`);
	});

	test("never says the web theme line", () => {
		expect(ogCardSvg({ product, title: page })).not.toMatch(/web theme|tailwind|uniwind/i);
	});
});
