import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, withAxis } from "@delacour/design-system/config";
import { CONTRAST_PAIRS } from "@delacour/design-system/contrast-audit";
import { themeContrast } from "./theme-contrast";

describe("themeContrast", () => {
	test("the default config has no failures and counts every pair in both modes", () => {
		const report = themeContrast(DEFAULT_CONFIG);
		expect(report.failures).toEqual([]);
		expect(report.total).toBe(CONTRAST_PAIRS.length * 2);
	});

	test("a failing config names each failing pair, worst first", () => {
		const config = withAxis(withAxis(DEFAULT_CONFIG, "baseColor", "zinc"), "theme", "zinc");
		const report = themeContrast(config);
		expect(report.failures.length).toBeGreaterThan(0);
		const input = report.failures.find((row) => row.foreground === "input" && row.mode === "light");
		expect(input).toBeDefined();
		expect(input?.kind).toBe("non-text");
		expect(input?.ratio).toBeLessThan(input?.minimum ?? 0);
		const gaps = report.failures.map((row) => row.ratio / row.minimum);
		expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
	});

	test("labels are formatted for display", () => {
		const config = withAxis(withAxis(DEFAULT_CONFIG, "baseColor", "zinc"), "theme", "zinc");
		const row = themeContrast(config).failures[0];
		expect(row?.label).toBe(`--${row?.foreground} on --${row?.background}`);
		expect(row?.ratioLabel).toMatch(/^\d+\.\d{2}:1$/);
		expect(row?.minimumLabel).toMatch(/^\d+(\.\d)?:1$/);
	});
});
