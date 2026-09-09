import { describe, expect, test } from "bun:test";
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
