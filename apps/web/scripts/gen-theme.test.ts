import { describe, expect, test } from "bun:test";
import { HOUSE_CONFIG } from "@delacour/design-system/house";
import { resolveTokens } from "@delacour/design-system/resolve";
import { fontDeclarations, houseMeta, MAPPING, oklchToHex, renderHouseCss, renderHouseMeta } from "./gen-theme";

/**
 * The generator, held to the preset it reads.
 *
 * `app.css.test.ts` holds the committed `house.css` to a fresh render; this
 * holds the render itself to `resolveTokens(HOUSE_CONFIG)`, so a mapping that
 * quietly pointed `fd-primary` at the wrong token would fail here rather than
 * ship a grey button on an amber site.
 */

describe("oklchToHex", () => {
	test("white and black", () => {
		expect(oklchToHex("oklch(1 0 0)")).toBe("#ffffff");
		expect(oklchToHex("oklch(0 0 0)")).toBe("#000000");
	});

	test("the library's near-white page is Tailwind's neutral-50", () => {
		expect(oklchToHex("oklch(0.985 0 0)")).toBe("#fafafa");
	});

	test("zinc-950, which the house paints its dark page in", () => {
		expect(oklchToHex("oklch(0.141 0.005 285.823)")).toBe("#09090b");
	});

	test("agrees with culori — the library the playground converts with", () => {
		expect(oklchToHex("oklch(0.769 0.188 70.08)")).toBe("#fe9a00");
		expect(oklchToHex("oklch(0.21 0.006 285.885)")).toBe("#18181b");
	});

	test("ignores an alpha channel", () => {
		expect(oklchToHex("oklch(1 0 0 / 10%)")).toBe("#ffffff");
	});

	test("rejects anything that is not oklch()", () => {
		expect(() => oklchToHex("#fff")).toThrow();
		expect(() => oklchToHex("hsl(0, 0%, 100%)")).toThrow();
	});
});

describe("renderHouseCss", () => {
	const css = renderHouseCss();
	const { light, dark } = resolveTokens(HOUSE_CONFIG);

	test("says it is generated", () => {
		expect(css.startsWith("/*")).toBe(true);
		expect(css).toContain("Do not edit");
	});

	test("declares one @theme block and one .dark block", () => {
		expect(css.match(/@theme \{/g)).toHaveLength(1);
		expect(css.match(/\.dark \{/g)).toHaveLength(1);
	});

	test("every mapped slot carries the resolved value, in both modes", () => {
		const themeBlock = css.slice(css.indexOf("@theme {"), css.indexOf(".dark {"));
		const darkBlock = css.slice(css.indexOf(".dark {"));

		for (const [slot, token] of MAPPING) {
			expect(themeBlock).toContain(`--color-${slot}: ${String(light[token])};`);
			expect(darkBlock).toContain(`--color-${slot}: ${String(dark[token])};`);
		}
	});

	test("the primary is the brand amber in dark", () => {
		expect(css.slice(css.indexOf(".dark {"))).toContain("--color-fd-primary: oklch(0.837 0.164 84.429);");
		// One unit of blue off the site's `#fbbf24` — the oklch transcription's rounding, not the converter's.
		expect(["#fbbf24", "#fbbf25"]).toContain(oklchToHex("oklch(0.837 0.164 84.429)"));
	});

	test("a card is not the page in light", () => {
		expect(String(light.card)).not.toBe(String(light.background));
	});

	/**
	 * The previews are photographed on the house background — `bun run previews`
	 * pins `HOUSE_CONFIG` on the capture route. The frame a capture sits in has
	 * to be that colour or the image meets its frame with a seam. It keeps its
	 * own token so the day the capture preset changes, this line changes with it.
	 */
	test("carries the capture background from the house preset, in both modes", () => {
		expect(css.slice(0, css.indexOf(".dark {"))).toContain(`--color-capture: ${String(light.background)};`);
		expect(css.slice(css.indexOf(".dark {"))).toContain(`--color-capture: ${String(dark.background)};`);
	});

	test("the radius is the house corner in rem", () => {
		expect(css).toContain("--radius: 0.45rem;");
	});

	test("names the three faces with a fallback stack each", () => {
		expect(css).toContain("--font-sans: Inter, ui-sans-serif");
		expect(css).toContain("--font-heading: Outfit, ui-sans-serif");
		expect(css).toContain('--font-mono: "Geist Mono", ui-monospace');
	});

	test("carries no hex literal", () => {
		expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
	});
});

describe("fontDeclarations", () => {
	test("every face has somewhere to fall back to", () => {
		for (const [, value] of fontDeclarations()) {
			expect(value.split(",").length).toBeGreaterThan(2);
		}
	});
});

describe("houseMeta", () => {
	test("is the page background in each mode", () => {
		expect(houseMeta()).toEqual({ light: "#fafafa", dark: "#09090b" });
	});

	test("renders as a module carrying both", () => {
		const source = renderHouseMeta();

		expect(source).toContain('light: "#fafafa"');
		expect(source).toContain('dark: "#09090b"');
		expect(source).toContain("Do not edit");
	});
});
