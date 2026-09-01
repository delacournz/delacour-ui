import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, type DesignSystemConfig } from "@delacour/design-system/config";
import { encodePreset } from "@delacour/design-system/preset";
import { presetCss, resolvePreset, themeSummary, themeTitle } from "./theme-preset";

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

describe("resolvePreset", () => {
	test("no parameter is the default theme, not an error", () => {
		expect(resolvePreset(undefined)).toEqual({ status: "default", config: DEFAULT_CONFIG });
	});

	test("a code for the default config round-trips", () => {
		const code = encodePreset(DEFAULT_CONFIG);

		expect(resolvePreset(code)).toEqual({ status: "resolved", config: DEFAULT_CONFIG, code });
	});

	/**
	 * Without this, an encoder that returned a constant would pass the test
	 * above — and every link would render the default theme.
	 */
	test("a code for a non-default config round-trips too", () => {
		const original = config({ style: "rhea", baseColor: "stone", theme: "blue", chartColor: "blue", radius: "none" });
		const resolved = resolvePreset(encodePreset(original));

		expect(resolved.status).toBe("resolved");
		expect(resolved.config).toEqual(original);
	});

	describe("a code it cannot read still renders", () => {
		const BAD = [
			["empty", ""],
			["nonsense", "!!!!!!!!!!!"],
			["truncated", encodePreset(DEFAULT_CONFIG).slice(0, -1)],
			["one character too many", `${encodePreset(DEFAULT_CONFIG)}A`],
			["corrupted", `Z${encodePreset(DEFAULT_CONFIG).slice(1)}`],
		];

		for (const [label, code] of BAD) {
			test(label, () => {
				const resolved = resolvePreset(code);

				expect(resolved.config).toEqual(DEFAULT_CONFIG);
				expect(presetCss(resolved.config)).toContain("--primary:");
			});
		}
	});

	/**
	 * The whole safety claim of the route: `validateSearch` lets any string
	 * through, so this is what stands between a pasted URL and an error boundary.
	 */
	test("never throws, whatever the query string carried", () => {
		const hostile = [
			"",
			" ",
			"%00",
			"../../etc/passwd",
			"__proto__",
			"constructor",
			"a".repeat(10_000),
			"👋👋👋👋👋👋👋👋👋👋👋👋",
			"<script>alert(1)</script>",
		];

		for (const input of hostile) {
			expect(() => resolvePreset(input)).not.toThrow();
			expect(() => presetCss(resolvePreset(input).config)).not.toThrow();
		}
	});
});

describe("themeSummary", () => {
	test("names all seven axes, in the customizer's order", () => {
		const rows = themeSummary(DEFAULT_CONFIG);

		expect(rows.map((row) => row.label)).toEqual([
			"Style",
			"Radius",
			"Base Color",
			"Theme",
			"Chart Color",
			"Heading",
			"Font",
		]);
	});

	test("every row carries a value", () => {
		for (const row of themeSummary(config({ style: "rhea", baseColor: "mist", theme: "violet" }))) {
			expect(row.value.length).toBeGreaterThan(0);
		}
	});

	test("reads titles off the shared data rather than the config's ids", () => {
		const rows = themeSummary(config({ style: "rhea", baseColor: "stone", theme: "blue", radius: "large" }));
		const value = (label: string) => rows.find((row) => row.label === label)?.value;

		expect(value("Style")).toBe("Rhea");
		expect(value("Base Color")).toBe("Stone");
		expect(value("Theme")).toBe("Blue");
		expect(value("Radius")).toBe("Large");
	});

	test("an inherited heading says what it inherited", () => {
		const rows = themeSummary(config({ font: "lora", fontHeading: "inherit" }));

		expect(rows.find((row) => row.label === "Heading")?.value).toBe("Inherit (Lora)");
	});

	test("a chosen heading is named outright", () => {
		const rows = themeSummary(config({ fontHeading: "playfair-display" }));

		expect(rows.find((row) => row.label === "Heading")?.value).toBe("Playfair Display");
	});
});

describe("themeTitle", () => {
	test("names the style and the base colour", () => {
		expect(themeTitle(DEFAULT_CONFIG)).toBe("Vega · Neutral");
	});

	test("adds the accent when there is one", () => {
		expect(themeTitle(config({ theme: "blue" }))).toBe("Vega · Neutral · Blue");
	});

	test("two themes do not share a title", () => {
		expect(themeTitle(config({ style: "rhea" }))).not.toBe(themeTitle(DEFAULT_CONFIG));
	});
});

describe("presetCss", () => {
	test("carries both modes and the radius", () => {
		const css = presetCss(DEFAULT_CONFIG);

		expect(css).toContain(":root {");
		expect(css).toContain(".dark {");
		expect(css).toContain("--radius: 0.625rem;");
	});

	test("a different config gives different CSS", () => {
		expect(presetCss(config({ theme: "blue" }))).not.toBe(presetCss(DEFAULT_CONFIG));
	});
});
