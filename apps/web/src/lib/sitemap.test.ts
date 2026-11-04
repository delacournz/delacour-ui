import { describe, expect, test } from "bun:test";
import { MARKETING_PATHS, sitemapXml } from "./sitemap";

describe("sitemapXml", () => {
	test("lists every path absolute, under the production origin", () => {
		const xml = sitemapXml(["/", "/docs/native/components/button"]);

		expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain("<loc>https://ui.delacour.co.nz/</loc>");
		expect(xml).toContain("<loc>https://ui.delacour.co.nz/docs/native/components/button</loc>");
	});

	test("lists a path once, however often it is passed", () => {
		const xml = sitemapXml(["/", "/", "/privacy"]);

		expect(xml.match(/<loc>https:\/\/ui\.delacour\.co\.nz\/<\/loc>/g)).toHaveLength(1);
	});

	test("escapes XML in a path", () => {
		expect(sitemapXml(["/a&b"])).toContain("<loc>https://ui.delacour.co.nz/a&amp;b</loc>");
	});

	test("never lists a /theme?preset= URL — the space robots.txt closes", () => {
		expect(() => sitemapXml(["/theme?preset=AQgHGRkT"])).toThrow(/query/);
	});
});

describe("MARKETING_PATHS", () => {
	test("covers the routes outside /docs a search result should land on", () => {
		expect(MARKETING_PATHS).toEqual(["/", "/compare/heroui", "/theme", "/privacy"]);
	});
});
