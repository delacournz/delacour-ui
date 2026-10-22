import { describe, expect, test } from "bun:test";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG } from "./config";
import { auditTheme, formatThemeQualityReport } from "./quality";
import { resolveTokens } from "./resolve";
import { ACCENT_THEMES } from "./themes";

describe("theme quality", () => {
	test("names both tokens when a text pair has too little contrast", () => {
		const tokens = resolveTokens(DEFAULT_CONFIG);
		tokens.light["primary-foreground"] = tokens.light.primary;
		const result = auditTheme(tokens).find((row) => row.mode === "light" && row.foreground === "primary-foreground");
		expect(result).toMatchObject({ background: "primary", minimum: 4.5, ratio: 1, status: "fail" });
		expect(result?.label).toContain("Loading");
	});

	test("keeps the two modes separate and leaves the input unchanged", () => {
		const tokens = resolveTokens(DEFAULT_CONFIG);
		const before = structuredClone(tokens);
		const results = auditTheme(tokens);
		expect(results.filter((row) => row.mode === "light").length).toBe(results.length / 2);
		expect(results.filter((row) => row.mode === "dark").length).toBe(results.length / 2);
		expect(results.find((row) => row.foreground === "foreground")).toMatchObject({ status: "pass" });
		expect(tokens).toEqual(before);
	});

	test("reports absent, translucent, and invalid colors as unknown", () => {
		const tokens = resolveTokens(DEFAULT_CONFIG);
		delete tokens.light.foreground;
		tokens.light.primary = "oklch(0.5 0 0 / 50%)";
		tokens.dark.card = "oklch(. 0 0)";
		const results = auditTheme(tokens);
		for (const row of results.filter((row) => row.mode === "dark" && row.background === "card")) {
			expect(row.status).toBe("unknown");
			expect(row.ratio).toBeNull();
		}
		expect(results.find((row) => row.mode === "light" && row.foreground === "foreground")?.status).toBe("unknown");
		expect(results.find((row) => row.mode === "light" && row.background === "primary")?.status).toBe("unknown");
	});

	test("uses 3:1 only for the measured non-text indicators", () => {
		const results = auditTheme(resolveTokens(DEFAULT_CONFIG));
		for (const row of results) {
			const indicator = row.foreground === "ring" || row.foreground.startsWith("chart-");
			expect(row.minimum).toBe(indicator ? 3 : 4.5);
			if (row.ratio !== null) expect(row.status).toBe(row.ratio >= row.minimum ? "pass" : "fail");
		}
	});

	test("reads every supported palette without unknown measured pairs", () => {
		for (const base of BASE_COLORS) {
			for (const theme of [base.name, ...ACCENT_THEMES.map((accent) => accent.name)]) {
				const results = auditTheme(resolveTokens({ ...DEFAULT_CONFIG, baseColor: base.name, theme }));
				expect(results.some((row) => row.status === "unknown")).toBe(false);
			}
		}
	});

	test("exports the preset, exact token values, results, and limits", () => {
		const results = auditTheme(resolveTokens(DEFAULT_CONFIG));
		const report = formatThemeQualityReport(results, "sample-preset");
		expect(report).toContain("Preset: sample-preset");
		expect(report).toContain("--primary-foreground");
		expect(report).toContain("oklch(");
		expect(report).toContain("Light");
		expect(report).toContain("Dark");
		expect(report).toContain("Disabled states");
		expect(report).toContain("does not certify accessibility");
	});
});
